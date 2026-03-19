'use client';

/**
 * KanbanDragPreview – rendered inside <DragOverlay> while a card or group is
 * being dragged. Uses no dnd-kit hooks so it never conflicts with the active
 * draggable element. It receives only the minimal data it needs to render.
 */

import { format } from 'date-fns';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { KanbanTrip } from '@/features/trips/lib/kanban-types';

interface KanbanDragPreviewProps {
  activeId: string;
  effectiveTrips: KanbanTrip[];
  groupLabels: Record<string, string>;
}

export function KanbanDragPreview({
  activeId,
  effectiveTrips,
  groupLabels
}: KanbanDragPreviewProps) {
  const isGroup = activeId.startsWith('group-');

  // ── Group preview ──────────────────────────────────────────────────────────
  if (isGroup) {
    const groupId = activeId.replace('group-', '');
    const groupTrips = effectiveTrips.filter((t) => t.group_id === groupId);
    if (groupTrips.length === 0) return null;

    return (
      <div className='border-primary/25 bg-primary/5 flex w-72 flex-shrink-0 flex-col gap-1.5 rounded-lg border-2 p-1.5 shadow-[0_8px_24px_rgba(0,0,0,0.18)]'>
        <div className='text-muted-foreground px-1.5 py-0.5 text-[10px] font-medium uppercase'>
          {groupLabels[groupId] ?? 'Gruppe'}
        </div>
        {groupTrips.slice(0, 2).map((trip) => (
          <div
            key={trip.id}
            className='bg-background rounded border p-2 text-xs'
          >
            <div className='font-medium'>
              {trip.scheduled_at
                ? format(new Date(trip.scheduled_at), 'HH:mm')
                : '--:--'}
            </div>
            <div className='line-clamp-1 text-[11px]'>
              {trip.client_name || 'Unbekannter Fahrgast'}
            </div>
          </div>
        ))}
        {groupTrips.length > 2 && (
          <div className='text-muted-foreground px-2 py-1 text-[10px]'>
            +{groupTrips.length - 2} weitere
          </div>
        )}
      </div>
    );
  }

  // ── Single trip preview ────────────────────────────────────────────────────
  const trip = effectiveTrips.find((t) => t.id === activeId);
  if (!trip) return null;

  const payerName = trip.payer?.name;
  const billing = trip.billing_type;
  const cardColor = billing?.color || 'transparent';
  const style =
    cardColor !== 'transparent'
      ? {
          backgroundColor: `color-mix(in srgb, ${cardColor}, var(--background) 88%)`,
          borderLeft: `3px solid ${cardColor}`
        }
      : {};

  return (
    <Card
      style={style}
      className='bg-background flex w-72 flex-shrink-0 flex-col gap-1 rounded-md border p-2 text-xs shadow-[0_8px_24px_rgba(0,0,0,0.18)]'
    >
      <div className='font-semibold'>
        {trip.scheduled_at
          ? format(new Date(trip.scheduled_at), 'HH:mm')
          : '--:--'}
      </div>
      <div className='line-clamp-1 text-[11px] font-medium'>
        {trip.client_name || 'Unbekannter Fahrgast'}
      </div>
      <div className='text-muted-foreground line-clamp-2 text-[11px]'>
        {trip.pickup_address} → {trip.dropoff_address}
      </div>
      {payerName && (
        <Badge variant='outline' className='mt-1 px-1.5 py-0 text-[10px]'>
          {payerName}
        </Badge>
      )}
    </Card>
  );
}
