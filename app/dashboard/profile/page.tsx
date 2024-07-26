import { Breadcrumbs } from '@/components/breadcrumbs';
import { CreateProfileOne } from '@/components/forms/user-profile-stepper/create-profile';
import { ScrollArea } from '@/components/ui/scroll-area';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Profile', link: '/dashboard/profile' }
];
export default function page() {
  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <Breadcrumbs items={breadcrumbItems} />
        <CreateProfileOne categories={[]} initialData={null} />
      </div>
    </ScrollArea>
  );
}
