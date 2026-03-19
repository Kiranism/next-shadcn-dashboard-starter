'use client';

/**
 * TripCard – a single draggable + droppable Kanban card.
 *
 * Responsibilities:
 * - Renders trip data (time, name, addresses, badges).
 * - Provides a droppable zone for trip-onto-trip grouping.
 * - Provides drag handle behaviour.
 * - Lets the user edit scheduled time (inline, debounced).
 * - Shows a stop_order input when the card is inside a group.
 */

import { useCallback, useEffect, useRef, useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Users, X } from 'lucide-react';
import { format, set } from 'date-fns';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  tripStatusBadge,
  tripStatusLabels,
  type TripStatus
} from '@/lib/trip-status';
import { cn } from '@/lib/utils';
import type {
  KanbanTrip,
  OnTimeChange,
  OnStopOrderChange,
  OnUngroup
} from '@/features/trips/lib/kanban-types';

export interface TripCardProps {
  trip: KanbanTrip;
  columnId: string;
  groupLabel?: string;
  hideGroupBadge?: boolean;
  disableDrag?: boolean;
  onTimeChange: OnTimeChange;
  /** Called when the user edits stop_order on a grouped card. Only rendered when isGrouped. */
  onStopOrderChange: OnStopOrderChange;
  onUngroup: OnUngroup;
}

