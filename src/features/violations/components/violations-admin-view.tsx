'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { ViolationsRepository } from '@/repositories/violations.repository';
import { useQuery } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import { useAccessToken } from '@/repositories/_shared/use-access-token';
import type { UserResponse } from '@/types/api';
import { ViolationsTable } from './violations-table';
import { MemberViolationsSheet } from './member-violations-sheet';
import { ApplyViolationDialog } from './apply-violation-dialog';
import type { UserViolations } from '@/types/violations';

function useAllUsers() {
  const token = useAccessToken();
  return useQuery({
    queryKey: ['users'],
    queryFn: () => apiGet<UserResponse[]>('/users', token),
    enabled: !!token
  });
}

export function ViolationsAdminView() {
  const { rank } = useUserProfile();
  const { data: violationsData = [], isLoading } = ViolationsRepository.useList();
  const { data: users = [] } = useAllUsers();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [applyOpen, setApplyOpen] = useState(false);

  const userNames = Object.fromEntries(
    users.map((u) => [u.id, { name: u.name, role: u.role, sector: u.sector ?? '' }])
  );

  const selectedEntry = violationsData.find((e) => e.user_id === selectedUserId) ?? null;
  const selectedName = selectedEntry
    ? (userNames[selectedEntry.user_id]?.name ?? selectedEntry.user_id)
    : '';
  const selectedRole = selectedEntry ? userNames[selectedEntry.user_id]?.role : undefined;

  return (
    <div className='space-y-5'>
      <div className='flex justify-end'>
        <Button size='sm' onClick={() => setApplyOpen(true)}>
          <Icons.warning className='mr-1.5 size-4' />
          Aplicar Falta
        </Button>
      </div>

      {isLoading ? (
        <div className='space-y-2 rounded-xl border p-4'>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className='flex items-center gap-4 py-2'>
              <Skeleton className='h-4 w-40' />
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-16' />
              <Skeleton className='ml-auto h-4 w-12' />
            </div>
          ))}
        </div>
      ) : (
        <ViolationsTable
          data={violationsData}
          userNames={userNames}
          onSelectMember={(entry) => setSelectedUserId(entry.user_id)}
        />
      )}

      <MemberViolationsSheet
        entry={selectedEntry}
        memberName={selectedName}
        memberRole={selectedRole}
        onClose={() => setSelectedUserId(null)}
        canCancel={rank >= 1}
      />

      <ApplyViolationDialog
        open={applyOpen}
        onOpenChange={setApplyOpen}
        members={violationsData}
        userNames={userNames}
      />
    </div>
  );
}
