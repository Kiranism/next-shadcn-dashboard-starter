'use client';
import { Breadcrumbs } from '@/components/breadcrumbs';
import { ProductForm } from '@/components/forms/product-form';
import { UserForm } from '@/components/forms/user-form';
import PageContainer from '@/components/layout/page-container';
import { ScrollArea } from '@/components/ui/scroll-area';
import { User } from 'next-auth';
import { useParams, useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { users } from '@/constants/data';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'User', link: '/dashboard/user' },
  { title: 'Create', link: '/dashboard/user/create' }
];
export default function Page() {
  const params = useParams<{ userId: string }>();
  const [user, setUser] = useState<any>();
  const router = useRouter();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const id =
          params.userId === 'new' ? -1 : Number.parseInt(params.userId);
        // const response = await fetch('url' + id);
        // const data = await response.json();
        const u = id >= 0 ? users[id] : null;
        setUser(u);
      } catch (error) {
        console.error('Error fetching users:', error);
      }
    };
    fetchUsers();
  }, []);

  return (
    <PageContainer scrollable={true}>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        {user ? (
          <UserForm
            categories={[
              { _id: 'shirts', name: 'shirts' },
              { _id: 'pants', name: 'pants' }
            ]}
            initialData={user}
            key={null}
          />
        ) : params.userId === 'new' ? (
          <UserForm
            categories={[
              { _id: 'shirts', name: 'shirts' },
              { _id: 'pants', name: 'pants' }
            ]}
            initialData={null}
            key={null}
          />
        ) : (
          <div>Loading...</div>
        )}
      </div>
    </PageContainer>
  );
}
