'use client';

import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import type { Notification } from '@/repositories/notifications.repository';

function formatRelativeTime(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'agora mesmo';
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `há ${days}d`;
  return new Date(iso).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: '2-digit'
  });
}

interface NotificationItemProps {
  notification: Notification;
  onDelete: (id: string) => void;
  isDeleting: boolean;
}

export function NotificationItem({ notification, onDelete, isDeleting }: NotificationItemProps) {
  const isAutomatic = notification.origin === 'automatic';

  return (
    <div
      className={cn(
        'group relative mx-3 my-1.5 rounded-lg border bg-card px-4 py-3.5 shadow-xs transition-colors hover:bg-muted/50',
        isDeleting && 'pointer-events-none opacity-40'
      )}
    >
      {/* Left accent strip */}
      <div
        className={cn(
          'absolute bottom-3 left-0 top-3 w-[3px] rounded-r-full',
          isAutomatic ? 'bg-muted-foreground/25' : 'bg-primary'
        )}
      />

      <div className='flex gap-3'>
        {/* Origin icon */}
        <div
          className={cn(
            'mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full',
            isAutomatic ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
          )}
        >
          {isAutomatic ? (
            <Icons.notification className='size-4' />
          ) : (
            <Icons.send className='size-3.5' />
          )}
        </div>

        {/* Content */}
        <div className='min-w-0 flex-1 pr-5'>
          <p className='text-sm font-semibold leading-snug'>{notification.title}</p>
          {notification.description && (
            <p className='text-muted-foreground mt-1 text-xs leading-relaxed'>
              {notification.description}
            </p>
          )}
          <div className='mt-2.5 flex items-center gap-1.5'>
            <span
              className={cn(
                'inline-flex items-center rounded-sm px-1.5 py-0.5 text-[10px] font-medium',
                isAutomatic ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
              )}
            >
              {isAutomatic ? 'Automática' : 'Dirigida'}
            </span>
            <span className='text-muted-foreground text-[11px]'>·</span>
            <span className='text-muted-foreground text-[11px]' suppressHydrationWarning>
              {formatRelativeTime(notification.sent_at)}
            </span>
          </div>
        </div>
      </div>

      {/* Dismiss */}
      <Button
        variant='ghost'
        size='icon'
        className='absolute right-1.5 top-2 size-6 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 text-muted-foreground hover:text-foreground hover:bg-muted'
        onClick={() => onDelete(notification.id)}
        aria-label='Descartar notificação'
      >
        <Icons.close className='size-3' />
      </Button>
    </div>
  );
}
