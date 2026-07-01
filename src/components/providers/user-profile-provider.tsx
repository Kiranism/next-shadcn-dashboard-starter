'use client';

import React, { createContext, useContext, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSession } from './session-provider';
import { userProfileQueryOptions } from '@/features/auth/api/queries';
import { setRoleCookie } from '@/app/actions/set-role-cookie';
import type { UserProfile } from '@/types/user-profile';

interface UserProfileContextValue {
  profile: UserProfile | null;
  isLoading: boolean;
  rank: number;
  profileMissing: boolean;
}

const UserProfileContext = createContext<UserProfileContextValue>({
  profile: null,
  isLoading: false,
  rank: 0,
  profileMissing: false
});

export function UserProfileProvider({ children }: { children: React.ReactNode }) {
  const { session, loading: sessionLoading } = useSession();
  const token = session?.access_token ?? null;

  const { data: profile = null, isLoading, error } = useQuery(userProfileQueryOptions(token));

  const profileMissing = !!token && !isLoading && !sessionLoading && !profile && !!error;

  useEffect(() => {
    if (profile?.role) {
      void setRoleCookie(profile.role);
    }
  }, [profile?.role]);

  return (
    <UserProfileContext.Provider
      value={{
        profile,
        isLoading: sessionLoading || isLoading,
        rank: profile?.rank ?? 0,
        profileMissing
      }}
    >
      {children}
    </UserProfileContext.Provider>
  );
}

export function useUserProfile() {
  return useContext(UserProfileContext);
}
