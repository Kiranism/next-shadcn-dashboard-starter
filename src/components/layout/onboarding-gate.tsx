'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUserProfile } from '@/components/providers/user-profile-provider';

export function OnboardingGate({ children }: { children: React.ReactNode }) {
  const { profileMissing, isLoading } = useUserProfile();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && profileMissing) {
      router.replace('/onboarding');
    }
  }, [isLoading, profileMissing, router]);

  if (isLoading) {
    return (
      <div className='flex h-screen items-center justify-center'>
        <div className='border-primary h-8 w-8 animate-spin rounded-full border-4 border-t-transparent' />
      </div>
    );
  }

  if (profileMissing) return null;

  return <>{children}</>;
}
