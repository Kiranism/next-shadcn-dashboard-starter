import BreadCrumb from '@/components/breadcrumb';
import { PhotoShootForm } from '@/components/forms/photo-shoot-form';
import { ProductForm } from '@/components/forms/product-form';
import React from 'react';

export default function Page() {
  const breadcrumbItems = [
    { title: 'Photshoot', link: '/dashboard/photoshoot' },
    { title: 'Create', link: '/dashboard/photoshoot/create' }
  ];
  return (
    <div className="flex-1 space-y-4 p-8">
      <BreadCrumb items={breadcrumbItems} />
      <PhotoShootForm
        // categories={[
        //   { _id: 'shirts', name: 'shirts' },
        //   { _id: 'pants', name: 'pants' }
        // ]}
        initialData={null}
        key={null}
      />
    </div>
  );
}
