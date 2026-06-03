'use client';

import { useUserProfile } from '@/components/providers/user-profile-provider';
import { ViolationsAdminView } from './violations-admin-view';
import { ViolationsMeView } from './violations-me-view';

export function FaltasView() {
  const { rank } = useUserProfile();

  if (rank === 0) {
    return <ViolationsMeView />;
  }

  return <ViolationsAdminView />;
}
