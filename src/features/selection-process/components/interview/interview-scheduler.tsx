'use client';

import { useState, useMemo } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { getAvailableInterviewSlots, bookInterview } from '../../lib/api-public';
import type { AvailableInterviewSlot } from '@/types/selection-process';

// ─── Date/Time helpers ────────────────────────────────────────────────────────

const TZ = 'America/Sao_Paulo';

function getDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ
  });
}

function formatDatePill(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short'
  });
}

function formatDateLong(dateKey: string): string {
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
}

// ─── Sub-screens ─────────────────────────────────────────────────────────────

function SuccessScreen({ slot }: { slot: AvailableInterviewSlot }) {
  return (
    <div className='flex flex-col items-center text-center gap-5 py-10'>
      <div className='flex size-16 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/30'>
        <Icons.circleCheck className='size-9 text-emerald-600 dark:text-emerald-400' />
      </div>
      <div>
        <h2 className='text-xl font-bold'>Entrevista agendada!</h2>
        <p className='text-muted-foreground mt-1 text-sm'>
          Sua entrevista foi confirmada com sucesso.
        </p>
      </div>
      <div className='rounded-2xl border bg-muted/40 p-5 text-left w-full space-y-3'>
        <div className='flex items-center gap-3 text-sm'>
          <div className='flex size-8 items-center justify-center rounded-full bg-background border'>
            <Icons.calendar className='size-4 text-muted-foreground' />
          </div>
          <span className='font-medium capitalize'>
            {formatDateLong(getDateKey(slot.starts_at))}
          </span>
        </div>
        <div className='flex items-center gap-3 text-sm'>
          <div className='flex size-8 items-center justify-center rounded-full bg-background border'>
            <Icons.clock className='size-4 text-muted-foreground' />
          </div>
          <span className='font-medium'>
            {formatTime(slot.starts_at)} – {formatTime(slot.ends_at)}
          </span>
          <span className='text-xs text-muted-foreground'>(Horário de Brasília)</span>
        </div>
      </div>
      <p className='text-xs text-muted-foreground max-w-xs leading-relaxed'>
        Você receberá um e-mail com os detalhes e o link para participar da entrevista.
      </p>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  const isAuthError =
    message.toLowerCase().includes('inválido') || message.toLowerCase().includes('expirado');
  return (
    <div className='flex flex-col items-center text-center gap-5 py-10'>
      <div className='flex size-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'>
        <Icons.circleX className='size-9 text-red-600 dark:text-red-400' />
      </div>
      <div>
        <h2 className='text-xl font-bold'>
          {isAuthError ? 'Link inválido ou expirado' : 'Ocorreu um erro'}
        </h2>
        <p className='text-muted-foreground mt-1 text-sm max-w-xs leading-relaxed'>{message}</p>
      </div>
      <a
        href='mailto:psel@wattconsultoria.com.br'
        className='inline-flex items-center gap-2 text-sm text-primary underline underline-offset-4 hover:text-primary/80'
      >
        <Icons.send className='size-3.5' />
        psel@wattconsultoria.com.br
      </a>
    </div>
  );
}

function AlreadyBookedScreen() {
  return (
    <div className='flex flex-col items-center text-center gap-5 py-10'>
      <div className='flex size-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'>
        <Icons.circleCheck className='size-9 text-blue-600 dark:text-blue-400' />
      </div>
      <div>
        <h2 className='text-xl font-bold'>Entrevista já agendada</h2>
        <p className='text-muted-foreground mt-1 text-sm max-w-xs leading-relaxed'>
          Você já possui uma entrevista agendada. Caso precise reagendar, entre em contato com a
          equipe do Processo Seletivo.
        </p>
      </div>
      <a
        href='mailto:psel@wattconsultoria.com.br'
        className='inline-flex items-center gap-2 text-sm text-primary underline underline-offset-4 hover:text-primary/80'
      >
        <Icons.send className='size-3.5' />
        psel@wattconsultoria.com.br
      </a>
    </div>
  );
}

function NoSlotsScreen() {
  return (
    <div className='flex flex-col items-center text-center gap-4 py-10'>
      <div className='flex size-16 items-center justify-center rounded-full bg-muted'>
        <Icons.calendar className='size-7 text-muted-foreground' />
      </div>
      <div>
        <h2 className='text-lg font-semibold'>Sem horários disponíveis</h2>
        <p className='text-muted-foreground mt-1 text-sm max-w-xs leading-relaxed'>
          Não há horários disponíveis para agendamento no momento. Entre em contato com a equipe.
        </p>
      </div>
      <a
        href='mailto:psel@wattconsultoria.com.br'
        className='text-sm text-primary underline underline-offset-4 hover:text-primary/80'
      >
        psel@wattconsultoria.com.br
      </a>
    </div>
  );
}

// ─── Main scheduler ───────────────────────────────────────────────────────────

type PageState =
  | { type: 'selecting' }
  | { type: 'booked'; slot: AvailableInterviewSlot }
  | { type: 'already_booked' }
  | { type: 'error'; message: string };

export function InterviewScheduler({ token }: { token: string }) {
  const [pageState, setPageState] = useState<PageState>({ type: 'selecting' });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<AvailableInterviewSlot | null>(null);

  const {
    data: slots,
    isLoading,
    error: fetchError
  } = useQuery({
    queryKey: ['public-interview-slots'],
    queryFn: getAvailableInterviewSlots,
    retry: 1
  });

  const bookMutation = useMutation({
    mutationFn: bookInterview,
    onSuccess: (booking) => {
      setPageState({
        type: 'booked',
        slot: { starts_at: booking.starts_at, ends_at: booking.ends_at }
      });
    },
    onError: (err: Error) => {
      if (
        err.message.toLowerCase().includes('já possui') ||
        err.message.toLowerCase().includes('já existe')
      ) {
        setPageState({ type: 'already_booked' });
      } else {
        setPageState({ type: 'error', message: err.message });
      }
    }
  });

  const slotsByDate = useMemo(() => {
    const map = new Map<string, AvailableInterviewSlot[]>();
    for (const slot of slots ?? []) {
      const key = getDateKey(slot.starts_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    return map;
  }, [slots]);

  const sortedDates = useMemo(() => [...slotsByDate.keys()].sort(), [slotsByDate]);

  const effectiveDate = selectedDate ?? sortedDates[0] ?? null;
  const slotsForDate = effectiveDate ? (slotsByDate.get(effectiveDate) ?? []) : [];

  function handleDateSelect(dateKey: string) {
    setSelectedDate(dateKey);
    setSelectedSlot(null);
  }

  function handleConfirm() {
    if (!selectedSlot) return;
    bookMutation.mutate({ starts_at: selectedSlot.starts_at, token });
  }

  // ── Static screens ────────────────────────────────────────────────────────

  if (pageState.type === 'booked') return <SuccessScreen slot={pageState.slot} />;
  if (pageState.type === 'already_booked') return <AlreadyBookedScreen />;
  if (pageState.type === 'error') return <ErrorScreen message={pageState.message} />;

  // ── Loading ───────────────────────────────────────────────────────────────

  if (isLoading) {
    return (
      <div className='flex flex-col items-center gap-3 py-16 text-center'>
        <Icons.spinner className='size-6 animate-spin text-muted-foreground' />
        <p className='text-sm text-muted-foreground'>Carregando horários disponíveis…</p>
      </div>
    );
  }

  if (fetchError) {
    return (
      <ErrorScreen message='Não foi possível carregar os horários. Tente novamente mais tarde.' />
    );
  }

  if (!slots || slots.length === 0) return <NoSlotsScreen />;

  // ── Slot selection ────────────────────────────────────────────────────────

  return (
    <div className='space-y-7'>
      {/* Header */}
      <div>
        <h1 className='text-2xl font-bold tracking-tight'>Agendar Entrevista</h1>
        <p className='text-muted-foreground mt-1 text-sm'>
          Selecione um dia e horário para sua entrevista com a Watt Consultoria.
        </p>
      </div>

      {/* Date pills */}
      <div>
        <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3'>
          Dias disponíveis
        </p>
        <div className='flex gap-2 overflow-x-auto pb-1 -mx-1 px-1'>
          {sortedDates.map((dateKey) => {
            const isSelected = (selectedDate ?? sortedDates[0]) === dateKey;
            return (
              <button
                key={dateKey}
                onClick={() => handleDateSelect(dateKey)}
                className={cn(
                  'shrink-0 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all',
                  isSelected
                    ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                    : 'border-border bg-card text-foreground hover:border-primary/50 hover:bg-muted'
                )}
              >
                <span className='capitalize'>{formatDatePill(dateKey)}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time slots */}
      <div>
        <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3'>
          Horários disponíveis
          {effectiveDate && (
            <span className='ml-2 font-normal normal-case capitalize'>
              — {formatDatePill(effectiveDate)}
            </span>
          )}
        </p>
        {slotsForDate.length === 0 ? (
          <p className='text-sm text-muted-foreground py-4'>
            Nenhum horário disponível para este dia.
          </p>
        ) : (
          <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
            {slotsForDate.map((slot) => {
              const isSelected = selectedSlot?.starts_at === slot.starts_at;
              return (
                <button
                  key={slot.starts_at}
                  onClick={() => setSelectedSlot(isSelected ? null : slot)}
                  className={cn(
                    'flex flex-col items-center justify-center rounded-xl border p-4 transition-all',
                    isSelected
                      ? 'border-primary bg-primary/5 ring-2 ring-primary/30'
                      : 'border-border bg-card hover:border-primary/40 hover:bg-muted/50'
                  )}
                >
                  <Icons.clock
                    className={cn(
                      'size-5 mb-1.5',
                      isSelected ? 'text-primary' : 'text-muted-foreground'
                    )}
                  />
                  <span
                    className={cn(
                      'text-sm font-semibold tabular-nums',
                      isSelected ? 'text-primary' : 'text-foreground'
                    )}
                  >
                    {formatTime(slot.starts_at)}
                  </span>
                  <span className='text-xs text-muted-foreground mt-0.5'>
                    até {formatTime(slot.ends_at)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation panel */}
      <div
        className={cn(
          'rounded-2xl border bg-card p-5 transition-all duration-300',
          selectedSlot ? 'opacity-100' : 'opacity-40 pointer-events-none'
        )}
      >
        <p className='text-sm font-semibold mb-3'>Confirmar agendamento</p>
        {selectedSlot ? (
          <div className='space-y-2 mb-4'>
            <div className='flex items-center gap-2 text-sm'>
              <Icons.calendar className='size-4 text-muted-foreground shrink-0' />
              <span className='capitalize'>
                {effectiveDate ? formatDateLong(effectiveDate) : ''}
              </span>
            </div>
            <div className='flex items-center gap-2 text-sm'>
              <Icons.clock className='size-4 text-muted-foreground shrink-0' />
              <span>
                {formatTime(selectedSlot.starts_at)} – {formatTime(selectedSlot.ends_at)}
              </span>
              <span className='text-xs text-muted-foreground'>(BRT)</span>
            </div>
          </div>
        ) : (
          <p className='text-sm text-muted-foreground mb-4'>
            Selecione um horário acima para confirmar.
          </p>
        )}
        <Button
          className='w-full'
          disabled={!selectedSlot || bookMutation.isPending}
          onClick={handleConfirm}
        >
          {bookMutation.isPending ? (
            <>
              <Icons.spinner className='mr-2 size-4 animate-spin' />
              Confirmando…
            </>
          ) : (
            <>
              <Icons.check className='mr-2 size-4' />
              Confirmar horário
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
