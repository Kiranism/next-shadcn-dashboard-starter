import { fakeTrips } from '@/constants/mock-api-trips';
import type { TripMutationPayload, TripsResponse } from './types';

export async function getTrips(): Promise<TripsResponse> {
  return fakeTrips.getTrips();
}

export async function createTrip(data: TripMutationPayload) {
  return fakeTrips.createTrip(data);
}