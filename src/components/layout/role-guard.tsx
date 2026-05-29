'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/components/providers/user-profile-provider';

interface RoleGuardProps {
  minRank: number;
  children: React.ReactNode;
}

export function RoleGuard({ minRank, children }: RoleGuardProps) {
  const { rank, isLoading } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && rank < minRank) {
      router.replace('/dashboard');
    }
  }, [isLoading, rank, minRank, router]);

  if (isLoading) {
    return (
      <div className='flex h-48 items-center justify-center'>
        <div className='border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent' />
      </div>
    );
  }

  if (rank < minRank) return null;

  return <>{children}</>;
}
