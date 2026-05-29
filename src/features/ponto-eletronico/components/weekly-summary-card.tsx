'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TimeEntriesRepository } from '@/repositories/time-entries.repository';
import { SettingsRepository } from '@/repositories/settings.repository';
import { ClockInOutButton } from './clock-in-out-button';

function minutesToHours(minutes: number) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (m === 0) return `${h}h`;
  return `${h}h ${m.toString().padStart(2, '0')}m`;
}

function formatDateBR(dateStr: string) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function formatSessionRange(clockedIn: string, clockedOut: string) {
  const inDate = new Date(clockedIn);
  const outDate = new Date(clockedOut);
  const dayStr = inDate.toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit'
  });
  const inTime = inDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  const outTime = outDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  return { dayStr, inTime, outTime };
}

export function WeeklySummaryCard() {
  const { data: summary, isLoading: summaryLoading } = TimeEntriesRepository.useMySummary();
  const { data: settings } = SettingsRepository.useSettings();

  const minMinutes = (settings?.min_week_hours ?? 0) * 60;
  const progressPct =
    minMinutes > 0
      ? Math.min(100, Math.round(((summary?.total_minutes ?? 0) / minMinutes) * 100))
      : 0;
  const isOpen = summary?.current_session?.status === 'open';

  return (
    <Card className='overflow-hidden'>
      <CardHeader className='flex flex-row items-start justify-between gap-2 pb-3'>
        <div>
          <CardTitle className='text-base font-semibold'>Meu Ponto</CardTitle>
          {summary && (
            <p className='text-muted-foreground mt-0.5 text-xs'>
              {formatDateBR(summary.week_start)} — {formatDateBR(summary.week_end)}
            </p>
          )}
        </div>
        {!summaryLoading && summary && (
          <Badge variant={summary.min_hours_met ? 'default' : 'secondary'} className='shrink-0'>
            {summary.min_hours_met ? 'Meta atingida' : 'Meta pendente'}
          </Badge>
        )}
      </CardHeader>

      <CardContent className='space-y-5'>
        {summaryLoading ? (
          <div className='space-y-3'>
            <Skeleton className='h-10 w-32' />
            <Skeleton className='h-2 w-full' />
            <Skeleton className='h-9 w-full' />
          </div>
        ) : (
          <>
            <div className='flex items-end gap-2'>
              <span className='text-4xl font-bold tabular-nums'>
                {minutesToHours(summary?.total_minutes ?? 0)}
              </span>
              {settings && (
                <span className='text-muted-foreground pb-1 text-sm'>
                  de {settings.min_week_hours}h semanais
                </span>
              )}
            </div>

            {minMinutes > 0 && (
              <div className='space-y-1'>
                <div className='bg-muted h-1.5 w-full overflow-hidden rounded-full'>
                  <div
                    className={`h-1.5 rounded-full transition-all duration-500 ${
                      summary?.min_hours_met ? 'bg-green-500' : 'bg-primary'
                    }`}
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className='text-muted-foreground text-xs'>{progressPct}% da meta</p>
              </div>
            )}

            {isOpen && summary?.current_session?.status === 'open' && (
              <div className='flex items-center gap-2 rounded-md border border-green-500/30 bg-green-500/10 px-3 py-2'>
                <span className='size-2 shrink-0 animate-pulse rounded-full bg-green-500' />
                <span className='text-sm text-green-600 dark:text-green-400'>
                  Sessão em andamento — {minutesToHours(summary.current_session.elapsed_minutes)}{' '}
                  decorridos
                </span>
              </div>
            )}

            {summary?.current_session?.status === 'invalid' && (
              <div className='flex items-center gap-2 rounded-md border border-yellow-500/30 bg-yellow-500/10 px-3 py-2'>
                <span className='size-2 shrink-0 rounded-full bg-yellow-500' />
                <span className='text-sm text-yellow-600 dark:text-yellow-400'>
                  Sessão excedeu 8h — registre sua saída
                </span>
              </div>
            )}

            <ClockInOutButton summary={summary} />

            {summary && summary.valid_sessions.length > 0 && (
              <div className='space-y-2'>
                <p className='text-muted-foreground text-xs font-medium uppercase tracking-wider'>
                  Sessões desta semana ({summary.valid_sessions.length})
                </p>
                <div className='divide-border max-h-64 divide-y overflow-y-auto rounded-md border'>
                  {summary.valid_sessions.map((s) => {
                    const { dayStr, inTime, outTime } = formatSessionRange(
                      s.clocked_in_at,
                      s.clocked_out_at
                    );
                    return (
                      <div
                        key={s.id}
                        className='flex items-center justify-between px-3 py-2 text-sm'
                      >
                        <div className='min-w-0'>
                          <span className='text-muted-foreground capitalize'>{dayStr}</span>
                          <span className='text-muted-foreground mx-1.5'>·</span>
                          <span>
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
            )}

            {summary && summary.valid_sessions.length === 0 && !isOpen && (
              <p className='text-muted-foreground text-sm'>
                Nenhuma sessão registrada esta semana.
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
