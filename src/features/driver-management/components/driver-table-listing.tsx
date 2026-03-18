/**
 * DriverTableListing — Server component for table view.
 *
 * Fetches drivers with pagination and passes to DriverTable.
 * Uses searchParamsCache (populated by page) for page, perPage, name.
 * Rendered at /dashboard/drivers when view=table.
 */

import { searchParamsCache } from '@/lib/searchparams';
import { createClient } from '@/lib/supabase/server';
import { DriverTable } from './drivers-table';
import type { DriverWithProfile } from '@/features/driver-management/types';
import { getSortingStateParser } from '@/lib/parsers';

const SORTABLE_COLUMNS = new Set([
  'name',
  'first_name',
  'last_name',
  'email',
  'role',
  'phone',
  'is_active',
  'company_id'
]);

export default async function DriverTableListing() {
  const page = searchParamsCache.get('page') ?? 1;
  const perPage = searchParamsCache.get('perPage') ?? 10;
  const search =
    searchParamsCache.get('name') ?? searchParamsCache.get('search');
  const sortParam = searchParamsCache.get('sort');

  const supabase = await createClient();
  let query = supabase
    .from('accounts')
    .select(
      'id, name, first_name, last_name, email, role, phone, company_id, is_active',
      { count: 'exact' }
    )
    .eq('role', 'driver');

  if (search) {
    const term = `%${search}%`;
    query = query.or(
      `name.ilike.${term},first_name.ilike.${term},last_name.ilike.${term},email.ilike.${term}`
    );
  }

  const parsed =
    getSortingStateParser().parseServerSide(sortParam ?? undefined) || [];
  const sorting = parsed.filter(
    (s: { id: string; desc: boolean }) =>
      s?.id && typeof s.id === 'string' && SORTABLE_COLUMNS.has(s.id)
  );
  if (sorting.length > 0) {
    sorting.forEach((sortRule: { id: string; desc: boolean }) => {
      query = query.order(sortRule.id, { ascending: !sortRule.desc });
    });
  } else {
    query = query.order('name', { ascending: true });
  }

  const from = (page - 1) * perPage;
  const to = from + perPage - 1;
  query = query.range(from, to);

  const { data, count, error } = await query;

  if (error) {
    const msg =
      typeof error === 'object' && error !== null && 'message' in error
        ? (error as { message?: string }).message
        : String(error);
    throw new Error(`Fahrer konnten nicht geladen werden: ${msg}`);
  }

  const drivers = (data || []) as DriverWithProfile[];
  const totalDrivers = count ?? 0;

  return <DriverTable data={drivers} totalItems={totalDrivers} />;
}
