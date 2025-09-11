'use client';
import React from 'react';
import { ClerkProvider } from '@clerk/nextjs';
import { ActiveThemeProvider } from '../active-theme';
import { MedicalProvider } from '@/contexts/MedicalContext';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <MedicalProvider>
        <ActiveThemeProvider initialTheme={activeThemeValue}>
          {children}
        </ActiveThemeProvider>
      </MedicalProvider>
    </ClerkProvider>
  );
}
