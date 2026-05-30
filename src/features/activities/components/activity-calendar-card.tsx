'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Button, buttonVariants } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { ActivitiesRepository } from '@/repositories/activities.repository';
import type { Activity, ActivityPriority } from '@/repositories/activities.repository';
import { toUserMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { EditActivitySheet } from './edit-activity-sheet';

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function endOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0);
}

function formatDateBR(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

const priorityLabel: Record<string, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa'
};

const priorityClass: Record<string, string> = {
  alta: 'bg-red-500/15 text-red-600 dark:text-red-400',
  media: 'bg-orange-500/15 text-orange-600 dark:text-orange-400',
  baixa: 'bg-blue-500/15 text-blue-600 dark:text-blue-400'
};

const priorityDot: Record<string, string> = {
  alta: 'bg-red-500',
  media: 'bg-orange-500',
  baixa: 'bg-blue-500'
};

const priorityRank: Record<ActivityPriority, number> = {
  alta: 3,
  media: 2,
  baixa: 1
};

// Calendar day-dot positioning (color is added per priority).
const dayDotBase =
  "after:pointer-events-none after:absolute after:bottom-1 after:left-1/2 after:size-1.5 after:-translate-x-1/2 after:rounded-full after:content-['']";

function sortByStart(a: Activity, b: Activity) {
  return a.time_start.localeCompare(b.time_start);
}

function isAllDay(activity: Activity) {
  return activity.time_start === '00:00' && activity.time_end === '23:59';
}

interface ActivityItemProps {
  activity: Activity;
  onEdit: (a: Activity) => void;
  onDelete: (a: Activity) => void;
}

function ActivityItem({ activity, onEdit, onDelete }: ActivityItemProps) {
  return (
    <div className='group hover:border-primary/30 relative rounded-lg border bg-card p-3 transition-colors hover:bg-accent/40'>
      <div className='flex items-start gap-3'>
        <span
          className={cn('mt-1 size-2.5 shrink-0 rounded-full', priorityDot[activity.priority])}
          aria-hidden
        />
        <div className='min-w-0 flex-1'>
          <p className='truncate pr-6 text-sm font-medium leading-snug'>{activity.name}</p>
          {activity.description && (
            <p className='text-muted-foreground mt-0.5 line-clamp-2 text-xs'>
              {activity.description}
            </p>
          )}
          <div className='mt-1.5 flex flex-wrap items-center gap-2'>
            <span className='text-muted-foreground flex items-center gap-1 text-xs tabular-nums'>
              <Icons.clock className='size-3' />
              {isAllDay(activity) ? 'O dia todo' : `${activity.time_start}–${activity.time_end}`}
            </span>
            <span
              className={cn(
                'rounded px-1.5 py-0.5 text-xs font-medium',
                priorityClass[activity.priority]
              )}
            >
              {priorityLabel[activity.priority]}
            </span>
          </div>
        </div>
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant='ghost'
            size='icon'
            className='absolute right-1.5 top-1.5 size-7 shrink-0 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-within:opacity-100'
          >
            <Icons.ellipsis className='size-4' />
            <span className='sr-only'>Ações</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuItem onClick={() => onEdit(activity)}>
            <Icons.edit className='mr-2 size-3.5' />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            className='text-destructive focus:text-destructive'
            onClick={() => onDelete(activity)}
          >
            <Icons.trash className='mr-2 size-3.5' />
            Excluir
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}

interface ActivityCalendarCardProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
}

