'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

const GlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('glass-medical rounded-lg p-6 shadow-sm', className)}
    {...props}
  />
));
GlassCard.displayName = 'GlassCard';

const HeroGlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'glass-medical rounded-2xl border border-white/20 bg-white/10 p-8 shadow-lg backdrop-blur-xl dark:border-white/10 dark:bg-black/10',
      className
    )}
    {...props}
  />
));
HeroGlassCard.displayName = 'HeroGlassCard';

const PremiumGlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'glass-medical hover-lift rounded-xl border border-white/30 bg-white/80 p-6 shadow-md backdrop-blur-lg dark:border-white/10 dark:bg-black/20',
      className
    )}
    {...props}
  />
));
PremiumGlassCard.displayName = 'PremiumGlassCard';

const ElevatedGlassCard = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      'glass-medical rounded-lg border border-white/40 bg-white/90 p-4 shadow-sm backdrop-blur-md transition-all duration-200 hover:shadow-lg dark:border-white/20 dark:bg-black/30',
      className
    )}
    {...props}
  />
));
ElevatedGlassCard.displayName = 'ElevatedGlassCard';

export { GlassCard, HeroGlassCard, PremiumGlassCard, ElevatedGlassCard };
