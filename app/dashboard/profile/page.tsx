'use client';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { CreateProfileOne } from '@/components/forms/user-profile-stepper/create-profile';
import PageContainer from '@/components/layout/page-container';
import { createClient } from '@/utils/supabase/client';
import { Session } from '@supabase/supabase-js';
import { useState, useEffect } from 'react';

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Profile', link: '/dashboard/profile' }
];
export default function page() {
  const [user_session, setUserSession] = useState<Session | null>(null);
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { session }
      } = await supabase.auth.getSession();

      if (session) {
        setUserSession(session);
      }
    };

    fetchUser();
  });

  return (
    <PageContainer scrollable={true}>
      <div className="space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <CreateProfileOne categories={[]} initialData={user_session?.user} />
      </div>
    </PageContainer>
  );
}
