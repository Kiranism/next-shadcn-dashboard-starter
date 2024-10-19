import { ScrollArea } from '@/components/ui/scroll-area';
import EmployeeForm from './employee-form';

export default function EmployeeViewPage() {
  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-8">
        <EmployeeForm />
      </div>
    </ScrollArea>
  );
}
