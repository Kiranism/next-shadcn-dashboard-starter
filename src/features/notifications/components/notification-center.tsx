'use client';

import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';
import { NotificationsRepository } from '@/repositories/notifications.repository';
import { NotificationItem } from './notification-item';
import { toast } from 'sonner';
import { toUserMessage } from '@/lib/api-client';

interface NotificationCenterProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function NotificationCenter({ open, onOpenChange }: NotificationCenterProps) {
  const { data: notifications, isLoading } = NotificationsRepository.useNotifications();
  const deleteMutation = NotificationsRepository.useDeleteNotification();

  function handleDelete(id: string) {
    deleteMutation.mutate(id, {
      onError: (err) => toast.error(toUserMessage(err))
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side='right' className='flex w-[min(85vw,400px)] flex-col p-0 sm:w-[400px]'>
        <SheetHeader className='border-b px-4 py-3'>
          <div className='flex items-center justify-between'>
            <SheetTitle className='text-base'>Notificações</SheetTitle>
            {notifications && notifications.length > 0 && (
              <span className='bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-semibold'>
                {notifications.length}
              </span>
            )}
          </div>
        </SheetHeader>

        <ScrollArea className='flex-1'>
          {isLoading ? (
            <div className='space-y-1.5 px-3 py-2'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='rounded-lg border bg-card px-4 py-3.5 space-y-2'>
                  <Skeleton className='h-4 w-3/4' />
                  <Skeleton className='h-3 w-full' />
                  <Skeleton className='h-3 w-1/3' />
                </div>
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className='py-1.5'>
              {notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onDelete={handleDelete}
                  isDeleting={deleteMutation.isPending && deleteMutation.variables === n.id}
                />
              ))}
            </div>
          ) : (
            <div className='flex flex-col items-center justify-center gap-3 py-16 text-center'>
              <div className='flex size-14 items-center justify-center rounded-full bg-muted'>
                <Icons.notification className='text-muted-foreground size-6' />
              </div>
              <div>
                <p className='text-sm font-medium'>Tudo em dia</p>
                <p className='text-muted-foreground mt-0.5 text-xs'>
                  Nenhuma notificação no momento
                </p>
              </div>
            </div>
          )}
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}
