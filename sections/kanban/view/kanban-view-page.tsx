import { Breadcrumbs } from '@/components/breadcrumbs';
import { KanbanBoard } from '../kanban-board';
import NewTaskDialog from '../new-task-dialog';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Kanban', link: '/dashboard/kanban' }
];

export default function KanbanViewPage() {
  return (
    <PageContainer>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="flex items-start justify-between">
          <Heading title={`Kanban`} description="Manage tasks by dnd" />
          <NewTaskDialog />
        </div>
        <KanbanBoard />
      </div>
    </PageContainer>
  );
}