export function ActivityCalendarCard({ selectedDate, onSelectDate }: ActivityCalendarCardProps) {
  const [month, setMonth] = useState<Date>(() =>
    selectedDate ? new Date(selectedDate + 'T00:00:00') : new Date()
  );
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<Activity | null>(null);

  const { data: dayActivities = [], isLoading } = ActivitiesRepository.useMyActivities({
    date: selectedDate
  });

  // Activities across the visible month — used to mark days that have something scheduled.
  const { data: monthActivities = [] } = ActivitiesRepository.useMyActivities({
    from: toISODate(startOfMonth(month)),
    to: toISODate(endOfMonth(month))
  });

  const deleteMutation = ActivitiesRepository.useDeleteActivity();

  const activities = useMemo(() => dayActivities.toSorted(sortByStart), [dayActivities]);

  // Bucket each day by its highest-priority activity so the dot color reflects it.
  const daysByPriority = useMemo(() => {
    const highestByDay = new Map<string, ActivityPriority>();
    for (const a of monthActivities) {
      const current = highestByDay.get(a.date);
      if (!current || priorityRank[a.priority] > priorityRank[current]) {
        highestByDay.set(a.date, a.priority);
      }
    }
    const buckets: Record<ActivityPriority, Date[]> = {
      alta: [],
      media: [],
      baixa: []
    };
    for (const [date, priority] of highestByDay) {
      buckets[priority].push(new Date(date + 'T00:00:00'));
    }
    return buckets;
  }, [monthActivities]);

  const selectedCalendarDate = selectedDate ? new Date(selectedDate + 'T00:00:00') : undefined;
  const todayISO = toISODate(new Date());
  const isToday = selectedDate === todayISO;

  function handleCalendarSelect(day: Date | undefined) {
    if (!day) return;
    onSelectDate(toISODate(day));
    setMonth(day);
  }

  function goToToday() {
    const today = new Date();
    onSelectDate(toISODate(today));
    setMonth(today);
  }

  function handleConfirmDelete() {
    if (!deletingActivity) return;
    deleteMutation.mutate(deletingActivity.id, {
      onSuccess: () => {
        toast.success('Atividade excluída');
        setDeletingActivity(null);
      },
      onError: (err: Error) => {
        toast.error(toUserMessage(err));
        setDeletingActivity(null);
      }
    });
  }

  return (
    <>
      <Card className='flex h-full flex-col'>
        <CardHeader className='pb-4'>
          <div className='flex items-start justify-between gap-2'>
            <div>
              <CardTitle className='text-base font-semibold'>Calendário</CardTitle>
              <CardDescription>Toque em um dia para ver as atividades</CardDescription>
            </div>
            <Button
              variant='outline'
              size='sm'
              onClick={goToToday}
              disabled={isToday}
              className='h-8 shrink-0'
            >
              <Icons.calendar className='size-3.5' />
              Hoje
            </Button>
          </div>
        </CardHeader>
        <CardContent className='flex-1 px-4 pb-4 sm:px-6'>
          {/* Calendar */}
          <div className='flex justify-center'>
            <Calendar
              mode='single'
              navLayout='around'
              month={month}
              onMonthChange={setMonth}
              selected={selectedCalendarDate}
              onSelect={handleCalendarSelect}
              modifiers={{
                priorityAlta: daysByPriority.alta,
                priorityMedia: daysByPriority.media,
                priorityBaixa: daysByPriority.baixa
              }}
              modifiersClassNames={{
                priorityAlta: cn(dayDotBase, 'after:bg-red-500'),
                priorityMedia: cn(dayDotBase, 'after:bg-orange-500'),
                priorityBaixa: cn(dayDotBase, 'after:bg-blue-500')
              }}
              classNames={{
                today: 'rounded-md font-bold text-primary ring-1 ring-inset ring-primary/70',
                month: 'relative flex flex-col gap-4',
                month_caption: 'flex h-7 items-center justify-center',
                button_previous: cn(
                  buttonVariants({ variant: 'outline' }),
                  'absolute left-1 top-0 size-7 bg-transparent p-0 opacity-70 hover:opacity-100'
                ),
                button_next: cn(
                  buttonVariants({ variant: 'outline' }),
                  'absolute right-1 top-0 size-7 bg-transparent p-0 opacity-70 hover:opacity-100'
                )
              }}
              className='rounded-lg border'
            />
          </div>

          {/* Activities for the selected day */}
          <div className='mt-5'>
            <div className='mb-3 flex items-center justify-between gap-2'>
              <div className='min-w-0'>
                <p className='text-muted-foreground text-xs font-medium uppercase tracking-wider'>
                  Atividades
                </p>
                {selectedDate && (
                  <p className='mt-0.5 truncate text-sm font-semibold capitalize'>
                    {formatDateBR(selectedDate)}
                  </p>
                )}
              </div>
              {activities.length > 0 && (
                <span className='bg-primary/10 text-primary shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold tabular-nums'>
                  {activities.length} {activities.length === 1 ? 'item' : 'itens'}
                </span>
              )}
            </div>

            {isLoading ? (
              <div className='space-y-2'>
                {[1, 2].map((i) => (
                  <div key={i} className='bg-muted h-17 animate-pulse rounded-lg' />
                ))}
              </div>
            ) : activities.length === 0 ? (
              <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center'>
                <Icons.calendar className='mb-2 size-8 opacity-40' />
                <p className='text-sm font-medium'>Nenhuma atividade para este dia</p>
                <p className='mt-0.5 text-xs'>Use o formulário para adicionar uma.</p>
              </div>
            ) : (
              <div className='space-y-2'>
                {activities.map((a) => (
                  <ActivityItem
                    key={a.id}
                    activity={a}
                    onEdit={setEditingActivity}
                    onDelete={setDeletingActivity}
                  />
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <EditActivitySheet activity={editingActivity} onClose={() => setEditingActivity(null)} />

      <AlertDialog
        open={!!deletingActivity}
        onOpenChange={(open) => {
          if (!open) setDeletingActivity(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir atividade?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser desfeita. A atividade &quot;
              {deletingActivity?.name}&quot; será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className='bg-destructive text-destructive-foreground hover:bg-destructive/90'
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
