'use client';

import { useUserProfile } from '@/components/providers/user-profile-provider';
import { WeeklySummaryCard } from './weekly-summary-card';
import { SettingsCard } from './settings-card';
import { UsersSuperuserTable } from './users-superuser-table';

export function PontoEletronicoView() {
  const { rank } = useUserProfile();
  const isSuperuser = rank >= 3;

  return (
    <div className='space-y-6'>
      {/* Top row */}
      {isSuperuser ? (
        <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
          <WeeklySummaryCard />
          <SettingsCard />
        </div>
      ) : (
        <div className='w-full max-w-lg'>
          <WeeklySummaryCard />
        </div>
      )}

      {/* Team table — superuser only, full width */}
      <UsersSuperuserTable />
    </div>
  );
}
