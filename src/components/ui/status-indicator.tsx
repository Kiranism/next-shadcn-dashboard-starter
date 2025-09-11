'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

export type StatusType =
  | 'stable'
  | 'monitoring'
  | 'urgent'
  | 'critical'
  | 'normal'
  | 'active';

export type StatusTrend = 'up' | 'down' | 'stable';

interface StatusIndicatorProps {
  status: StatusType;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal' | 'outlined';
  showLabel?: boolean;
  showPulse?: boolean;
  className?: string;
}

const statusConfig = {
  stable: {
    color: 'bg-emerald-500',
    label: 'Estável',
    textColor: 'text-emerald-700 dark:text-emerald-400',
    bgColor: 'bg-emerald-100 dark:bg-emerald-900/20',
    borderColor: 'border-emerald-300 dark:border-emerald-800'
  },
  monitoring: {
    color: 'bg-amber-500',
    label: 'Monitorando',
    textColor: 'text-amber-700 dark:text-amber-400',
    bgColor: 'bg-amber-100 dark:bg-amber-900/20',
    borderColor: 'border-amber-300 dark:border-amber-800'
  },
  urgent: {
    color: 'bg-orange-500',
    label: 'Urgente',
    textColor: 'text-orange-700 dark:text-orange-400',
    bgColor: 'bg-orange-100 dark:bg-orange-900/20',
    borderColor: 'border-orange-300 dark:border-orange-800'
  },
  critical: {
    color: 'bg-red-500',
    label: 'Crítico',
    textColor: 'text-red-700 dark:text-red-400',
    bgColor: 'bg-red-100 dark:bg-red-900/20',
    borderColor: 'border-red-300 dark:border-red-800'
  },
  normal: {
    color: 'bg-blue-500',
    label: 'Normal',
    textColor: 'text-blue-700 dark:text-blue-400',
    bgColor: 'bg-blue-100 dark:bg-blue-900/20',
    borderColor: 'border-blue-300 dark:border-blue-800'
  },
  active: {
    color: 'bg-purple-500',
    label: 'Ativo',
    textColor: 'text-purple-700 dark:text-purple-400',
    bgColor: 'bg-purple-100 dark:bg-purple-900/20',
    borderColor: 'border-purple-300 dark:border-purple-800'
  }
};

const sizeConfig = {
  sm: {
    dot: 'h-2 w-2',
    text: 'text-xs',
    padding: 'px-2 py-1'
  },
  md: {
    dot: 'h-3 w-3',
    text: 'text-sm',
    padding: 'px-3 py-1.5'
  },
  lg: {
    dot: 'h-4 w-4',
    text: 'text-base',
    padding: 'px-4 py-2'
  }
};

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  variant = 'default',
  showLabel = true,
  showPulse = false,
  className
}) => {
  const config = statusConfig[status];
  const sizes = sizeConfig[size];

  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-center gap-2', className)}>
        <div
          className={cn(
            'rounded-full',
            config.color,
            sizes.dot,
            showPulse && 'animate-pulse'
          )}
        />
        {showLabel && (
          <span className={cn('font-medium', config.textColor, sizes.text)}>
            {config.label}
          </span>
        )}
      </div>
    );
  }

  if (variant === 'outlined') {
    return (
      <div
        className={cn(
          'inline-flex items-center gap-2 rounded-full border',
          config.borderColor,
          config.bgColor,
          sizes.padding,
          className
        )}
      >
        <div
          className={cn(
            'rounded-full',
            config.color,
            sizes.dot,
            showPulse && 'animate-pulse'
          )}
        />
        {showLabel && (
          <span className={cn('font-medium', config.textColor, sizes.text)}>
            {config.label}
          </span>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        'inline-flex items-center gap-2 rounded-full',
        config.bgColor,
        sizes.padding,
        className
      )}
    >
      <div
        className={cn(
          'rounded-full',
          config.color,
          sizes.dot,
          showPulse && 'animate-pulse'
        )}
      />
      {showLabel && (
        <span className={cn('font-medium', config.textColor, sizes.text)}>
          {config.label}
        </span>
      )}
    </div>
  );
};

interface MedicalStatusData {
  type: StatusType;
  label: string;
  count: number;
  trend: StatusTrend;
}

interface MedicalStatusGridProps {
  statuses: MedicalStatusData[];
  className?: string;
}

export const MedicalStatusGrid: React.FC<MedicalStatusGridProps> = ({
  statuses,
  className
}) => {
  const getTrendIcon = (trend: StatusTrend) => {
    switch (trend) {
      case 'up':
        return '↗';
      case 'down':
        return '↘';
      default:
        return '→';
    }
  };

  const getTrendColor = (trend: StatusTrend) => {
    switch (trend) {
      case 'up':
        return 'text-emerald-600 dark:text-emerald-400';
      case 'down':
        return 'text-red-600 dark:text-red-400';
      default:
        return 'text-slate-500 dark:text-slate-400';
    }
  };

  return (
    <div className={cn('grid gap-4', className)}>
      {statuses.map((status, index) => {
        const config = statusConfig[status.type];
        return (
          <div
            key={index}
            className={cn(
              'rounded-lg border p-4',
              config.bgColor,
              config.borderColor,
              'transition-shadow hover:shadow-md'
            )}
          >
            <div className='mb-2 flex items-center justify-between'>
              <StatusIndicator
                status={status.type}
                size='sm'
                variant='minimal'
                showLabel={false}
              />
              <span
                className={cn(
                  'text-xs font-medium',
                  getTrendColor(status.trend)
                )}
              >
                {getTrendIcon(status.trend)}
              </span>
            </div>
            <div className={cn('mb-1 text-2xl font-bold', config.textColor)}>
              {status.count}
            </div>
            <div className='text-sm font-medium text-slate-600 dark:text-slate-400'>
              {status.label}
            </div>
          </div>
        );
      })}
    </div>
  );
};