export function TripCard({
  trip,
  columnId,
  groupLabel,
  hideGroupBadge = false,
  disableDrag = false,
  onTimeChange,
  onStopOrderChange,
  onUngroup
}: TripCardProps) {
  const scheduledAt = trip.scheduled_at;

  // ── Time input state ───────────────────────────────────────────────────────
  const [timeValue, setTimeValue] = useState(() =>
    scheduledAt ? format(new Date(scheduledAt), 'HH:mm') : ''
  );
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Stop-order input state ─────────────────────────────────────────────────
  const [stopOrderValue, setStopOrderValue] = useState<string>(
    trip.stop_order != null ? String(trip.stop_order) : ''
  );
  const stopOrderDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  // Sync time when the effective scheduled_at changes (e.g. after save).
  useEffect(() => {
    setTimeValue(scheduledAt ? format(new Date(scheduledAt), 'HH:mm') : '');
  }, [scheduledAt]);

  // Sync stop-order when the effective value changes from outside.
  useEffect(() => {
    setStopOrderValue(trip.stop_order != null ? String(trip.stop_order) : '');
  }, [trip.stop_order]);

  // Cleanup debounce timers on unmount.
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (stopOrderDebounceRef.current)
        clearTimeout(stopOrderDebounceRef.current);
    };
  }, []);

  // ── DnD ───────────────────────────────────────────────────────────────────
  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `trip-${trip.id}`
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging
  } = useDraggable({
    id: trip.id,
    data: { tripId: trip.id, columnId }
  });

  // opacity: 0 → invisible DOM placeholder while DragOverlay is shown.
  const dragStyle = disableDrag
    ? {}
    : {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0 : 1
      };

  // ── Derived display values ─────────────────────────────────────────────────
  const payerName = trip.payer?.name;
  const billing = trip.billing_type;
  const cardColor = billing?.color || 'transparent';
  const isGrouped = !!trip.group_id;

  // ── Stop-order handlers ────────────────────────────────────────────────────
  const handleStopOrderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    setStopOrderValue(raw);
    if (stopOrderDebounceRef.current)
      clearTimeout(stopOrderDebounceRef.current);
    const parsed = parseInt(raw, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      stopOrderDebounceRef.current = setTimeout(() => {
        stopOrderDebounceRef.current = null;
        onStopOrderChange(trip.id, parsed);
      }, 900);
    }
  };

  const handleStopOrderBlur = () => {
    if (stopOrderDebounceRef.current) {
      clearTimeout(stopOrderDebounceRef.current);
      stopOrderDebounceRef.current = null;
    }
    const parsed = parseInt(stopOrderValue, 10);
    if (!Number.isNaN(parsed) && parsed >= 1) {
      onStopOrderChange(trip.id, parsed);
    }
  };

  // ── Time handlers ─────────────────────────────────────────────────────────
  const commitTimeToStore = useCallback(
    (value: string) => {
      if (!value) return;
      const [hh, mm] = value.split(':').map(Number);
      const baseDate = scheduledAt
        ? new Date(scheduledAt)
        : trip.requested_date
          ? new Date(trip.requested_date + 'T12:00:00')
          : new Date();
      const scheduledDate = set(baseDate, {
        hours: Number.isNaN(hh) ? 8 : hh,
        minutes: Number.isNaN(mm) ? 0 : mm,
        seconds: 0,
        milliseconds: 0
      });
      onTimeChange(trip.id, scheduledDate.toISOString());
    },
    [scheduledAt, trip.id, trip.requested_date, onTimeChange]
  );

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setTimeValue(next);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!next) return;
    debounceRef.current = setTimeout(() => {
      debounceRef.current = null;
      commitTimeToStore(next);
    }, 900);
  };

  const handleTimeBlur = () => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (timeValue) commitTimeToStore(timeValue);
  };

  // ── Merged card style (drag + billing colour) ──────────────────────────────
  const style =
    cardColor !== 'transparent'
      ? {
          ...dragStyle,
          backgroundColor: `color-mix(in srgb, ${cardColor}, var(--background) 88%)`,
          borderLeft: `3px solid ${cardColor}`
        }
      : dragStyle;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div
      ref={setDroppableRef}
      className={cn('relative', isOver && 'ring-primary/50 rounded-md ring-2')}
    >
      <Card
        ref={disableDrag ? undefined : setDraggableRef}
        style={style}
        className={cn(
          'bg-background flex flex-col gap-1 rounded-md border p-2 text-xs shadow-none',
          !disableDrag && 'cursor-grab active:cursor-grabbing'
        )}
        {...(!disableDrag ? { ...listeners, ...attributes } : {})}
      >
        {/* Header row: time input | stop-order (if grouped) | status badge */}
        <div className='flex items-center justify-between gap-2'>
          {/* Time input */}
          <div
            className='bg-muted/70 hover:bg-muted/40 grid h-6 w-14 shrink-0 place-items-center rounded transition-colors'
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <input
              type='time'
              value={timeValue}
              onChange={handleTimeChange}
              onBlur={handleTimeBlur}
              className={cn(
                'hover:bg-muted/40 h-6 w-14 rounded border-0 bg-transparent p-0 text-center text-xs font-semibold outline-none',
                '[&::-webkit-calendar-picker-indicator]:hidden',
                '[&::-webkit-datetime-edit]:m-0 [&::-webkit-datetime-edit]:flex [&::-webkit-datetime-edit]:h-full [&::-webkit-datetime-edit]:w-full [&::-webkit-datetime-edit]:items-center [&::-webkit-datetime-edit]:justify-center',
                '[&::-webkit-datetime-edit-fields-wrapper]:flex [&::-webkit-datetime-edit-fields-wrapper]:justify-center',
                'focus-visible:ring-0'
              )}
            />
          </div>

          {/* Stop-order input – only when inside a group */}
          {isGrouped && (
            <div
              className='ml-auto flex items-center'
              onClick={(e) => e.stopPropagation()}
              onPointerDown={(e) => e.stopPropagation()}
            >
              <input
                type='number'
                min={1}
                value={stopOrderValue}
                onChange={handleStopOrderChange}
                onBlur={handleStopOrderBlur}
                placeholder='–'
                title='Reihenfolge in der Gruppe'
                aria-label='Reihenfolge'
                className={cn(
                  'bg-muted/70 hover:bg-muted/40 focus:bg-muted/40 h-6 w-8 rounded border-0 p-0 text-center text-xs font-semibold outline-none focus-visible:ring-1 focus-visible:ring-offset-0',
                  '[appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
                )}
              />
            </div>
          )}

          {/* Status badge */}
          {trip.status && (
            <Badge
              className={cn(
                tripStatusBadge({ status: trip.status as TripStatus }),
                'text-[10px]'
              )}
            >
              {tripStatusLabels[trip.status as TripStatus] ?? trip.status}
            </Badge>
          )}
        </div>

        {/* Client name */}
        <div className='mt-0.5 line-clamp-1 text-[11px] font-medium'>
          {trip.client_name || 'Unbekannter Fahrgast'}
        </div>

        {/* Route */}
        <div className='text-muted-foreground mt-0.5 line-clamp-2 text-[11px]'>
          {trip.pickup_address} → {trip.dropoff_address}
        </div>

        {/* Bottom badges */}
        <div className='mt-1 flex flex-wrap items-center gap-1'>
          {isGrouped && groupLabel && !hideGroupBadge && (
            <Badge
              variant='secondary'
              className='gap-0.5 px-1.5 py-0 text-[10px]'
            >
              <Users className='h-3 w-3' />
              {groupLabel}
              <button
                type='button'
                onClick={(e) => {
                  e.stopPropagation();
                  onUngroup(trip.group_id!);
                }}
                onPointerDown={(e) => e.stopPropagation()}
                className='hover:bg-muted ml-0.5 rounded p-0.5'
                title='Gruppe auflösen'
                aria-label='Gruppe auflösen'
              >
                <X className='h-3 w-3' />
              </button>
            </Badge>
          )}
          {payerName && (
            <Badge
              variant='outline'
              className='border-dashed px-1.5 py-0 text-[10px]'
            >
              {payerName}
            </Badge>
          )}
          {billing && (
            <Badge
              variant='outline'
              className='px-1.5 py-0 text-[10px]'
              style={
                billing.color
                  ? {
                      borderColor: billing.color,
                      color: billing.color,
                      backgroundColor: `color-mix(in srgb, ${billing.color}, var(--background) 90%)`
                    }
                  : undefined
              }
            >
              {billing.name}
            </Badge>
          )}
          {trip.is_wheelchair && (
            <Badge variant='outline' className='px-1.5 py-0 text-[10px]'>
              Rollstuhl
            </Badge>
          )}
        </div>
      </Card>
    </div>
  );
}
