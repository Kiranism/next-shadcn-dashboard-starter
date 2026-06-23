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

// ─── Component ─────────────────────────────────────────────────────────────────

interface SelectedCell {
  dow: number;
  hour: number;
  consultants: string[];
}

export function TeamAvailabilityHeatmap() {
  const { data: slots, isLoading } = SelectionProcessRepository.useMyInterviewSlots();
  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  const futureSlots = useMemo(() => {
    const now = new Date();
    return (slots ?? []).filter((s) => new Date(s.starts_at) >= now);
  }, [slots]);

  // Map<"DOW-HOUR", {ids, names}>
  const grid = useMemo(() => {
    const map = new Map<string, { ids: Set<string>; names: Map<string, string> }>();
    for (const slot of futureSlots) {
      const { dow, hour } = getSlotDayHour(slot.starts_at);
      const key = `${dow}-${hour}`;
      if (!map.has(key)) map.set(key, { ids: new Set(), names: new Map() });
      const cell = map.get(key)!;
      cell.ids.add(slot.consultant_id);
      if (slot.consultant_name) cell.names.set(slot.consultant_id, slot.consultant_name);
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

      {/* Grid */}
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
                  const count = cell?.ids.size ?? 0;
                  const hasSlots = count > 0;

                  return (
                    <button
                      key={h}
                      disabled={!hasSlots}
                      onClick={() => {
                        const names = [...(cell?.names.values() ?? [])].sort((a, b) =>
                          a.localeCompare(b, 'pt-BR')
                        );
                        setSelectedCell({ dow, hour: h, consultants: names });
                      }}
                      className={cn(
                        'flex-1 h-9 rounded-lg text-xs font-bold tabular-nums transition-opacity',
                        hasSlots
                          ? 'bg-emerald-700 dark:bg-emerald-800 text-white hover:opacity-80 cursor-pointer'
                          : 'bg-muted cursor-default'
                      )}
                    >
                      {hasSlots ? count : ''}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
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
              {selectedCell?.consultants.length ?? 0} consultor
              {(selectedCell?.consultants.length ?? 0) !== 1 ? 'es' : ''} disponíve
              {(selectedCell?.consultants.length ?? 0) !== 1 ? 'is' : 'l'}
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-1 max-h-72 overflow-y-auto'>
            {selectedCell?.consultants.map((name) => (
              <div
                key={name}
                className='flex items-center gap-2.5 rounded-lg px-3 py-2 bg-muted/50'
              >
                <Icons.user className='size-3.5 text-muted-foreground shrink-0' />
                <span className='text-sm'>{name}</span>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
