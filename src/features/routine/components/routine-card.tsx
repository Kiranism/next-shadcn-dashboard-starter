'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Icons } from '@/components/icons';
import {
  RoutineRepository,
  type RoutineDay,
  type RoutineSlots
} from '@/repositories/routine.repository';
import { SettingsRepository } from '@/repositories/settings.repository';
import { toUserMessage } from '@/lib/api-client';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS: RoutineDay[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

const DAY_LABELS: Record<RoutineDay, string> = {
  mon: 'Segunda',
  tue: 'Terça',
  wed: 'Quarta',
  thu: 'Quinta',
  fri: 'Sexta',
  sat: 'Sábado',
  sun: 'Domingo'
};

const SLOT_COUNT = 14;
const SLOT_START_HOUR = 8;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function emptySlots(): RoutineSlots {
  return Object.fromEntries(
    DAYS.map((d) => [d, Array<boolean>(SLOT_COUNT).fill(false)])
  ) as RoutineSlots;
}

function slotsFromApi(apiSlots: RoutineSlots | null): RoutineSlots {
  if (!apiSlots) return emptySlots();
  return Object.fromEntries(
    DAYS.map((d) => [d, apiSlots[d] ?? Array<boolean>(SLOT_COUNT).fill(false)])
  ) as RoutineSlots;
}

function slotColumnLabel(index: number): string {
  const s = SLOT_START_HOUR + index;
  const e = s + 1;
  return `${String(s).padStart(2, '0')}-${String(e).padStart(2, '0')}`;
}

function dayHours(daySlots: boolean[]): number {
  return daySlots.filter(Boolean).length;
}

function totalHours(slots: RoutineSlots): number {
  return DAYS.reduce((sum, d) => sum + dayHours(slots[d]), 0);
}

// ─── Slot Cell (shared) ───────────────────────────────────────────────────────

interface SlotCellProps {
  active: boolean;
  label: string;
  onMouseDown?: () => void;
  onMouseEnter?: () => void;
  onClick?: () => void;
  className?: string;
}

function SlotCell({ active, label, onMouseDown, onMouseEnter, onClick, className }: SlotCellProps) {
  return (
    <button
      type='button'
      aria-label={`${label} — ${active ? 'disponível' : 'indisponível'}`}
      aria-pressed={active}
      onMouseDown={onMouseDown}
      onMouseEnter={onMouseEnter}
      onClick={onClick}
      className={cn(
        'cursor-pointer select-none rounded-lg border shadow-sm transition-all duration-150 active:scale-95',
        active
          ? 'border-emerald-600/50 bg-emerald-800 hover:bg-emerald-700 hover:border-emerald-500/60'
          : 'border-red-900/40 bg-red-950/70 hover:bg-red-900/70 hover:border-red-800/50',
        className
      )}
    />
  );
}

// ─── Desktop Grid ─────────────────────────────────────────────────────────────

interface RoutineGridProps {
  slots: RoutineSlots;
  onCellMouseDown: (day: RoutineDay, idx: number) => void;
  onCellMouseEnter: (day: RoutineDay, idx: number) => void;
}

function RoutineGrid({ slots, onCellMouseDown, onCellMouseEnter }: RoutineGridProps) {
  return (
    <div className='hidden overflow-x-auto md:block'>
      <div style={{ minWidth: 720 }}>
        {/* Column headers */}
        <div className='mb-1.5 flex'>
          <div className='w-28 shrink-0' />
          {Array.from({ length: SLOT_COUNT }, (_, i) => (
            <div
              key={i}
              className='text-muted-foreground flex-1 text-center text-[11px] tabular-nums'
            >
              {slotColumnLabel(i)}
            </div>
          ))}
        </div>

        {/* Rows */}
        {DAYS.map((day) => {
          const hours = dayHours(slots[day]);
          return (
            <div key={day} className='mb-1.5 flex items-center'>
              <div className='flex w-28 shrink-0 items-baseline gap-1.5 pr-2'>
                <span className='text-sm font-semibold'>{DAY_LABELS[day]}</span>
                <span className='text-muted-foreground text-xs'>{hours}h</span>
              </div>
              <div className='flex flex-1 gap-1.5'>
                {slots[day].map((active, i) => (
                  <SlotCell
                    key={i}
                    active={active}
                    label={`${DAY_LABELS[day]} ${slotColumnLabel(i)}`}
                    onMouseDown={() => onCellMouseDown(day, i)}
                    onMouseEnter={() => onCellMouseEnter(day, i)}
                    className='h-9 flex-1'
                  />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Mini Strip (accordion header preview) ────────────────────────────────────

function MiniStrip({ daySlots }: { daySlots: boolean[] }) {
  return (
    <div className='flex min-w-0 flex-1 gap-0.5'>
      {daySlots.map((active, i) => (
        <div
          key={i}
          className={cn(
            'h-2.5 flex-1 rounded-md',
            active ? 'bg-emerald-700' : 'bg-red-950/80 border border-red-900/30'
          )}
        />
      ))}
    </div>
  );
}

// ─── Mobile Accordion ─────────────────────────────────────────────────────────

interface RoutineAccordionProps {
  slots: RoutineSlots;
  onToggleCell: (day: RoutineDay, idx: number) => void;
}

function RoutineAccordion({ slots, onToggleCell }: RoutineAccordionProps) {
  return (
    <div className='space-y-2 md:hidden'>
      {DAYS.map((day) => {
        const hours = dayHours(slots[day]);
        return (
          <Collapsible key={day}>
            <div className='overflow-hidden rounded-lg border'>
              <CollapsibleTrigger asChild>
                <button className='hover:bg-muted/50 flex w-full flex-col gap-2.5 px-4 py-3 text-left transition-colors'>
                  <div className='flex w-full items-center gap-2'>
                    <span className='text-sm font-semibold'>{DAY_LABELS[day]}</span>
                    <Badge
                      variant='outline'
                      className={cn(
                        'px-1.5 py-0 text-[11px]',
                        hours > 0
                          ? 'border-emerald-800 bg-emerald-900/40 text-emerald-400'
                          : 'text-muted-foreground'
                      )}
                    >
                      {hours}h disponível
                    </Badge>
                    <Icons.chevronDown className='text-muted-foreground ml-auto size-4 shrink-0 transition-transform duration-200 [[data-state=open]_&]:rotate-180' />
                  </div>
                  <MiniStrip daySlots={slots[day]} />
                </button>
              </CollapsibleTrigger>

              <CollapsibleContent>
                <div className='px-4 pb-4 pt-1'>
                  {/* 7-column grid → 2 rows of 7 slots each */}
                  <div className='grid grid-cols-7 gap-1.5'>
                    {slots[day].map((active, i) => (
                      <div key={i} className='flex flex-col items-center gap-0.5'>
                        <SlotCell
                          active={active}
                          label={`${DAY_LABELS[day]} ${slotColumnLabel(i)}`}
                          onClick={() => onToggleCell(day, i)}
                          className='h-8 w-full'
                        />
                        <span className='text-muted-foreground text-[10px] tabular-nums'>
                          {SLOT_START_HOUR + i}h
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
        );
      })}
    </div>
  );
}

// ─── Main RoutineCard ─────────────────────────────────────────────────────────

export function RoutineCard() {
  const { data, isLoading } = RoutineRepository.useGetRoutine();
  const { data: settings } = SettingsRepository.useSettings();
  const updateMutation = RoutineRepository.useUpdateRoutine();

  const [slots, setSlots] = useState<RoutineSlots>(emptySlots);

  // Tracks ongoing drag gesture: isDragging + the toggle mode for this drag
  const dragRef = useRef<{ isDragging: boolean; mode: boolean }>({
    isDragging: false,
    mode: true
  });

  // Initialise slots once API data arrives
  useEffect(() => {
    if (data) setSlots(slotsFromApi(data.slots));
  }, [data]);

  // End any drag when mouse is released outside the grid
  useEffect(() => {
    const end = () => {
      dragRef.current.isDragging = false;
    };
    document.addEventListener('mouseup', end);
    return () => document.removeEventListener('mouseup', end);
  }, []);

  // Desktop: begin drag on mousedown
  function handleCellMouseDown(day: RoutineDay, idx: number) {
    const newMode = !slots[day][idx];
    dragRef.current = { isDragging: true, mode: newMode };
    setSlots((prev) => {
      const updated = { ...prev, [day]: [...prev[day]] };
      updated[day][idx] = newMode;
      return updated;
    });
  }

  // Desktop: extend drag on mouse enter
  function handleCellMouseEnter(day: RoutineDay, idx: number) {
    if (!dragRef.current.isDragging) return;
    setSlots((prev) => {
      const updated = { ...prev, [day]: [...prev[day]] };
      updated[day][idx] = dragRef.current.mode;
      return updated;
    });
  }

  // Mobile: simple toggle on tap
  function handleToggleCell(day: RoutineDay, idx: number) {
    setSlots((prev) => {
      const updated = { ...prev, [day]: [...prev[day]] };
      updated[day][idx] = !prev[day][idx];
      return updated;
    });
  }

  function handleSave() {
    updateMutation.mutate(slots, {
      onSuccess: () => toast.success('Rotina salva com sucesso!'),
      onError: (err: Error) => toast.error(toUserMessage(err))
    });
  }

  // Progress bar calculations
  const total = totalHours(slots);
  const minHours = settings?.min_availability_hours ?? 0;
  const showProgress = minHours > 0;
  const progressPct = showProgress ? Math.min((total / minHours) * 100, 100) : 0;
  const metMinimum = total >= minHours;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className='text-base font-semibold'>Rotina Semanal</CardTitle>
          <CardDescription>Selecione seus horários de disponibilidade</CardDescription>
        </CardHeader>
        <CardContent className='space-y-3'>
          <Skeleton className='h-2 w-full' />
          <Skeleton className='h-48 w-full' />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className='pb-3'>
        {/* Title row */}
        <div className='flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between'>
          <div>
            <CardTitle className='text-base font-semibold'>Rotina Semanal</CardTitle>
            <CardDescription>Selecione seus horários de disponibilidade</CardDescription>
          </div>

          {showProgress && (
            <Badge
              variant='outline'
              className={cn(
                'self-start whitespace-nowrap text-xs font-medium tabular-nums',
                metMinimum
                  ? 'border-emerald-700 bg-emerald-900/30 text-emerald-400'
                  : 'border-red-700 bg-red-900/30 text-red-400'
              )}
            >
              {total}h / {minHours}h mínimo
            </Badge>
          )}
        </div>

        {/* Progress bar */}
        {showProgress && (
          <div className='space-y-1 pt-1'>
            <Progress
              value={progressPct}
              className={cn(
                'h-2',
                metMinimum
                  ? '[&_[data-slot=progress-indicator]]:bg-emerald-500'
                  : '[&_[data-slot=progress-indicator]]:bg-red-500'
              )}
            />
            <div className='text-muted-foreground flex justify-between text-xs'>
              <span>0h</span>
              <span>{minHours}h</span>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent className='space-y-4'>
        {/* Legend + desktop hint */}
        <div className='flex flex-wrap items-center justify-between gap-2'>
          <div className='flex items-center gap-4'>
            <div className='flex items-center gap-1.5'>
              <div className='size-3 rounded-sm bg-emerald-700' />
              <span className='text-muted-foreground text-xs'>Disponível</span>
            </div>
            <div className='flex items-center gap-1.5'>
              <div className='border-red-900/40 size-3 rounded-sm border bg-red-950/80' />
              <span className='text-muted-foreground text-xs'>Indisponível</span>
            </div>
          </div>
          <span className='text-muted-foreground hidden text-xs md:block'>
            Clique e arraste para selecionar
          </span>
        </div>

        {/* Desktop grid — hidden on mobile */}
        <RoutineGrid
          slots={slots}
          onCellMouseDown={handleCellMouseDown}
          onCellMouseEnter={handleCellMouseEnter}
        />

        {/* Mobile accordion — hidden on desktop */}
        <RoutineAccordion slots={slots} onToggleCell={handleToggleCell} />

        {/* Minimum-not-met banner */}
        {showProgress && !metMinimum && (
          <div className='rounded-lg border border-red-900/50 bg-red-950/40 px-4 py-3 text-center'>
            <p className='text-sm font-semibold text-red-400'>
              Selecione pelo menos {minHours} horas de disponibilidade
            </p>
            <p className='text-muted-foreground mt-0.5 text-xs tabular-nums'>
              Você selecionou {total}h de {minHours}h necessárias
            </p>
          </div>
        )}

        {/* Save */}
        <div className='flex justify-end pt-1'>
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending || (showProgress && !metMinimum)}
          >
            {updateMutation.isPending && <Icons.spinner className='mr-2 size-4 animate-spin' />}
            Salvar horário
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
