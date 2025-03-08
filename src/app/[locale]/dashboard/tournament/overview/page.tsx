import { Metadata } from 'next';
import TournamentsClientPage from './TournamentsClientPage';

// Define a simple static metadata that doesn't rely on translations
export const metadata: Metadata = {
  title: 'Dashboard: Tournament Overview',
  description: 'Manage tournaments data'
};

export default function Page() {
  return <TournamentsClientPage />;
}
