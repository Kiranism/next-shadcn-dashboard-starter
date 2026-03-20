'use client';

import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion } from 'motion/react';
import { cn } from '@/lib/utils';
import { getUrgencyLevel, type UrgencyLevel } from '../lib/urgency-logic';
import { type TripStatus } from '@/lib/trip-status';
import { URGENCY_STYLES } from '../constants/urgency-config';
import { getUrgencyTranslation } from '../lib/urgency-translations';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger
} from '@/components/ui/tooltip';

/**
 * Urgency Indicator Styles
 * Uses semantic colors aligned with @/lib/trip-status.ts
 * Rules:
 * - Upcoming: Blue (Info/Planned)
 * - Imminent: Amber/Orange (Warning/Active)
 * - Due/Overdue: Red (Critical/Error)
 */
const urgencyIndicatorVariants = cva('relative inline-flex shrink-0', {
  variants: {
    variant: {
      dot: 'h-2 w-2 rounded-full',
      badge:
        'rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider'
    },
    level: {
      none: 'hidden',
      upcoming: [
        'bg-blue-500 dark:bg-blue-400',
        'text-blue-700 dark:text-blue-200 shadow-[0_0_0_2px_rgba(59,130,246,0.1)]'
      ],
      imminent: [
        'bg-amber-500 dark:bg-amber-400',
        'text-amber-700 dark:text-amber-200 shadow-[0_0_0_2px_rgba(245,158,11,0.1)]'
      ],
      due: [
        'bg-red-500 dark:bg-red-400',
        'text-red-700 dark:text-red-200 shadow-[0_0_0_2px_rgba(239,68,68,0.2)]'
      ],
      overdue: [
        'bg-red-600 dark:bg-red-500',
        'text-red-50 dark:text-red-100 shadow-[0_0_0_4px_rgba(220,38,38,0.2)]'
      ]
    }
  },
  compoundVariants: [
    {
      variant: 'badge',
      level: 'upcoming',
      className:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
    },
    {
      variant: 'badge',
      level: 'imminent',
      className:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 border border-amber-200 dark:border-amber-800'
    },
    {
      variant: 'badge',
      level: 'due',
      className:
        'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300 border border-red-200 dark:border-red-800'
    },
    {
      variant: 'badge',
      level: 'overdue',
      className: 'bg-red-600 text-white dark:bg-red-700 border-none'
    }
  ],
  defaultVariants: {
    variant: 'dot',
    level: 'none'
  }
});

export interface UrgencyIndicatorProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof urgencyIndicatorVariants> {
  scheduledAt: string | Date | null | undefined;
  status: TripStatus | string;
}

const levelLabels: Record<UrgencyLevel, string> = {
  none: URGENCY_STYLES.none.label,
  upcoming: URGENCY_STYLES.upcoming.label,
  imminent: URGENCY_STYLES.imminent.label,
  due: URGENCY_STYLES.due.label,
  overdue: URGENCY_STYLES.overdue.label
};

/**
 * UrgencyIndicator — Unified visual cue for trip timing.
 *
 * Performance Note: This component uses a 10s interval to update the indicator
 * since urgency is time-dependent.
 */
export function UrgencyIndicator({
  scheduledAt,
  status,
  variant,
  className,
  ...props
}: UrgencyIndicatorProps) {
  const [level, setLevel] = React.useState<UrgencyLevel>('none');

  React.useEffect(() => {
    const update = () => {
      const nextLevel = getUrgencyLevel(scheduledAt, status);
      setLevel(nextLevel);
    };

    update();
    const interval = setInterval(update, 10000); // 10s resolution is enough for dispatch
    return () => clearInterval(interval);
  }, [scheduledAt, status]);

  if (level === 'none') return null;

  const isOverdue = level === 'overdue';
  const isDue = level === 'due';

  // Use the translation helper for localized text (defaults to German)
  const { label, description } = getUrgencyTranslation(level);

  // Omit motion-clashing props
  const { onDrag, onDragStart, onDragEnd, ...safeProps } = props as any;

  return (
    <Tooltip delayDuration={0}>
      <TooltipTrigger asChild>
        <div className='flex items-center gap-1.5'>
          <motion.div
            animate={
              isOverdue
                ? { scale: [1, 1.2, 1], opacity: [1, 0.6, 1] }
                : isDue
                  ? { scale: [1, 1.1, 1] }
                  : {}
            }
            transition={
              isOverdue
                ? { duration: 1.5, repeat: Infinity, ease: 'easeInOut' }
                : isDue
                  ? { duration: 3, repeat: Infinity, ease: 'easeInOut' }
                  : {}
            }
            className={cn(
              urgencyIndicatorVariants({ variant, level: level }),
              className
            )}
            {...safeProps}
          >
            {variant === 'badge' && label}
          </motion.div>
        </div>
      </TooltipTrigger>
      <TooltipContent side='bottom' align='center' sideOffset={8}>
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
