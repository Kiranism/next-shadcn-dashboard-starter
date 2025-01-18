import { ScrollArea } from '@/components/ui/scroll-area';
import EmployeeForm from './user-details-form';
import PageContainer from '@/components/layout/page-container';

export default function EmployeeViewPage() {
  return (
    <PageContainer>
      <EmployeeForm />
    </PageContainer>
  );
}
