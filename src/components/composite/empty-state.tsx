/**
 * @file: src/components/composite/empty-state.tsx
 * @description: Универсальный компонент пустого состояния
 * @project: SaaS Bonus System
 * @dependencies: lucide-react, shadcn/ui
 * @created: 2026-01-21
 * @author: AI Assistant + User
 */

'use client';

import { ReactNode, isValidElement, createElement } from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  // Content
  icon?: LucideIcon | ReactNode;
  title: string;
  description?: string;

  // Action
  action?: ReactNode;

  // Styling
  className?: string;
  iconClassName?: string;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses = {
  sm: {
    container: 'py-8',
    icon: 'h-8 w-8',
    title: 'text-base',
    description: 'text-xs'
  },
  md: {
    container: 'py-12',
    icon: 'h-12 w-12',
    title: 'text-lg',
    description: 'text-sm'
  },
  lg: {
    container: 'py-16',
    icon: 'h-16 w-16',
    title: 'text-xl',
    description: 'text-base'
  }
};

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
  iconClassName,
  size = 'md'
}: EmptyStateProps) {
  const sizes = sizeClasses[size];

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        sizes.container,
        className
      )}
    >
      {Icon && (
        <div className={cn('bg-muted mb-4 rounded-full p-3', iconClassName)}>
          {isValidElement(Icon)
            ? Icon
            : createElement(Icon as React.ComponentType<{ className?: string }>, {
                className: cn('text-muted-foreground', sizes.icon)
              })}
        </div>
      )}

      <h3 className={cn('text-foreground font-semibold', sizes.title)}>
        {title}
      </h3>

      {description && (
        <p
          className={cn(
            'text-muted-foreground mt-2 max-w-sm',
            sizes.description
          )}
        >
          {description}
        </p>
      )}

      {action && <div className='mt-4'>{action}</div>}
    </div>
  );
}
