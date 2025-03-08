import KanbanViewPage from '@/features/kanban/components/kanban-view-page';
import { Metadata } from 'next';

// Define a simple static metadata that doesn't rely on translations
export const metadata: Metadata = {
  title: 'Dashboard: Kanban'
};

export default function Page() {
  return <KanbanViewPage />;
}
