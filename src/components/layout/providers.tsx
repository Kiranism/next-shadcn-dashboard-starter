'use client';
import { getAuth } from '@/lib/better-auth.config';
import type React from 'react';
import { ActiveThemeProvider } from '../active-theme';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  const auth = getAuth();

  return (
    <>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <auth.client.SessionProvider>{children}</auth.client.SessionProvider>
      </ActiveThemeProvider>
    </>
  );
}
