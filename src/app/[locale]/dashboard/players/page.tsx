import PlayersClientPage from './PlayersClientPage';
import { Metadata } from 'next';

// Define a simple static metadata that doesn't rely on translations
export const metadata: Metadata = {
  title: 'Dashboard: Players'
};

export default function Page() {
  return <PlayersClientPage />;
}
