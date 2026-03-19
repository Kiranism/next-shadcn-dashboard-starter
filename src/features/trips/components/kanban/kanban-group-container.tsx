'use client';

/**
 * GroupedTripsContainer – renders a group of trips that share a group_id.
 *
 * The group header is draggable (moves all trips together).
 * Individual TripCards inside can still be dragged out independently.
 */

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

import { cn } from '@/lib/utils';
import type {
  KanbanTrip,
  OnTimeChange,
  OnStopOrderChange,
  OnUngroup
} from '@/features/trips/lib/kanban-types';
import { TripCard } from './kanban-trip-card';

export interface GroupedTripsContainerProps {
  trips: KanbanTrip[];
  groupLabel?: string;
  columnId: string;
  onTimeChange: OnTimeChange;
  onStopOrderChange: OnStopOrderChange;
  onUngroup: OnUngroup;
}

export function GroupedTripsContainer({
  trips,
  groupLabel,
  columnId,
  onTimeChange,
  onStopOrderChange,
  onUngroup
}: GroupedTripsContainerProps) {
  const groupId = trips[0]?.group_id;
  if (!groupId || trips.length === 0) return null;

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging
  } = useDraggable({
    id: `group-${groupId}`,
    data: { groupId, tripIds: trips.map((t) => t.id) }
  });

  // opacity: 0 while dragging — DragOverlay is the visible representation.
  const dragStyle = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0 : 1
  };

  return (
    <div
      ref={setDraggableRef}
      style={dragStyle}
      className={cn(
        'border-primary/25 bg-primary/5 flex flex-col gap-1.5 rounded-lg border-2 p-1.5',
        isDragging && 'shadow-none'
      )}
    >
      {/* Drag handle / group header */}
      <div
        className='flex cursor-grab items-center justify-between gap-2 px-1.5 py-0.5 active:cursor-grabbing'
        {...listeners}
        {...attributes}
      >
        <span className='text-muted-foreground text-[10px] font-medium uppercase'>
          {groupLabel ?? 'Gruppe'}
        </span>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            onUngroup(groupId);
          }}
          onPointerDown={(e) => e.stopPropagation()}
          className='text-muted-foreground hover:text-foreground text-[10px]'
          title='Gruppe auflösen'
          aria-label='Gruppe auflösen'
        >
          ×
        </button>
      </div>

      {/* Individual cards */}
      {trips.map((trip) => (
        <TripCard
          key={trip.id}
          trip={trip}
          columnId={columnId}
          groupLabel={groupLabel}
          hideGroupBadge
          onTimeChange={onTimeChange}
          onStopOrderChange={onStopOrderChange}
          onUngroup={onUngroup}
        />
      ))}
    </div>
  );
}
