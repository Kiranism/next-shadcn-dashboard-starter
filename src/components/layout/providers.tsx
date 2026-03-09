'use client';
import React, { useState } from 'react';
import { ActiveThemeProvider } from '../themes/active-theme';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { TooltipProvider } from '../ui/tooltip';

export default function Providers({
  activeThemeValue,
  children
}: {
  activeThemeValue: string;
  children: React.ReactNode;
}) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <ActiveThemeProvider initialTheme={activeThemeValue}>
        <TooltipProvider delayDuration={0}>{children}</TooltipProvider>
      </ActiveThemeProvider>
    </QueryClientProvider>
  );
}
