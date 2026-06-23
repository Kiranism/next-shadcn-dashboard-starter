'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet';
import { Icons } from '@/components/icons';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { SelectionProcessRepository } from '@/repositories/selection-process.repository';
import { toUserMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import type { MyInterviewSlot, Candidate } from '@/types/selection-process';
import { TeamAvailabilityHeatmap } from './team-availability-heatmap';
import { SendMeetLinkDialog } from './send-meet-link-dialog';
import { EvaluationSheet } from './evaluation-sheet';

// ─── Constants ────────────────────────────────────────────────────────────────

const TZ = 'America/Sao_Paulo';
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

const WEEKDAYS_SHORT = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS_PT = [
  'Janeiro',
  'Fevereiro',
  'Março',
  'Abril',
  'Maio',
  'Junho',
  'Julho',
  'Agosto',
  'Setembro',
  'Outubro',
  'Novembro',
  'Dezembro'
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    timeZone: TZ
  });
}

function formatDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString('pt-BR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    timeZone: TZ
  });
}

function getDateKey(iso: string): string {
  return new Date(iso).toLocaleDateString('en-CA', { timeZone: TZ });
}

function hourToISO(dateStr: string, hour: number): string {
  return new Date(`${dateStr}T${String(hour).padStart(2, '0')}:00:00-03:00`).toISOString();
}

function getTodayLocal(): string {
  return new Date().toLocaleDateString('en-CA', { timeZone: TZ });
}

// ─── Slots Calendar ───────────────────────────────────────────────────────────

