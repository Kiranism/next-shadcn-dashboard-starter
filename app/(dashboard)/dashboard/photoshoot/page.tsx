// app/(dashboard)/dashboard/photoshoots/page.tsx
import BreadCrumb from '@/components/breadcrumb';
import PhotoShootList from '@/components/PhotoShootList';

const breadcrumbItems = [{ title: 'Photo shoot', link: '/dashboard/employee' }];

export default function Page() {
  return (
    <>
      <div className="flex-1 space-y-4 p-4 pt-6 md:p-8">
        <BreadCrumb items={breadcrumbItems} />
        <PhotoShootList />
      </div>
    </>
  );
}
