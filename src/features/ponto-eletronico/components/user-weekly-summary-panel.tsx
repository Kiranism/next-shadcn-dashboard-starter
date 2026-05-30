'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TimeEntriesRepository } from '@/repositories/time-entries.repository';
import { SettingsRepository } from '@/repositories/settings.repository';
import { ROLE_LABEL } from '@/constants/user-options';
import type { UserResponse } from '@/types/api';

interface UserWeeklySummaryPanelProps {
  user: UserResponse;
  onClose: () => void;
}

function minutesToHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function formatDateBR(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

export function UserWeeklySummaryPanel({ user, onClose }: UserWeeklySummaryPanelProps) {
  const { data: summary, isLoading } = TimeEntriesRepository.useUserSummary(user.id);
  const { data: settings } = SettingsRepository.useSettings();

  const minMinutes = (settings?.min_week_hours ?? 0) * 60;
  const progressPct =
    minMinutes > 0
      ? Math.min(100, Math.round(((summary?.total_minutes ?? 0) / minMinutes) * 100))
      : 0;

  return (
    <Sheet open onOpenChange={(open) => !open && onClose()}>
      <SheetContent className='flex flex-col gap-0 overflow-y-auto'>
        <SheetHeader className='pb-4'>
          <div className='flex items-center gap-3'>
            <div className='bg-muted flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-semibold'>
              {getInitials(user.name)}
            </div>
            <div className='min-w-0'>
              <SheetTitle className='truncate'>{user.name}</SheetTitle>
              <SheetDescription className='mt-0'>
                {ROLE_LABEL[user.role] ?? user.role}
                {user.sector && <> · {user.sector}</>}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>

        <div className='space-y-5 pt-2'>
          {isLoading ? (
            <div className='space-y-3'>
              <Skeleton className='h-10 w-36' />
              <Skeleton className='h-2 w-full' />
              <Skeleton className='h-24 w-full' />
            </div>
          ) : summary ? (
            <>
              <p className='text-muted-foreground text-xs'>
                Semana {formatDateBR(summary.week_start)} — {formatDateBR(summary.week_end)}
              </p>

              <div className='flex flex-wrap items-center gap-3'>
                <span className='text-3xl font-bold tabular-nums'>
                  {minutesToHours(summary.total_minutes)}
                </span>
                <Badge variant={summary.min_hours_met ? 'default' : 'secondary'}>
                  {summary.min_hours_met ? 'Meta atingida' : 'Meta pendente'}
                </Badge>
              </div>

              {minMinutes > 0 && (
                <div className='space-y-1'>
                  <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
                    <div
                      className={`h-1.5 rounded-full transition-all duration-500 ${
                        summary.min_hours_met ? 'bg-green-500' : 'bg-primary'
                      }`}
                      style={{ width: `${progressPct}%` }}
                    />
                  </div>
                  <p className='text-muted-foreground text-xs'>
                    {progressPct}% da meta ({settings?.min_week_hours}h)
                  </p>
                </div>
              )}

              {summary.current_session.status === 'open' && (
                <div className='flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2'>
                  <span className='size-2 shrink-0 animate-pulse rounded-full bg-green-500' />
                  <span className='text-sm text-green-600 dark:text-green-400'>
                    Sessão em andamento — {minutesToHours(summary.current_session.elapsed_minutes)}{' '}
                    decorridos
                  </span>
                </div>
              )}

              {summary.valid_sessions.length > 0 ? (
                <div className='space-y-2'>
                  <p className='text-muted-foreground text-xs font-medium uppercase tracking-wider'>
                    Sessões válidas ({summary.valid_sessions.length})
                  </p>
                  <div className='divide-border divide-y rounded-md border'>
                    {summary.valid_sessions.map((s) => {
                      const day = formatDate(s.clocked_in_at);
                      const inTime = formatTime(s.clocked_in_at);
                      const outTime = formatTime(s.clocked_out_at);
                      return (
                        <div
                          key={s.id}
                          className='flex items-center justify-between px-3 py-2.5 text-sm'
                        >
                          <div className='min-w-0'>
                            <span className='text-muted-foreground capitalize'>{day}</span>
                            <span className='text-muted-foreground mx-1.5'>·</span>
                            <span className='tabular-nums'>
                              {inTime} → {outTime}
                            </span>
                          </div>
                          <span className='text-muted-foreground ml-3 shrink-0 tabular-nums'>
                            {minutesToHours(s.duration_minutes)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <p className='text-muted-foreground text-sm'>Nenhuma sessão válida esta semana.</p>
              )}
            </>
          ) : (
            <p className='text-muted-foreground text-sm'>Sem dados disponíveis.</p>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
