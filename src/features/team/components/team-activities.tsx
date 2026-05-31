'use client';

import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Icons } from '@/components/icons';
import { ActivitiesRepository, type Activity, type ActivityPriority } from '@/repositories';
import { cn } from '@/lib/utils';
import type { TeamMember } from '../lib/availability';

interface TeamActivitiesProps {
  members: TeamMember[];
  isLoading: boolean;
}

// ─── Date helpers ────────────────────────────────────────────────────────────

function toISODate(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function startOfWeek(d: Date) {
  const day = (d.getDay() + 6) % 7; // Monday = 0
  const m = new Date(d);
  m.setDate(d.getDate() - day);
  m.setHours(0, 0, 0, 0);
  return m;
}

const WEEKDAY_LABELS = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo'];

// ─── Priority styling ────────────────────────────────────────────────────────

const priorityLabel: Record<ActivityPriority, string> = {
  alta: 'Alta',
  media: 'Média',
  baixa: 'Baixa'
};

const priorityDot: Record<ActivityPriority, string> = {
  alta: 'bg-red-500',
  media: 'bg-orange-500',
  baixa: 'bg-blue-500'
};

const priorityBorder: Record<ActivityPriority, string> = {
  alta: 'border-l-red-500',
  media: 'border-l-orange-500',
  baixa: 'border-l-blue-500'
};

function isAllDay(a: Activity) {
  return a.time_start === '00:00' && a.time_end === '23:59';
}

function sortByStart(a: Activity, b: Activity) {
  return a.time_start.localeCompare(b.time_start);
}

export function TeamActivities({ members, isLoading: membersLoading }: TeamActivitiesProps) {
  const [weekOffset, setWeekOffset] = useState(0);

  const { weekDays, from, to, rangeLabel } = useMemo(() => {
    const base = startOfWeek(new Date());
    base.setDate(base.getDate() + weekOffset * 7);
    const weekDays = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base);
      d.setDate(base.getDate() + i);
      return d;
    });
    const from = toISODate(weekDays[0]);
    const to = toISODate(weekDays[6]);
    const fmt = (d: Date) => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    return { weekDays, from, to, rangeLabel: `${fmt(weekDays[0])} – ${fmt(weekDays[6])}` };
  }, [weekOffset]);

  const { data: activities = [], isLoading: activitiesLoading } =
    ActivitiesRepository.useActivities({ from, to });

  const memberIds = useMemo(() => new Set(members.map((m) => m.id)), [members]);

  // Group the subordinates' activities by ISO date.
  const byDate = useMemo(() => {
    const map = new Map<string, Activity[]>();
    for (const a of activities) {
      if (!memberIds.has(a.user_id)) continue;
      const list = map.get(a.date);
      if (list) list.push(a);
      else map.set(a.date, [a]);
    }
    for (const list of map.values()) list.sort(sortByStart);
    return map;
  }, [activities, memberIds]);

  const totalCount = useMemo(
    () => [...byDate.values()].reduce((sum, l) => sum + l.length, 0),
    [byDate]
  );

  const todayISO = toISODate(new Date());
  const isLoading = membersLoading || activitiesLoading;

  return (
    <Card>
      <CardHeader className='pb-3'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <CardTitle className='text-base font-semibold'>Atividades da Semana</CardTitle>
            <CardDescription>
              Compromissos cadastrados pelos membros do time
              {!isLoading && ` · ${totalCount} ${totalCount === 1 ? 'atividade' : 'atividades'}`}
            </CardDescription>
          </div>

          <div className='flex items-center gap-1'>
            <Button
              variant='outline'
              size='icon'
              className='size-8'
              onClick={() => setWeekOffset((o) => o - 1)}
              aria-label='Semana anterior'
            >
              <Icons.chevronLeft className='size-4' />
            </Button>
            <Button
              variant='outline'
              size='sm'
              className='h-8 min-w-32 tabular-nums'
              onClick={() => setWeekOffset(0)}
              disabled={weekOffset === 0}
            >
              {weekOffset === 0 ? 'Esta semana' : rangeLabel}
            </Button>
            <Button
              variant='outline'
              size='icon'
              className='size-8'
              onClick={() => setWeekOffset((o) => o + 1)}
              aria-label='Próxima semana'
            >
              <Icons.chevronRight className='size-4' />
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7'>
            {WEEKDAY_LABELS.map((d) => (
              <Skeleton key={d} className='h-40 w-full' />
            ))}
          </div>
        ) : members.length === 0 ? (
          <EmptyState
            title='Nenhum membro encontrado'
            description='Ajuste os filtros para ver as atividades do time.'
          />
        ) : totalCount === 0 ? (
          <EmptyState
            title='Nenhuma atividade nesta semana'
            description='Os membros selecionados não cadastraram compromissos no período.'
          />
        ) : (
          <div className='grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-7'>
            {weekDays.map((day, i) => {
              const iso = toISODate(day);
              const dayActivities = byDate.get(iso) ?? [];
              const isToday = iso === todayISO;
              return (
                <div
                  key={iso}
                  className={cn(
                    'flex flex-col rounded-lg border',
                    isToday && 'border-primary/50 ring-1 ring-primary/30'
                  )}
                >
                  <div
                    className={cn(
                      'flex items-center justify-between gap-2 border-b px-3 py-2',
                      isToday && 'bg-primary/5'
                    )}
                  >
                    <div className='min-w-0'>
                      <p className='truncate text-xs font-semibold'>{WEEKDAY_LABELS[i]}</p>
                      <p className='text-muted-foreground text-[11px] tabular-nums'>
                        {day.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                      </p>
                    </div>
                    {dayActivities.length > 0 && (
                      <span className='bg-primary/10 text-primary shrink-0 rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums'>
                        {dayActivities.length}
                      </span>
                    )}
                  </div>

                  <div className='flex flex-1 flex-col gap-2 p-2'>
                    {dayActivities.length === 0 ? (
                      <p className='text-muted-foreground/50 flex flex-1 items-center justify-center py-4 text-xs'>
                        —
                      </p>
                    ) : (
                      dayActivities.map((a) => <ActivityCard key={a.id} activity={a} />)
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Activity card ───────────────────────────────────────────────────────────

function ActivityCard({ activity }: { activity: Activity }) {
  return (
    <div
      className={cn(
        'rounded-md border border-l-2 bg-card p-2 transition-colors hover:bg-accent/40',
        priorityBorder[activity.priority]
      )}
    >
      <p className='line-clamp-2 text-xs font-medium leading-snug'>{activity.name}</p>
      <p className='text-muted-foreground mt-1 truncate text-[11px]'>{activity.user_name}</p>
      <div className='mt-1 flex items-center gap-1.5'>
        <span className='text-muted-foreground flex items-center gap-1 text-[11px] tabular-nums'>
          <Icons.clock className='size-3' />
          {isAllDay(activity) ? 'Dia todo' : `${activity.time_start}–${activity.time_end}`}
        </span>
        <span
          className={cn('ml-auto size-2 shrink-0 rounded-full', priorityDot[activity.priority])}
          title={`Prioridade ${priorityLabel[activity.priority]}`}
          aria-label={`Prioridade ${priorityLabel[activity.priority]}`}
        />
      </div>
    </div>
  );
}

function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className='text-muted-foreground flex flex-col items-center justify-center rounded-lg border border-dashed py-10 text-center'>
      <Icons.calendar className='mb-2 size-8 opacity-40' />
      <p className='text-sm font-medium'>{title}</p>
      <p className='mt-0.5 text-xs'>{description}</p>
    </div>
  );
}
