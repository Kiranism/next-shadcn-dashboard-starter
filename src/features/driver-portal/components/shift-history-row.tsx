'use client';

/**
 * Expandable row for a worked shift in the history list.
 * Collapsed: day (dd.mm.yyyy) + worked hours.
 * Expanded: start, breaks, end (read-only, no editing).
 */

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { cn } from '@/lib/utils';
import { IconChevronDown, IconChevronUp } from '@tabler/icons-react';
import { useState } from 'react';
import type { Shift } from '@/features/driver-portal/types';

type ShiftEvent = { event_type: string; timestamp: string | null };

type ShiftWithEvents = Shift & {
  shift_events: ShiftEvent[];
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}.${month}.${year}`;
}

function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString('de-DE', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function computeWorkedMinutes(shift: ShiftWithEvents): number {
  const start = shift.started_at ? new Date(shift.started_at).getTime() : 0;
  const end = shift.ended_at ? new Date(shift.ended_at).getTime() : 0;
  if (!start || !end) return 0;

  let totalMs = end - start;
  const events = [...(shift.shift_events ?? [])].sort(
    (a, b) =>
      new Date(a.timestamp ?? 0).getTime() -
      new Date(b.timestamp ?? 0).getTime()
  );

  let breakStartTs: number | null = null;
  for (const ev of events) {
    const ts = ev.timestamp ? new Date(ev.timestamp).getTime() : 0;
    if (ev.event_type === 'break_start') {
      breakStartTs = ts;
    } else if (ev.event_type === 'break_end' && breakStartTs) {
      totalMs -= ts - breakStartTs;
      breakStartTs = null;
    }
  }

  return Math.round(totalMs / 60000);
}

function formatWorkedHours(minutes: number): string {
  if (minutes < 0) return '–';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) {
    return `${h} h ${m > 0 ? `${m} min` : ''}`.trim();
  }
  return `${m} min`;
}

function getBreaks(
  shift: ShiftWithEvents
): Array<{ start: string; end: string }> {
  const events = [...(shift.shift_events ?? [])].sort(
    (a, b) =>
      new Date(a.timestamp ?? 0).getTime() -
      new Date(b.timestamp ?? 0).getTime()
  );
  const breaks: Array<{ start: string; end: string }> = [];
  let breakStart: string | null = null;
  for (const ev of events) {
    if (!ev.timestamp) continue;
    if (ev.event_type === 'break_start') {
      breakStart = ev.timestamp;
    } else if (ev.event_type === 'break_end' && breakStart) {
      breaks.push({
        start: formatTime(breakStart),
        end: formatTime(ev.timestamp)
      });
      breakStart = null;
    }
  }
  return breaks;
}

export interface ShiftHistoryRowProps {
  shift: ShiftWithEvents;
}

export function ShiftHistoryRow({ shift }: ShiftHistoryRowProps) {
  const [open, setOpen] = useState(false);
  const workedMinutes = computeWorkedMinutes(shift);
  const workedDisplay = formatWorkedHours(workedMinutes);
  const dateDisplay = formatDate(shift.started_at);
  const startTime = shift.started_at ? formatTime(shift.started_at) : '–';
  const endTime = shift.ended_at ? formatTime(shift.ended_at) : '–';
  const breaks = getBreaks(shift);

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <div
        className={cn(
          'rounded-lg border transition-colors',
          open && 'border-muted-foreground/20'
        )}
      >
        <CollapsibleTrigger asChild>
          <button
            type='button'
            className='hover:bg-muted/50 flex w-full items-center justify-between px-4 py-3 text-left'
          >
            <span className='font-medium'>{dateDisplay}</span>
            <span className='text-muted-foreground flex items-center gap-2 font-mono tabular-nums'>
              {workedDisplay}
              {open ? (
                <IconChevronUp className='h-4 w-4' />
              ) : (
                <IconChevronDown className='h-4 w-4' />
              )}
            </span>
          </button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className='bg-muted/20 border-t px-4 py-3'>
            <dl className='space-y-2 text-sm'>
              <div className='flex justify-between'>
                <dt className='text-muted-foreground'>Beginn</dt>
                <dd className='font-mono tabular-nums'>{startTime}</dd>
              </div>
              {breaks.length > 0 && (
                <div>
                  <dt className='text-muted-foreground mb-1'>
                    Pause{breaks.length > 1 ? 'n' : ''}
                  </dt>
                  <dd className='space-y-1'>
                    {breaks.map((br, i) => (
                      <div
                        key={i}
                        className='text-muted-foreground font-mono tabular-nums'
                      >
                        {br.start} – {br.end}
                      </div>
                    ))}
                  </dd>
                </div>
              )}
              <div className='flex justify-between'>
                <dt className='text-muted-foreground'>Ende</dt>
                <dd className='font-mono tabular-nums'>{endTime}</dd>
              </div>
            </dl>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  );
}
