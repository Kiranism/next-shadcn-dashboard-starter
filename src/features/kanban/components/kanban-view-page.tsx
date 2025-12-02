import PageContainer from '@/components/layout/page-container';
import { KanbanBoard } from './kanban-board';
import NewTaskDialog from './new-task-dialog';

export default function KanbanViewPage() {
  return (
    <PageContainer
      pageTitle='Kanban'
      pageDescription='Manage tasks by dnd'
      pageHeaderAction={<NewTaskDialog />}
    >
      <KanbanBoard />
    </PageContainer>
  );
}
