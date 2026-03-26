import { queryOptions } from '@tanstack/react-query';
import { fakeUsers, type User } from '@/constants/mock-api-users';

export type { User };

export const usersQueryOptions = (filters: {
  page?: number;
  limit?: number;
  roles?: string;
  search?: string;
  sort?: string;
}) =>
  queryOptions({
    queryKey: ['users', filters],
    queryFn: () => fakeUsers.getUsers(filters)
  });
