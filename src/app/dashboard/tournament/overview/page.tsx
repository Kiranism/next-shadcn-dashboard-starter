import { Metadata } from 'next';
import TournamentsClientPage from './TournamentsClientPage';

export const metadata: Metadata = {
  title: 'Tournaments Overview',
  description: 'Manage tournaments data'
};

export default function Page() {
  return <TournamentsClientPage />;
}
