import { HydrationBoundary, dehydrate, noop } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { searchParamsCache } from '@/lib/searchparams';
import { getUsers } from '../api/data';
import { userQueries } from '../api/queries';
import { UsersTable } from './users-table';

export default function UserListingPage() {
  const page = searchParamsCache.get('page');
  const search = searchParamsCache.get('name');
  const pageLimit = searchParamsCache.get('perPage');
  const roles = searchParamsCache.get('role');
  const sort = searchParamsCache.get('sort');

  const filters = {
    page,
    limit: pageLimit,
    ...(search && { search }),
    ...(roles && { roles }),
    ...(sort.length > 0 && { sort: JSON.stringify(sort) })
  };

  const queryClient = getQueryClient();

  // Same query key as the browser, but read from the server data layer directly:
  // the browser's queryFn calls /api/users, which the server can't reach with the user's session.
  void queryClient
    .query({ ...userQueries.list(filters), queryFn: () => getUsers(filters) })
    .catch(noop);

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <UsersTable />
    </HydrationBoundary>
  );
}
