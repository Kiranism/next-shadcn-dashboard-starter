import { mutationOptions, queryOptions } from '@tanstack/react-query';
import { createUser, deleteUser, getUsers, updateUser } from './service';
import type { User, UserFilters, UserMutationPayload } from './types';

export type { User };

// Reads: query key + fetcher in one place, shared by server prefetch and client hooks.
// Invalidate everything for this entity with userQueries.all().
export const userQueries = {
  all: () => ['users'] as const,
  list: (filters: UserFilters) =>
    queryOptions({
      queryKey: [...userQueries.all(), 'list', filters] as const,
      queryFn: () => getUsers(filters)
    })
};

// Writes: only the mutationFn. Components add onSuccess/onError/onSettled,
// including cache invalidation, so everything that happens after a mutation is in one place.
export const userMutations = {
  create: () =>
    mutationOptions({
      mutationFn: (data: UserMutationPayload) => createUser(data)
    }),
  update: () =>
    mutationOptions({
      mutationFn: ({ id, values }: { id: number; values: UserMutationPayload }) =>
        updateUser(id, values)
    }),
  delete: () =>
    mutationOptions({
      mutationFn: (id: number) => deleteUser(id)
    })
};
