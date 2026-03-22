/**
 * Server component: loads trips for `/dashboard/trips` (Liste + Kanban).
 *
 * Date filtering is easy to get wrong: see `docs/trips-date-filter.md` for the
 * “stuck cards” incident (global `scheduled_at IS NULL` vs scoped unscheduled).
 */
import { searchParamsCache } from '@/lib/searchparams';
import { createClient } from '@/lib/supabase/server';
import { TripsTable, columns } from './trips-tables/index';
import { Trip } from '../api/trips.service';
import { getSortingStateParser } from '@/lib/parsers';
import { TripsViewToggle } from './trips-view-toggle';
import { TripsKanbanBoard } from './trips-kanban-board';
import { TripsFiltersBar } from './trips-filters-bar';
import type { SearchParams } from 'nuqs/server';
import {
  getZonedDayBoundsIso,
  instantToYmdInBusinessTz,
  isYmdString,
  todayYmdInBusinessTz
} from '@/features/trips/lib/trip-business-date';

type TripsListingPageProps = {
  /** Same Promise as `page.tsx` — must be parsed in this async tree so filters match the URL. */
  searchParams: Promise<SearchParams>;
};

export default async function TripsListingPage({
  searchParams
}: TripsListingPageProps) {
  await searchParamsCache.parse(searchParams);

  const view = searchParamsCache.get('view') || 'list';
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');

  // Trip filters
  const status = searchParamsCache.get('status');
  const driverId = searchParamsCache.get('driver_id');
  const payerId = searchParamsCache.get('payer_id');
  const billingTypeId = searchParamsCache.get('billing_type_id');
  const search = searchParamsCache.get('search');
  const scheduledAt = searchParamsCache.get('scheduled_at');

  const supabase = await createClient();
  let query = supabase.from('trips').select(
    `
    *,
    payer:payers(name),
    billing_type:billing_types(name, color),
    driver:accounts!trips_driver_id_fkey(name)
  `,
    { count: 'exact' }
  );

  // Apply filters
  if (status) {
    if (status.includes(',')) {
      query = query.in('status', status.split(','));
    } else {
      query = query.eq('status', status);
    }
  }
  if (driverId && driverId !== 'all') {
    if (driverId === 'unassigned') {
      query = query.is('driver_id', null);
    } else {
      query = query.eq('driver_id', driverId);
    }
  }
  if (payerId && payerId !== 'all') {
    query = query.eq('payer_id', payerId);
  }
  if (billingTypeId) {
    query = query.eq('billing_type_id', billingTypeId);
  }
  if (search) {
    const term = search.replace(/'/g, "''");
    query = query.or(
      `client_name.ilike.%${term}%,pickup_address.ilike.%${term}%,dropoff_address.ilike.%${term}%`
    );
  }
  /**
   * --- Date filter (`scheduled_at` URL param) ---
   *
   * We need BOTH:
   * - Trips with a real time (`scheduled_at` in the user’s selected day or range).
   * - Trips without a time yet (`scheduled_at` NULL) that still “belong” to that day.
   *
   * Anti-pattern (old behaviour): OR-ing plain `scheduled_at.is.null` matched EVERY
   * unscheduled trip in the DB on EVERY date → Kanban looked like old cards were
   * “stuck” when changing the calendar. See `docs/trips-date-filter.md`.
   *
   * Current pattern: unscheduled rows must also match `requested_date` (or the
   * narrow “fully undated backlog” branch for server-“today” only).
   */
  if (scheduledAt) {
    const parts = scheduledAt.split(',');

    if (parts.length === 2) {
      const [from, to] = parts;
      if (from && to) {
        const fromMs = Number(from);
        const toMs = Number(to);
        if (!Number.isNaN(fromMs) && !Number.isNaN(toMs)) {
          const fromYmd = instantToYmdInBusinessTz(fromMs);
          const toYmd = instantToYmdInBusinessTz(toMs);
          const { startISO } = getZonedDayBoundsIso(fromYmd);
          const { endExclusiveISO } = getZonedDayBoundsIso(toYmd);
          query = query.or(
            [
              `and(scheduled_at.gte.${startISO},scheduled_at.lt.${endExclusiveISO})`,
              `and(scheduled_at.is.null,requested_date.gte.${fromYmd},requested_date.lte.${toYmd})`
            ].join(',')
          );
        }
      } else if (from) {
        const fromMs = Number(from);
        if (!Number.isNaN(fromMs)) {
          const fromYmd = instantToYmdInBusinessTz(fromMs);
          const { startISO } = getZonedDayBoundsIso(fromYmd);
          query = query.or(
            [
              `scheduled_at.gte.${startISO}`,
              `and(scheduled_at.is.null,requested_date.gte.${fromYmd})`
            ].join(',')
          );
        }
      } else if (to) {
        const toMs = Number(to);
        if (!Number.isNaN(toMs)) {
          const toYmd = instantToYmdInBusinessTz(toMs);
          const { endExclusiveISO } = getZonedDayBoundsIso(toYmd);
          query = query.or(
            [
              `scheduled_at.lt.${endExclusiveISO}`,
              `and(scheduled_at.is.null,requested_date.lte.${toYmd})`
            ].join(',')
          );
        }
      }
    } else if (parts.length === 1 && parts[0]) {
      const raw = parts[0].trim();
      let dayStr: string | null = null;

      if (isYmdString(raw)) {
        dayStr = raw;
      } else {
        const timestamp = Number(raw);
        if (!Number.isNaN(timestamp)) {
          dayStr = instantToYmdInBusinessTz(timestamp);
        }
      }

      if (dayStr) {
        const { startISO, endExclusiveISO } = getZonedDayBoundsIso(dayStr);
        const branches = [
          `and(scheduled_at.gte.${startISO},scheduled_at.lt.${endExclusiveISO})`,
          `and(scheduled_at.is.null,requested_date.eq.${dayStr})`
        ];
        if (todayYmdInBusinessTz() === dayStr) {
          branches.push(`and(scheduled_at.is.null,requested_date.is.null)`);
        }
        query = query.or(branches.join(','));
      }
    }
  }

  // Parse sorting params
  const sorting =
    getSortingStateParser().parseServerSide(
      searchParamsCache.get('sort') ?? undefined
    ) || [];

  if (sorting.length > 0) {
    sorting.forEach((sortRule: any) => {
      const isDesc = sortRule.desc;
      if (sortRule.id === 'name') {
        query = query.order('client_name', { ascending: !isDesc });
      } else if (sortRule.id === 'date' || sortRule.id === 'time') {
        query = query.order('scheduled_at', { ascending: !isDesc });
      } else if (sortRule.id === 'payer_name') {
        query = query.order('name', {
          foreignTable: 'payer',
          ascending: !isDesc
        });
      } else if (sortRule.id === 'driver_id' || sortRule.id === 'driver_name') {
        query = query.order('name', {
          foreignTable: 'driver',
          ascending: !isDesc
        });
      } else if (sortRule.id === 'billing_type') {
        query = query.order('name', {
          foreignTable: 'billing_type',
          ascending: !isDesc
        });
      } else {
        query = query.order(sortRule.id, { ascending: !isDesc });
      }
    });
  } else {
    // Default sorting: earliest trips first (chronological)
    query = query.order('scheduled_at', { ascending: true });
  }

  if (view === 'kanban') {
    query = query.limit(2000);
  } else if (page && pageLimit) {
    const from = (page - 1) * pageLimit;
    const to = from + pageLimit - 1;
    query = query.range(from, to);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  const trips = data as any[];
  const totalTrips = count || 0;

  /**
   * Forces `TripsKanbanBoard` to remount when any query-driving param changes so
   * client state (DnD, zoom, etc.) does not pair with a stale `trips` prop if the
   * RSC payload lags behind the URL after `router.replace` / `router.refresh`.
   */
  const kanbanKey = [
    view,
    scheduledAt ?? '',
    driverId ?? '',
    payerId ?? '',
    status ?? '',
    search ?? '',
    billingTypeId ?? ''
  ].join('|');

  return (
    <div className='flex min-h-0 min-w-0 flex-1 flex-col space-y-4 overflow-hidden'>
      {/*
        Stack toggle + filters on narrow viewports; row from md up. Parent uses
        PageContainer scrollable={false} with overflow-hidden — keep min-w-0 so
        the filters bar can shrink without clipping horizontally.
      */}
      <div className='flex min-w-0 shrink-0 flex-col gap-3 md:flex-row md:items-start md:gap-3'>
        <TripsViewToggle currentView={view} />
        {/*
          `flex-1` on mobile in a column flex + auto-height parent collapses this block to
          zero — filters/header area disappear. Use natural height on narrow; grow only from md.
        */}
        <div className='w-full min-w-0 shrink-0 md:min-w-0 md:flex-1'>
          <TripsFiltersBar totalItems={totalTrips} />
        </div>
      </div>
      {view === 'kanban' && (
        <TripsKanbanBoard
          key={kanbanKey}
          trips={trips as Trip[]}
          totalItems={totalTrips}
        />
      )}
      {view !== 'kanban' && (
        <TripsTable data={trips} totalItems={totalTrips} columns={columns} />
      )}
    </div>
  );
}
