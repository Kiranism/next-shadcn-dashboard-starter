'use client';
import { ClerkProvider } from '@clerk/nextjs';
import { dark } from '@clerk/themes';
import { useTheme } from 'next-themes';
import React from 'react';
import { ActiveThemeProvider } from '../themes/active-theme';
import QueryProvider from './query-provider';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useTheme();

  return (
    <>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <ClerkProvider
          appearance={{
            baseTheme: resolvedTheme === 'dark' ? dark : undefined,
            variables: {
              colorPrimary: 'var(--primary)',
              colorPrimaryForeground: 'var(--primary-foreground)',
              colorDanger: 'var(--destructive)',
              colorBackground: 'var(--card)',
              colorForeground: 'var(--foreground)',
              colorMuted: 'var(--muted)',
              colorMutedForeground: 'var(--muted-foreground)',
              colorInput: 'var(--input)',
              colorInputForeground: 'var(--foreground)',
              colorBorder: 'var(--border)',
              colorRing: 'var(--ring)',
              fontFamily: 'var(--font-sans)'
            }
          }}
        >
          <QueryProvider>{children}</QueryProvider>
        </ClerkProvider>
      </ActiveThemeProvider>
    </>
  );
}
