import PageContainer from '@/components/layout/page-container';
import { TripsDashboardClient } from '@/features/trips/components/trips-dashboard-client';

export const metadata = {
  title: 'Dashboard: Trips'
};

export default function TripsPage() {
  return (
    <PageContainer
      scrollable
      pageTitle='Trips'
      pageDescription='Pick a trip to open its map, or create a new one from the onboarding flow.'
    >
      <div className='px-4 pb-4'>
        <TripsDashboardClient />
      </div>
    </PageContainer>
  );
}
