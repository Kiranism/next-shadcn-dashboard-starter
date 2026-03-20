export const URGENCY_STYLES = {
  none: {
    label: '',
    color: 'transparent',
    bg: 'bg-transparent',
    dot: 'hidden',
    rowClass: ''
  },
  upcoming: {
    label: 'Upcoming',
    color: 'text-blue-500',
    bg: 'bg-blue-500',
    description: 'Preparing / Queueing',
    rowClass: 'border-l-4 border-l-blue-500 bg-blue-50/10 dark:bg-blue-950/5'
  },
  imminent: {
    label: 'Imminent',
    color: 'text-amber-500',
    bg: 'bg-amber-500',
    description: 'Critical / Dispatch needed',
    rowClass: 'border-l-4 border-l-amber-500 bg-amber-50/10 dark:bg-amber-950/5'
  },
  due: {
    label: 'Due',
    color: 'text-red-500',
    bg: 'bg-red-500',
    description: 'Should start now',
    rowClass:
      'border-l-4 border-l-red-500 bg-red-50/20 dark:bg-red-950/10 font-medium'
  },
  overdue: {
    label: 'Overdue',
    color: 'text-red-600',
    bg: 'bg-red-600',
    description: 'Immediate attention',
    rowClass:
      'border-l-4 border-l-red-600 bg-red-50/30 dark:bg-red-950/15 font-bold animate-pulse'
  }
} as const;

export type UrgencyLevelKey = keyof typeof URGENCY_STYLES;
