import { searchParamsCache } from '@/lib/searchparams';
import { createClient } from '@/lib/supabase/server';
import { ClientTable } from './client-tables';
import { columns } from './client-tables/columns';
import { Client } from '../api/clients.service';
import { getSortingStateParser } from '@/lib/parsers';

type ClientListingPageProps = {
  searchParams?: any;
};

export default async function ClientListingPage({
  searchParams
}: ClientListingPageProps) {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name'); // Assuming search acts on internal name query param
  const pageLimit = searchParamsCache.get('perPage');

  const supabase = await createClient();
  let query = supabase.from('clients').select('*', { count: 'exact' });

  if (search) {
    query = query.or(
      `first_name.ilike.%${search}%,last_name.ilike.%${search}%,company_name.ilike.%${search}%`
    );
  }

  // Parse sorting params
  const sortParam = (await searchParams)?.sort;
  const sorting = getSortingStateParser().parseServerSide(sortParam) || [];

  if (sorting.length > 0) {
    sorting.forEach((sortRule: any) => {
      query = query.order(sortRule.id, { ascending: !sortRule.desc });
    });
  } else {
    // Default sorting
    query = query.order('created_at', { ascending: false });
  }

  if (page && pageLimit) {
    const from = (page - 1) * pageLimit;
    const to = from + pageLimit - 1;
    query = query.range(from, to);
  }

  const { data, count, error } = await query;
  if (error) throw error;

  const clients = data as Client[];
  const totalClients = count || 0;

  return (
    <ClientTable data={clients} totalItems={totalClients} columns={columns} />
  );
}
