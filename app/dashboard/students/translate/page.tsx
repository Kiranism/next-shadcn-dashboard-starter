import { CalendarDateRangePicker } from '@/components/date-range-picker';
import PageContainer from '@/components/layout/page-container';
import { StudentsTransfer } from '@/components/forms/students-transfer';

export default function page() {
  return (
    <PageContainer scrollable={true}>
      <StudentsTransfer />
    </PageContainer>
  );
}
