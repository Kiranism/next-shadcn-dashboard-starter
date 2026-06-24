'use client';

import { useState, useMemo } from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from '@/components/ui/dialog';
import { Icons } from '@/components/icons';
import { SelectionProcessRepository } from '@/repositories/selection-process.repository';
import { cn } from '@/lib/utils';

// ─── Constants ────────────────────────────────────────────────────────────────

const TZ = 'America/Sao_Paulo';
const HOURS = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19];

const WEEKDAYS_ORDER = [1, 2, 3, 4, 5, 6, 0]; // Mon → Sun
const WEEKDAY_LABELS: Record<number, string> = {
  0: 'Domingo',
  1: 'Segunda',
  2: 'Terça',
  3: 'Quarta',
  4: 'Quinta',
  5: 'Sexta',
  6: 'Sábado'
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getSlotDayHour(iso: string): { dow: number; hour: number } {
  const local = new Date(iso).toLocaleString('sv-SE', { timeZone: TZ }); // "YYYY-MM-DD HH:MM:SS"
  const [datePart, timePart] = local.split(' ');
  const hour = parseInt(timePart.substring(0, 2));
  const dow = new Date(`${datePart}T12:00:00`).getDay();
  return { dow, hour };
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface CellData {
  free: Map<string, string>; // consultantId → name (only-free consultants)
  booked: Map<string, { name: string; candidateName?: string }>; // consultantId → info
}

interface SelectedCell {
  dow: number;
  hour: number;
  freeConsultants: string[];
  bookedConsultants: Array<{ name: string; candidateName?: string }>;
}

// ─── Component ─────────────────────────────────────────────────────────────────

export function TeamAvailabilityHeatmap() {
  const { data: slots, isLoading } = SelectionProcessRepository.useMyInterviewSlots();
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  const futureSlots = useMemo(() => {
    const now = new Date();
    return (slots ?? []).filter((s) => new Date(s.starts_at) >= now);
  }, [slots]);

  // Build grid: per cell (dow-hour), track free vs. booked consultants separately.
  // If a consultant has any booked slot in a cell, they count as "booked" for that cell.
  const grid = useMemo(() => {
    // First pass: collect per-consultant state per cell
    const consultantState = new Map<
      string, // "DOW-HOUR"
      Map<string, { hasBooked: boolean; name: string; candidateName?: string }> // consultantId → state
    >();

    for (const slot of futureSlots) {
      const { dow, hour } = getSlotDayHour(slot.starts_at);
      const cellKey = `${dow}-${hour}`;
      if (!consultantState.has(cellKey)) consultantState.set(cellKey, new Map());
      const cell = consultantState.get(cellKey)!;

      const isBooked = slot.booking_id !== null;
      const existing = cell.get(slot.consultant_id);

      if (!existing) {
        cell.set(slot.consultant_id, {
          hasBooked: isBooked,
          name: slot.consultant_name ?? slot.consultant_id,
          candidateName: isBooked ? (slot.candidate_name ?? undefined) : undefined
        });
      } else if (isBooked && !existing.hasBooked) {
        // Upgrade to booked if a newer booked slot is found in the same cell
        cell.set(slot.consultant_id, {
          hasBooked: true,
          name: existing.name,
          candidateName: slot.candidate_name ?? existing.candidateName
        });
      }
    }

    // Second pass: build CellData (free vs. booked groups)
    const map = new Map<string, CellData>();
    for (const [cellKey, consultants] of consultantState) {
      const cellData: CellData = { free: new Map(), booked: new Map() };
      for (const [consultantId, info] of consultants) {
        if (info.hasBooked) {
          cellData.booked.set(consultantId, { name: info.name, candidateName: info.candidateName });
        } else {
          cellData.free.set(consultantId, info.name);
        }
      }
      map.set(cellKey, cellData);
    }

    return map;
  }, [futureSlots]);

  const totalConsultants = useMemo(() => {
    return new Set(futureSlots.map((s) => s.consultant_id)).size;
  }, [futureSlots]);

  if (isLoading) {
    return (
      <div className='space-y-3'>
        <Skeleton className='h-5 w-56 rounded' />
        <Skeleton className='h-64 w-full rounded-xl' />
      </div>
    );
  }

  if (futureSlots.length === 0) {
    return (
      <div className='flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed py-12 text-center'>
        <div className='flex size-12 items-center justify-center rounded-full bg-muted'>
          <Icons.usersGroup className='size-5 text-muted-foreground' />
        </div>
        <div>
          <p className='font-medium'>Sem disponibilidade cadastrada</p>
          <p className='text-sm text-muted-foreground mt-0.5'>
            Nenhum consultor cadastrou horários futuros ainda.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className='space-y-4'>
      {/* Info row */}
      <div className='flex items-center justify-between gap-3'>
        <p className='text-sm text-muted-foreground'>
          <span className='text-foreground font-medium'>{totalConsultants}</span> consultor
          {totalConsultants !== 1 ? 'es' : ''} com horários futuros
        </p>
        <p className='text-xs text-muted-foreground hidden sm:block'>
          Clique em uma célula para ver os consultores
        </p>
      </div>

      {/* Grid — overflow-x-auto ensures horizontal scroll on mobile without clipping parent */}
      <div className='overflow-x-auto rounded-xl border bg-card p-4'>
        <div className='min-w-[580px]'>
          {/* Hour headers */}
          <div className='flex mb-2 ml-[6.5rem]'>
            {HOURS.map((h) => (
              <div
                key={h}
                className='flex-1 text-center text-[0.65rem] font-medium text-muted-foreground'
              >
                {String(h).padStart(2, '0')}-{String(h + 1).padStart(2, '0')}
              </div>
            ))}
          </div>

          {/* Rows */}
          <div className='space-y-1.5'>
            {WEEKDAYS_ORDER.map((dow) => (
              <div key={dow} className='flex items-center gap-1'>
                <div className='w-24 shrink-0 text-right pr-3 text-sm font-semibold'>
                  {WEEKDAY_LABELS[dow]}
                </div>
                {HOURS.map((h) => {
                  const key = `${dow}-${h}`;
                  const cell = grid.get(key);
                  const freeCount = cell?.free.size ?? 0;
                  const bookedCount = cell?.booked.size ?? 0;
                  const total = freeCount + bookedCount;
                  const hasSlots = total > 0;

                  // Visual state: empty=muted, only-free=primary, mixed=amber, only-booked=emerald
                  const cellClass = cn(
                    'flex-1 h-9 rounded-lg text-[0.6rem] font-bold tabular-nums transition-opacity leading-tight',
                    !hasSlots
                      ? 'bg-muted cursor-default'
                      : freeCount > 0 && bookedCount === 0
                        ? 'bg-primary/80 text-primary-foreground hover:opacity-80 cursor-pointer'
                        : freeCount > 0 && bookedCount > 0
                          ? 'bg-amber-500 text-white hover:opacity-80 cursor-pointer'
                          : 'bg-emerald-600 text-white hover:opacity-80 cursor-pointer'
                  );

                  // Show "free+booked" when mixed, otherwise just total
                  const displayText = !hasSlots
                    ? ''
                    : freeCount > 0 && bookedCount > 0
                      ? `${freeCount}+${bookedCount}`
                      : String(total);

                  return (
                    <button
                      key={h}
                      disabled={!hasSlots}
                      onClick={() => {
                        if (!cell) return;
                        const freeConsultants = [...cell.free.values()].sort((a, b) =>
                          a.localeCompare(b, 'pt-BR')
                        );
                        const bookedConsultants = [...cell.booked.values()].sort((a, b) =>
                          a.name.localeCompare(b.name, 'pt-BR')
                        );
                        setSelectedCell({ dow, hour: h, freeConsultants, bookedConsultants });
                      }}
                      className={cellClass}
                    >
                      {displayText}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className='flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground'>
        <div className='flex items-center gap-1.5'>
          <span className='size-3 rounded bg-primary/80 shrink-0' />
          Disponível
        </div>
        <div className='flex items-center gap-1.5'>
          <span className='size-3 rounded bg-amber-500 shrink-0' />
          Parcialmente ocupado
        </div>
        <div className='flex items-center gap-1.5'>
          <span className='size-3 rounded bg-emerald-600 shrink-0' />
          Totalmente reservado
        </div>
        <span className='text-muted-foreground/50 hidden sm:block'>· livre+reservado</span>
      </div>

      {/* Detail dialog */}
      <Dialog open={!!selectedCell} onOpenChange={() => setSelectedCell(null)}>
        <DialogContent className='sm:max-w-sm'>
          <DialogHeader>
            <DialogTitle>
              {selectedCell && WEEKDAY_LABELS[selectedCell.dow]},{' '}
              {selectedCell && String(selectedCell.hour).padStart(2, '0')}h –{' '}
              {selectedCell && String(selectedCell.hour + 1).padStart(2, '0')}h
            </DialogTitle>
            <DialogDescription>
              {selectedCell
                ? `${selectedCell.freeConsultants.length + selectedCell.bookedConsultants.length} consultor${selectedCell.freeConsultants.length + selectedCell.bookedConsultants.length !== 1 ? 'es' : ''} com disponibilidade`
                : ''}
            </DialogDescription>
          </DialogHeader>

          <div className='space-y-4 max-h-72 overflow-y-auto'>
            {/* Booked consultants group */}
            {selectedCell && selectedCell.bookedConsultants.length > 0 && (
              <div>
                <p className='text-xs font-semibold text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5'>
                  <span className='size-2 rounded-full bg-emerald-600 dark:bg-emerald-400 shrink-0' />
                  Com entrevista marcada ({selectedCell.bookedConsultants.length})
                </p>
                <div className='space-y-1'>
                  {selectedCell.bookedConsultants.map(({ name, candidateName }) => (
                    <div
                      key={name}
                      className='flex items-start gap-2.5 rounded-lg px-3 py-2 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/40'
                    >
                      <Icons.user className='size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5' />
                      <div className='min-w-0'>
                        <span className='text-sm block'>{name}</span>
                        {candidateName && (
                          <span className='text-xs text-muted-foreground truncate block'>
                            Candidato: {candidateName}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Free consultants group */}
            {selectedCell && selectedCell.freeConsultants.length > 0 && (
              <div>
                <p className='text-xs font-semibold text-primary mb-2 flex items-center gap-1.5'>
                  <span className='size-2 rounded-full bg-primary shrink-0' />
                  Disponíveis ({selectedCell.freeConsultants.length})
                </p>
                <div className='space-y-1'>
                  {selectedCell.freeConsultants.map((name) => (
                    <div
                      key={name}
                      className='flex items-center gap-2.5 rounded-lg px-3 py-2 bg-muted/50'
                    >
                      <Icons.user className='size-3.5 text-muted-foreground shrink-0' />
                      <span className='text-sm'>{name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
