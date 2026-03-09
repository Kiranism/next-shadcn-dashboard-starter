import { searchParamsCache } from '@/lib/searchparams';
import { createClient } from '@/lib/supabase/server';
import { TripsTable, columns } from './trips-tables/index';
import { Trip } from '../api/trips.service';
import { getSortingStateParser } from '@/lib/parsers';

type TripsListingPageProps = {
  searchParams?: any;
};

export default async function TripsListingPage({
  searchParams
}: TripsListingPageProps) {
  const page = searchParamsCache.get('page');
  const pageLimit = searchParamsCache.get('perPage');

  // Trip filters
  const status = searchParamsCache.get('status');
  const driverId = searchParamsCache.get('driver_id');
  const payerId = searchParamsCache.get('payer_id');
  const billingTypeId = searchParamsCache.get('billing_type_id');
  const name = searchParamsCache.get('name');
  const scheduledAt = searchParamsCache.get('scheduled_at');

  const supabase = await createClient();
  let query = supabase.from('trips').select(
    `
    *,
    payer:payers(name),
    billing_type:billing_types(name, color),
    driver:users!trips_driver_id_fkey(name)
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
  if (driverId) {
    query = query.eq('driver_id', driverId);
  }
  if (payerId) {
    query = query.eq('payer_id', payerId);
  }
  if (billingTypeId) {
    query = query.eq('billing_type_id', billingTypeId);
  }
  if (name) {
    query = query.ilike('client_name', `%${name}%`);
  }
  if (scheduledAt) {
    const parts = scheduledAt.split(',');
    if (parts.length === 2) {
      const [from, to] = parts;
      if (from) {
        query = query.gte('scheduled_at', new Date(Number(from)).toISOString());
      }
      if (to) {
        query = query.lte('scheduled_at', new Date(Number(to)).toISOString());
      }
    } else if (parts.length === 1 && parts[0]) {
      query = query.gte(
        'scheduled_at',
        new Date(Number(parts[0])).toISOString()
      );
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
      } else if (sortRule.id === 'payer_name') {
        query = query.order('name', {
          foreignTable: 'payer',
          ascending: !isDesc
        });
      } else if (sortRule.id === 'driver_name') {
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
    // Default sorting: Scheduled time descending
    query = query.order('scheduled_at', { ascending: false });
  }

  if (page && pageLimit) {
    const from = (page - 1) * pageLimit;
    const to = from + pageLimit - 1;
    query = query.range(from, to);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  const trips = data as any[]; // Use any for joined data
  const totalTrips = count || 0;

  return <TripsTable data={trips} totalItems={totalTrips} columns={columns} />;
}
