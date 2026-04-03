import { mutationOptions } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { createTrip } from './service';
import { tripKeys } from './queries';
import type { TripMutationPayload } from './types';

export type { TripMutationPayload };

export const createTripMutation = mutationOptions({
  mutationFn: (data: TripMutationPayload) => createTrip(data),
  onSuccess: () => {
    getQueryClient().invalidateQueries({ queryKey: tripKeys.all });
  }
});