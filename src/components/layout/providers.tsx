'use client';
import React from 'react';
import ThemeProvider from './ThemeToggle/theme-provider';
import { SessionProvider, SessionProviderProps } from 'next-auth/react';
import { ActiveThemeProvider } from '../active-theme';
export default function Providers({
  session,
  activeThemeValue,
  children
}: {
  session: SessionProviderProps['session'];
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <ThemeProvider
        attribute='class'
        defaultTheme='system'
        enableSystem
        disableTransitionOnChange
        enableColorScheme
      >
        <ActiveThemeProvider initialTheme={activeThemeValue}>
          <SessionProvider session={session}>{children}</SessionProvider>
        </ActiveThemeProvider>
      </ThemeProvider>
    </>
  );
}
