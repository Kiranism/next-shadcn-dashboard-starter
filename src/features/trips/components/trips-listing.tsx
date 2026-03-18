import { searchParamsCache } from '@/lib/searchparams';
import { createClient } from '@/lib/supabase/server';
import { TripsTable, columns } from './trips-tables/index';
import { Trip } from '../api/trips.service';
import { getSortingStateParser } from '@/lib/parsers';
import { TripsViewToggle } from './trips-view-toggle';
import { TripsKanbanBoard } from './trips-kanban-board';
import { TripsFiltersBar } from './trips-filters-bar';

type TripsListingPageProps = {
  searchParams?: any;
};

export default async function TripsListingPage({
  searchParams
}: TripsListingPageProps) {
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
  if (payerId) {
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
  if (scheduledAt) {
    const parts = scheduledAt.split(',');

    // Range filter: "from,to"
    if (parts.length === 2) {
      const [from, to] = parts;
      if (from) {
        query = query.gte('scheduled_at', new Date(Number(from)).toISOString());
      }
      if (to) {
        query = query.lte('scheduled_at', new Date(Number(to)).toISOString());
      }
    } else if (parts.length === 1 && parts[0]) {
      // Single-day filter: interpret the timestamp as a date and
      // constrain results to that calendar day (local time).
      const timestamp = Number(parts[0]);
      if (!Number.isNaN(timestamp)) {
        const day = new Date(timestamp);
        const startOfDay = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate()
        );
        const endOfDay = new Date(
          day.getFullYear(),
          day.getMonth(),
          day.getDate() + 1
        );

        query = query
          .gte('scheduled_at', startOfDay.toISOString())
          .lt('scheduled_at', endOfDay.toISOString());
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

  const trips = data as any[]; // Use any for joined data
  const totalTrips = count || 0;

  return (
    <div className='flex min-h-0 min-w-0 flex-1 flex-col space-y-4 overflow-hidden'>
      <div className='flex flex-wrap items-center gap-3'>
        <TripsViewToggle currentView={view} />
        <div className='min-w-0 flex-1'>
          <TripsFiltersBar totalItems={totalTrips} />
        </div>
      </div>
      {view === 'kanban' && (
        <TripsKanbanBoard trips={trips as Trip[]} totalItems={totalTrips} />
      )}
      {view !== 'kanban' && (
        <TripsTable data={trips} totalItems={totalTrips} columns={columns} />
      )}
    </div>
  );
}
