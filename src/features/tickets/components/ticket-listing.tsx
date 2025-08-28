import { Ticket } from '@/types/ticket';
import { fakeTickets } from '@/lib/adapters/database-adapter';
import { searchParamsCache } from '@/lib/searchparams';
import { TicketTable } from './ticket-tables';
import { columns } from './ticket-tables/columns';

type TicketListingPageProps = {};

export default async function TicketListingPage({}: TicketListingPageProps) {
  // Showcasing the use of search params cache in nested RSCs
  const page = searchParamsCache.get('page');
  const search =
    searchParamsCache.get('subject') || searchParamsCache.get('title');
  const pageLimit = searchParamsCache.get('perPage');
  const status = searchParamsCache.get('status');
  const priority = searchParamsCache.get('priority');
  const category = searchParamsCache.get('category');
  const email = searchParamsCache.get('email');
  const submitter = searchParamsCache.get('submitter');
  const assignedTo = searchParamsCache.get('assignedTo');
  const tags = searchParamsCache.get('tags');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(status && { status }),
    ...(priority && { priority }),
    ...(category && { category }),
    ...(email && { email }),
    ...(submitter && { submitter }),
    ...(assignedTo && { assignedTo }),
    ...(tags && { tags })
  };

  const data = await fakeTickets.getTickets(filters);
  const totalTickets = data.total_tickets;
  const tickets: Ticket[] = data.tickets;

  return (
    <TicketTable data={tickets} totalItems={totalTickets} columns={columns} />
  );
}