function SlotsCalendar({
  slotsByDate,
  selectedDateKey,
  onSelectDate
}: {
  slotsByDate: Map<string, MyInterviewSlot[]>;
  selectedDateKey: string | null;
  onSelectDate: (key: string) => void;
}) {
  const todayKey = getTodayLocal();
  const [viewDate, setViewDate] = useState(() => {
    const today = new Date();
    return { year: today.getFullYear(), month: today.getMonth() };
  });

  const daysGrid = useMemo(() => {
    const { year, month } = viewDate;
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startPad = firstDayOfMonth.getDay();
    const days: Array<{
      key: string;
      dayNum: number;
      isCurrentMonth: boolean;
    }> = [];

    for (let i = startPad - 1; i >= 0; i--) {
      const d = new Date(year, month, -i);
      days.push({
        key: d.toLocaleDateString('en-CA'),
        dayNum: d.getDate(),
        isCurrentMonth: false
      });
    }
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const date = new Date(year, month, d);
      days.push({
        key: date.toLocaleDateString('en-CA'),
        dayNum: d,
        isCurrentMonth: true
      });
    }
    const remaining = (7 - (days.length % 7)) % 7;
    for (let d = 1; d <= remaining; d++) {
      const date = new Date(year, month + 1, d);
      days.push({
        key: date.toLocaleDateString('en-CA'),
        dayNum: d,
        isCurrentMonth: false
      });
    }

    return days;
  }, [viewDate]);

  function prevMonth() {
    setViewDate(({ year, month }) =>
      month === 0 ? { year: year - 1, month: 11 } : { year, month: month - 1 }
    );
  }

  function nextMonth() {
    setViewDate(({ year, month }) =>
      month === 11 ? { year: year + 1, month: 0 } : { year, month: month + 1 }
    );
  }

  return (
    <div className='rounded-xl border bg-card p-4'>
      {/* Month navigation */}
      <div className='flex items-center justify-between mb-3'>
        <Button variant='ghost' size='icon' className='size-7' onClick={prevMonth}>
          <Icons.chevronLeft className='size-4' />
        </Button>
        <span className='text-sm font-semibold'>
          {MONTHS_PT[viewDate.month]} {viewDate.year}
        </span>
        <Button variant='ghost' size='icon' className='size-7' onClick={nextMonth}>
          <Icons.chevronRight className='size-4' />
        </Button>
      </div>

      {/* Weekday headers */}
      <div className='grid grid-cols-7 mb-1'>
        {WEEKDAYS_SHORT.map((wd) => (
          <div
            key={wd}
            className='text-center text-[0.7rem] text-muted-foreground py-1 font-medium'
          >
            {wd}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className='grid grid-cols-7 gap-y-0.5'>
        {daysGrid.map(({ key, dayNum, isCurrentMonth }) => {
          const daySlots = slotsByDate.get(key) ?? [];
          const hasFree = daySlots.some((s) => s.booking_id === null);
          const hasBooked = daySlots.some((s) => s.booking_id !== null);
          const isToday = key === todayKey;
          const isSelected = key === selectedDateKey;

          return (
            <button
              key={key}
              onClick={() => onSelectDate(key)}
              className={cn(
                'relative flex flex-col items-center justify-center rounded-lg py-1.5 text-sm transition-colors min-h-9',
                !isCurrentMonth && 'opacity-25',
                isSelected
                  ? 'bg-primary text-primary-foreground'
                  : isToday
                    ? 'bg-accent text-accent-foreground hover:bg-accent/80'
                    : 'hover:bg-muted'
              )}
            >
              <span className='text-xs font-medium leading-none'>{dayNum}</span>
              <div className='flex gap-0.5 mt-1 h-1'>
                {hasFree && (
                  <span
                    className={cn(
                      'size-1 rounded-full',
                      isSelected ? 'bg-primary-foreground/80' : 'bg-primary'
                    )}
                  />
                )}
                {hasBooked && (
                  <span
                    className={cn(
                      'size-1 rounded-full',
                      isSelected ? 'bg-primary-foreground/60' : 'bg-emerald-500'
                    )}
                  />
                )}
              </div>
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div className='flex items-center gap-4 mt-3 pt-3 border-t'>
        <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
          <span className='size-2 rounded-full bg-primary' />
          Livre
        </div>
        <div className='flex items-center gap-1.5 text-xs text-muted-foreground'>
          <span className='size-2 rounded-full bg-emerald-500' />
          Agendado
        </div>
      </div>
    </div>
  );
}

// ─── Add Slots Sheet ──────────────────────────────────────────────────────────

function AddSlotsSheet({
  open,
  onOpenChange
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [selectedDate, setSelectedDate] = useState(getTodayLocal());
  const [selectedHours, setSelectedHours] = useState<Set<number>>(new Set());
  const addMutation = SelectionProcessRepository.useAddInterviewSlots();

  function toggleHour(h: number) {
    setSelectedHours((prev) => {
      const next = new Set(prev);
      if (next.has(h)) next.delete(h);
      else next.add(h);
      return next;
    });
  }

  function handleSubmit() {
    if (selectedHours.size === 0) return;
    const slots = [...selectedHours].map((h) => hourToISO(selectedDate, h));
    addMutation.mutate(
      { slots },
      {
        onSuccess: (created) => {
          toast.success(
            `${created.length} horário${created.length !== 1 ? 's' : ''} adicionado${created.length !== 1 ? 's' : ''}!`
          );
          setSelectedHours(new Set());
          onOpenChange(false);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-md'>
        <SheetHeader className='pb-4'>
          <SheetTitle>Adicionar disponibilidade</SheetTitle>
          <SheetDescription>
            Selecione a data e os horários em que você estará disponível para conduzir entrevistas.
          </SheetDescription>
        </SheetHeader>

        {/* Date picker */}
        <div className='mb-6'>
          <label className='text-sm font-medium mb-2 block'>Data</label>
          <input
            type='date'
            value={selectedDate}
            min={getTodayLocal()}
            onChange={(e) => {
              setSelectedDate(e.target.value);
              setSelectedHours(new Set());
            }}
            className='w-full rounded-lg border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring'
          />
        </div>

        {/* Hour grid */}
        <div className='mb-6'>
          <label className='text-sm font-medium mb-3 block'>
            Horários (BRT){' '}
            {selectedHours.size > 0 && (
              <span className='text-muted-foreground font-normal ml-1'>
                — {selectedHours.size} selecionado
                {selectedHours.size !== 1 ? 's' : ''}
              </span>
            )}
          </label>
          <div className='grid grid-cols-4 gap-2'>
            {HOURS.map((h) => {
              const selected = selectedHours.has(h);
              return (
                <button
                  key={h}
                  onClick={() => toggleHour(h)}
                  className={cn(
                    'rounded-lg border py-2.5 text-sm font-medium transition-all',
                    selected
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-border bg-card text-foreground hover:border-primary/40 hover:bg-muted/50'
                  )}
                >
                  {String(h).padStart(2, '0')}:00
                </button>
              );
            })}
          </div>
        </div>

        <Button
          className='w-full'
          disabled={selectedHours.size === 0 || addMutation.isPending}
          onClick={handleSubmit}
        >
          {addMutation.isPending ? (
            <>
              <Icons.spinner className='mr-2 size-4 animate-spin' />
              Adicionando…
            </>
          ) : (
            <>
              <Icons.add className='mr-2 size-4' />
              Adicionar {selectedHours.size > 0 ? `${selectedHours.size} ` : ''}
              horário
              {selectedHours.size !== 1 ? 's' : ''}
            </>
          )}
        </Button>
      </SheetContent>
    </Sheet>
  );
}

// ─── Slot item ────────────────────────────────────────────────────────────────

function SlotItem({
  slot,
  onSendMeetLink,
  onEvaluate
}: {
  slot: MyInterviewSlot;
  onSendMeetLink?: (slot: MyInterviewSlot) => void;
  onEvaluate?: (slot: MyInterviewSlot) => void;
}) {
  const isBooked = slot.booking_id !== null;
  const isPast = new Date(slot.starts_at) < new Date();
  const canSendMeet = isBooked && !slot.meet_link && !isPast;
  const canEvaluate = isBooked && isPast && !slot.has_evaluation;

  return (
    <div className='rounded-xl border bg-card overflow-hidden'>
      <div className='flex items-center gap-3 px-4 py-3'>
        <div
          className={cn(
            'flex size-9 shrink-0 items-center justify-center rounded-full',
            isBooked ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-muted'
          )}
        >
          <Icons.clock
            className={cn(
              'size-4',
              isBooked ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground'
            )}
          />
        </div>
        <div className='min-w-0 flex-1'>
          <p className='text-sm font-medium tabular-nums'>
            {formatTime(slot.starts_at)} – {formatTime(slot.ends_at)}
          </p>
          {slot.consultant_name && (
            <p className='text-xs text-muted-foreground mt-0.5'>{slot.consultant_name}</p>
          )}
        </div>
        <div className='shrink-0 text-right'>
          {isBooked ? (
            <>
              <Badge
                variant='outline'
                className='border-emerald-300 text-emerald-700 dark:border-emerald-700 dark:text-emerald-400 text-xs'
              >
                {slot.has_evaluation ? 'Avaliado' : 'Agendado'}
              </Badge>
              {slot.candidate_name && (
                <p className='text-xs text-muted-foreground mt-1 max-w-28 truncate'>
                  {slot.candidate_name}
                </p>
              )}
              {slot.meet_link && (
                <div className='flex items-center justify-end gap-1 mt-1'>
                  <Icons.video className='size-3 text-primary' />
                  <span className='text-[0.6rem] text-primary'>Meet</span>
                </div>
              )}
            </>
          ) : (
            <Badge variant='outline' className='shrink-0 text-xs text-muted-foreground'>
              Livre
            </Badge>
          )}
        </div>
      </div>

      {/* Action bar */}
      {(canSendMeet || canEvaluate) && (
        <div className='flex gap-2 px-4 pb-3'>
          {canSendMeet && (
            <Button
              size='sm'
              variant='outline'
              className='h-7 text-xs gap-1.5'
              onClick={() => onSendMeetLink?.(slot)}
            >
              <Icons.video className='size-3' />
              Enviar Meet
            </Button>
          )}
          {canEvaluate && (
            <Button
              size='sm'
              variant='outline'
              className='h-7 text-xs gap-1.5'
              onClick={() => onEvaluate?.(slot)}
            >
              <Icons.forms className='size-3' />
              Avaliar
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Send Links Dialog ────────────────────────────────────────────────────────

function SendLinksDialog({
  open,
  onOpenChange,
  candidates
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  candidates: Candidate[];
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const sendMutation = SelectionProcessRepository.useSendInterviewLinks();

  function toggle(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSend() {
    if (selected.size === 0) return;
    sendMutation.mutate(
      { candidate_ids: [...selected] },
      {
        onSuccess: (results) => {
          const ok = results.filter((r) => r.success).length;
          toast.success(`Links enviados para ${ok} candidato${ok !== 1 ? 's' : ''}!`);
          setSelected(new Set());
          onOpenChange(false);
        },
        onError: (err) => toast.error(toUserMessage(err))
      }
    );
  }

  const activeCandidates = candidates.filter((c) => c.status === 'active');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Enviar links de agendamento</DialogTitle>
          <DialogDescription>
            Selecione os candidatos que devem receber o link para agendar a entrevista.
          </DialogDescription>
        </DialogHeader>

        {activeCandidates.length === 0 ? (
          <p className='text-sm text-muted-foreground py-4 text-center'>
            Nenhum candidato ativo encontrado.
          </p>
        ) : (
          <div className='max-h-72 overflow-y-auto space-y-1 -mx-1 px-1'>
            {activeCandidates.map((c) => {
              const isSelected = selected.has(c.id);
              return (
                <button
                  key={c.id}
                  onClick={() => toggle(c.id)}
                  className={cn(
                    'w-full flex items-center gap-3 rounded-lg border px-3 py-2.5 text-left transition-all',
                    isSelected
                      ? 'border-primary bg-primary/5'
                      : 'border-transparent hover:border-border hover:bg-muted/50'
                  )}
                >
                  <div
                    className={cn(
                      'flex size-5 shrink-0 items-center justify-center rounded-md border-2 transition-colors',
                      isSelected ? 'border-primary bg-primary' : 'border-muted-foreground/40'
                    )}
                  >
                    {isSelected && <Icons.check className='size-3 text-primary-foreground' />}
                  </div>
                  <div className='min-w-0'>
                    <p className='text-sm font-medium truncate'>{c.name}</p>
                    <p className='text-xs text-muted-foreground truncate'>{c.email}</p>
                  </div>
                </button>
              );
            })}
          </div>
        )}

        <DialogFooter className='gap-2'>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button disabled={selected.size === 0 || sendMutation.isPending} onClick={handleSend}>
            {sendMutation.isPending ? (
              <>
                <Icons.spinner className='mr-2 size-4 animate-spin' />
                Enviando…
              </>
            ) : (
              <>
                <Icons.send className='mr-2 size-4' />
                Enviar para {selected.size > 0 ? `${selected.size} ` : ''}
                candidato
                {selected.size !== 1 ? 's' : ''}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main tab ──────────────────────────────────────────────────────────────────

type ViewMode = 'personal' | 'team';

export function InterviewsTab() {
  const { rank, profile } = useUserProfile();
  const isAdmin = rank >= 3;

  const [addSheetOpen, setAddSheetOpen] = useState(false);
  const [sendLinksOpen, setSendLinksOpen] = useState(false);
  const [selectedDateKey, setSelectedDateKey] = useState<string | null>(getTodayLocal());
  const [viewMode, setViewMode] = useState<ViewMode>('personal');
  const [meetLinkSlot, setMeetLinkSlot] = useState<MyInterviewSlot | null>(null);
  const [evaluateSlot, setEvaluateSlot] = useState<MyInterviewSlot | null>(null);

  const { data: slots, isLoading } = SelectionProcessRepository.useMyInterviewSlots();
  const { data: candidates } = SelectionProcessRepository.useCandidates();

  // Admins receive all slots from the API — filter to own slots for personal view
  const mySlots = useMemo(
    () =>
      isAdmin && profile?.id
        ? (slots ?? []).filter((s) => s.consultant_id === profile.id)
        : (slots ?? []),
    [slots, isAdmin, profile?.id]
  );

  const slotsByDate = useMemo(() => {
    const map = new Map<string, MyInterviewSlot[]>();
    for (const slot of mySlots) {
      const key = getDateKey(slot.starts_at);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(slot);
    }
    return map;
  }, [mySlots]);

  const myUpcoming = useMemo(
    () => mySlots.filter((s) => new Date(s.starts_at) >= new Date()),
    [mySlots]
  );

  const bookedCount = myUpcoming.filter((s) => s.booking_id !== null).length;
  const freeCount = myUpcoming.filter((s) => s.booking_id === null).length;

  const selectedDaySlots = useMemo(
    () => (selectedDateKey ? (slotsByDate.get(selectedDateKey) ?? []) : []),
    [slotsByDate, selectedDateKey]
  );

  if (isLoading) {
    return (
      <div className='space-y-4'>
        <div className='flex gap-2'>
          <Skeleton className='h-9 w-44 rounded-lg' />
        </div>
        <Skeleton className='h-72 w-full rounded-xl' />
        <div className='space-y-2'>
          {[1, 2].map((i) => (
            <Skeleton key={i} className='h-16 w-full rounded-xl' />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex flex-wrap items-center justify-between gap-3'>
        <div className='flex items-center gap-3'>
          <h3 className='font-semibold'>Entrevistas</h3>
          {isAdmin && (
            <div className='flex rounded-lg border p-0.5 bg-muted/40'>
              <button
                onClick={() => setViewMode('personal')}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-all',
                  viewMode === 'personal'
                    ? 'bg-background shadow text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Minha disponibilidade
              </button>
              <button
                onClick={() => setViewMode('team')}
                className={cn(
                  'rounded-md px-3 py-1 text-xs font-medium transition-all',
                  viewMode === 'team'
                    ? 'bg-background shadow text-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                Equipe
              </button>
            </div>
          )}
        </div>
        <div className='flex gap-2'>
          {isAdmin && viewMode === 'personal' && (
            <Button variant='outline' size='sm' onClick={() => setSendLinksOpen(true)}>
              <Icons.send className='mr-2 size-4' />
              Enviar links
            </Button>
          )}
          {viewMode === 'personal' && (
            <Button size='sm' onClick={() => setAddSheetOpen(true)}>
              <Icons.add className='mr-2 size-4' />
              Adicionar horários
            </Button>
          )}
        </div>
      </div>

      {/* Team heatmap view */}
      {isAdmin && viewMode === 'team' ? (
        <TeamAvailabilityHeatmap />
      ) : mySlots.length === 0 ? (
        <div className='flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-14 text-center'>
          <div className='flex size-12 items-center justify-center rounded-full bg-muted'>
            <Icons.calendar className='size-5 text-muted-foreground' />
          </div>
          <div>
            <p className='font-medium'>Nenhum horário cadastrado</p>
            <p className='text-muted-foreground mt-0.5 text-sm'>
              Adicione horários em que você estará disponível para entrevistas
            </p>
          </div>
          <Button size='sm' variant='outline' onClick={() => setAddSheetOpen(true)}>
            <Icons.add className='mr-1.5 size-3.5' />
            Adicionar primeiro horário
          </Button>
        </div>
      ) : (
        <div className='space-y-4'>
          {/* Calendar */}
          <SlotsCalendar
            slotsByDate={slotsByDate}
            selectedDateKey={selectedDateKey}
            onSelectDate={setSelectedDateKey}
          />

          {/* Selected day slots */}
          <div>
            <p className='text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 capitalize'>
              {selectedDateKey ? (
                <>
                  {formatDateFull(`${selectedDateKey}T12:00:00`)}
                  {selectedDaySlots.length > 0 && (
                    <span className='ml-1 font-normal normal-case'>
                      · {selectedDaySlots.length} horário
                      {selectedDaySlots.length !== 1 ? 's' : ''}
                    </span>
                  )}
                </>
              ) : (
                'Selecione um dia'
              )}
            </p>

            {!selectedDateKey ? (
              <p className='text-sm text-muted-foreground text-center py-4'>
                Clique em um dia no calendário para ver os horários.
              </p>
            ) : selectedDaySlots.length === 0 ? (
              <div className='rounded-xl border border-dashed py-8 text-center'>
                <p className='text-sm text-muted-foreground'>Nenhum horário neste dia.</p>
              </div>
            ) : (
              <div className='space-y-2'>
                {selectedDaySlots.map((slot) => (
                  <SlotItem
                    key={slot.id}
                    slot={slot}
                    onSendMeetLink={setMeetLinkSlot}
                    onEvaluate={setEvaluateSlot}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Admin info banner */}
      {isAdmin && viewMode === 'personal' && (
        <div className='rounded-xl border bg-muted/40 p-4'>
          <div className='flex items-start gap-3'>
            <Icons.info className='size-4 text-muted-foreground shrink-0 mt-0.5' />
            <div className='text-sm text-muted-foreground space-y-1'>
              <p>
                Use <strong className='text-foreground'>Enviar links</strong> para enviar o link de
                agendamento por e-mail aos candidatos aprovados e ativos. Cada link é único e expira
                ao fim do processo.
              </p>
              <p>
                Candidatos acessam a página de agendamento em{' '}
                <code className='text-xs bg-background rounded px-1 py-0.5 border'>
                  /psel/entrevistas/[token]
                </code>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Dialogs / sheets */}
      <AddSlotsSheet open={addSheetOpen} onOpenChange={setAddSheetOpen} />
      {isAdmin && (
        <SendLinksDialog
          open={sendLinksOpen}
          onOpenChange={setSendLinksOpen}
          candidates={candidates ?? []}
        />
      )}
      <SendMeetLinkDialog
        slot={meetLinkSlot}
        onOpenChange={(open) => {
          if (!open) setMeetLinkSlot(null);
        }}
      />
      <EvaluationSheet
        slot={evaluateSlot}
        onOpenChange={(open) => {
          if (!open) setEvaluateSlot(null);
        }}
      />
    </div>
  );
}
