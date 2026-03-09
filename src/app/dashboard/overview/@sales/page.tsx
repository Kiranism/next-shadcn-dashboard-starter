import { delay } from '@/constants/mock-api';
import { UpcomingTrips } from '@/features/overview/components/upcoming-trips';

export default async function Sales() {
  await delay(1000); // Reduced delay for better UX
  return <UpcomingTrips />;
}
