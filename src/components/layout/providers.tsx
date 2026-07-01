'use client';
import React from 'react';
import { ActiveThemeProvider } from '../themes/active-theme';
import QueryProvider from './query-provider';
import { SessionProvider } from '../providers/session-provider';
import { UserProfileProvider } from '../providers/user-profile-provider';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <SessionProvider>
          <QueryProvider>
            <UserProfileProvider>{children}</UserProfileProvider>
          </QueryProvider>
        </SessionProvider>
      </ActiveThemeProvider>
    </>
  );
}
