'use client';
import React from 'react';
import ThemeProvider from './ThemeToggle/theme-provider';
import ThemeListener from './ThemeToggle/theme-listener';
import EarlyThemeRestore from './early-theme-restore';
import { SessionProvider, SessionProviderProps } from 'next-auth/react';

export default function Providers({
  session,
  children
}: {
  session: SessionProviderProps['session'];
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider
        attribute='class'
        defaultTheme='system'
        enableSystem
        disableTransitionOnChange
        storageKey='theme'
      >
        <EarlyThemeRestore />
        <ThemeListener />
        <SessionProvider session={session}>{children}</SessionProvider>
      </ThemeProvider>
    </>
  );
}
