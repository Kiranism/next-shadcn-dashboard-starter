export type { Trip } from '@/constants/mock-api-trips';

export type TripsResponse = {
  success: boolean;
  time: string;
  message: string;
  total_trips: number;
  trips: import('@/constants/mock-api-trips').Trip[];
};

export type TripMutationPayload = {
  title: string;
  destination: string;
  travel_window: string;
  travelers: string;
  style: string;
  budget: string;
  focus: string;
  highlights: string[];
  summary: string;
};