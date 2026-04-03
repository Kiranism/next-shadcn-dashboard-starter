import { queryOptions } from '@tanstack/react-query';
import { getTrips } from './service';
import type { Trip } from './types';

export type { Trip };

export const tripKeys = {
  all: ['trips'] as const,
  list: () => [...tripKeys.all, 'list'] as const
};

export const tripsQueryOptions = () =>
  queryOptions({
    queryKey: tripKeys.list(),
    queryFn: () => getTrips()
  });