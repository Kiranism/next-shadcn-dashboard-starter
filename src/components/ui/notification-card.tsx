'use client';

import type { FC } from 'react';
import {
  IconCheck,
  IconExternalLink,
  IconAlertCircle,
  IconClock,
  IconLoader2
} from '@tabler/icons-react';
import { cn } from '@/lib/utils';

export type NotificationStatus = 'unread' | 'read' | 'archived';
export type ActionType = 'redirect' | 'api_call' | 'workflow' | 'modal';
export type ActionStyle = 'primary' | 'danger' | 'default';

export interface NotificationAction {
  id: string;
  label: string;
  type: ActionType;
  style?: ActionStyle;
  executed?: boolean;
}

export interface NotificationCardProps {
  id: string;
  title: string;
  body: string;
  status?: NotificationStatus;
  createdAt?: string | Date;
  actions?: NotificationAction[];
  onMarkAsRead?: (id: string) => void;
  onAction?: (
    notificationId: string,
    actionId: string,
    actionType: ActionType
  ) => void;
  loadingActionId?: string;
  className?: string;
}

const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;

  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric'
  });
};

const getActionIcon = (actionType: ActionType) => {
  const iconProps = { size: 12, strokeWidth: 2.5 };
  switch (actionType) {
    case 'redirect':
      return <IconExternalLink {...iconProps} />;
    case 'api_call':
      return <IconCheck {...iconProps} />;
    case 'workflow':
      return <IconClock {...iconProps} />;
    case 'modal':
      return <IconAlertCircle {...iconProps} />;
    default:
      return null;
  }
};

export const NotificationCard: FC<NotificationCardProps> = ({
  id,
  title,
  body,
  status = 'unread',
  createdAt,
  actions = [],
  onMarkAsRead,
  onAction,
  loadingActionId,
  className
}) => {
  const isUnread = status === 'unread';

  return (
    <div
      className={cn(
        'group relative w-full rounded-2xl transition-all',
        isUnread ? 'bg-muted' : 'bg-muted/40',
        className
      )}
    >
      <div className='px-4 py-3.5'>
        <div className='flex items-start justify-between gap-3'>
          {/* Main content */}
          <div className='min-w-0 flex-1 space-y-1'>
            {/* Title with unread indicator */}
            <div className='flex items-center gap-2'>
              <h3
                className={cn(
                  'text-[15px] leading-tight font-semibold',
                  isUnread ? 'text-foreground' : 'text-muted-foreground'
                )}
              >
                {title}
              </h3>
              {isUnread && (
                <div className='h-1.5 w-1.5 flex-shrink-0 rounded-full bg-sky-500' />
              )}
            </div>

            {/* Description */}
            <p
              className={cn(
                'mb-0 text-[13px]',
                isUnread ? 'text-muted-foreground' : 'text-muted-foreground/60'
              )}
            >
              {body}
            </p>
          </div>

          {/* Mark as read button */}
          {isUnread && onMarkAsRead && (
            <button
              type='button'
              onClick={() => onMarkAsRead(id)}
              className={cn(
                'rounded-lg p-1.5 transition-colors',
                'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
              aria-label='Mark as read'
            >
              <IconCheck size={16} />
            </button>
          )}
        </div>

        <div className='mt-3 flex items-end justify-between'>
          {/* Actions */}
          {actions.length > 0 && (
            <div
              className={cn(
                'flex flex-wrap items-center gap-2',
                !isUnread && 'opacity-60'
              )}
            >
              {actions.map((action) => {
                const isLoading = loadingActionId === action.id;
                const isExecuted = action.executed || false;
                const showLoading = isLoading && action.type !== 'modal';

                return (
                  <button
                    key={action.id}
                    type='button'
                    disabled={isLoading || isExecuted}
                    onClick={() => onAction?.(id, action.id, action.type)}
                    className={cn(
                      'flex items-center gap-1.5 rounded-lg px-4 py-1.5 text-xs font-normal transition',
                      action.style === 'primary'
                        ? 'bg-primary/10 text-primary hover:bg-primary/20'
                        : action.style === 'danger'
                          ? 'bg-destructive/10 text-destructive hover:bg-destructive/20'
                          : 'bg-accent text-muted-foreground hover:bg-accent hover:text-foreground',
                      showLoading && 'opacity-50',
                      isExecuted && 'cursor-not-allowed opacity-60'
                    )}
                  >
                    {showLoading ? (
                      <IconLoader2 size={12} className='animate-spin' />
                    ) : (
                      <>
                        <span>{action.label}</span>
                        {isExecuted ? (
                          <IconCheck size={12} strokeWidth={2.5} />
                        ) : (
                          getActionIcon(action.type)
                        )}
                      </>
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Timestamp */}
          {createdAt && (
            <span className='text-muted-foreground/60 inline-block text-[11px]'>
              {formatDate(createdAt)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
