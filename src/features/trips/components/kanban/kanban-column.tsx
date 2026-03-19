'use client';

/**
 * KanbanColumnView – a single droppable column on the Kanban board.
 *
 * The column header is also draggable so users can reorder columns.
 * The column body accepts trips dropped onto it (driver/status/payer assignment).
 */

import { useCallback } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Plus } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type {
  KanbanTrip,
  KanbanColumn,
  GroupByMode,
  OnTimeChange,
  OnStopOrderChange,
  OnUngroup
} from '@/features/trips/lib/kanban-types';
import { chunkItemsByGroup } from '@/features/trips/lib/kanban-grouping';
import { TripCard } from './kanban-trip-card';
import { GroupedTripsContainer } from './kanban-group-container';

export interface KanbanColumnViewProps {
  column: KanbanColumn;
  items: KanbanTrip[];
  groupBy: GroupByMode;
  groupLabels: Record<string, string>;
  /** The id of the element currently being dragged, or null. Used to show column-reorder indicator. */
  activeDragId: string | null;
  onTimeChange: OnTimeChange;
  onStopOrderChange: OnStopOrderChange;
  onUngroup: OnUngroup;
}

export function KanbanColumnView({
  column,
  items,
  groupLabels,
  activeDragId,
  onTimeChange,
  onStopOrderChange,
  onUngroup
}: KanbanColumnViewProps) {
  // ── Droppable (column body accepts trips) ──────────────────────────────────
  const { setNodeRef, isOver } = useDroppable({ id: column.id });

  // ── Draggable (header enables column reordering) ───────────────────────────
  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging
  } = useDraggable({
    id: `column-${column.id}`,
    data: { columnId: column.id }
  });

  // Share the same DOM node for both droppable and draggable refs.
  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      setDraggableRef(node);
    },
    [setNodeRef, setDraggableRef]
  );

  // Columns fade (not invisible) so the reorder slot is clearly visible.
  const dragStyle =
    transform && isDragging
      ? {
          transform: CSS.Translate.toString(transform),
          opacity: 0.3,
          zIndex: 50
        }
      : undefined;

  // True when a column header is being dragged (vs a trip card).
  const isColumnDrag = !!activeDragId?.startsWith('column-');
  // This column is the drop target for a column reorder.
  const isColumnDropTarget = isColumnDrag && isOver && !isDragging;

  return (
    <div
      ref={setRefs}
      className={cn(
        'flex w-72 flex-shrink-0 flex-col rounded-lg border transition-all duration-150',
        isDragging ? 'bg-muted/60 ring-primary/30 z-50 ring-2' : 'bg-muted/40',
        isColumnDropTarget && 'ring-primary ring-2'
      )}
      style={dragStyle}
    >
      {/* Column header – drag handle; highlights when this column is the reorder target */}
      <div
        className={cn(
          'bg-muted sticky top-0 z-10 flex cursor-grab items-baseline justify-between gap-2 rounded-t-lg border-b px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)] transition-colors duration-150 active:cursor-grabbing',
          isColumnDropTarget && 'bg-primary/10'
        )}
        {...listeners}
        {...attributes}
      >
        <div className='flex min-w-0 flex-1 items-center gap-1.5'>
          <GripVertical className='text-muted-foreground h-4 w-4 shrink-0' />
          <div className='flex min-w-0 flex-col'>
            <span className='text-sm font-medium'>{column.title}</span>
            {column.subtitle && (
              <span className='text-muted-foreground text-[11px]'>
                {column.subtitle}
              </span>
            )}
          </div>
        </div>
        <Badge variant='outline' className='px-2 py-0 text-[11px]'>
          {items.length}
        </Badge>
      </div>

      {/* Column body – tinted only for trip drops, not column reorder */}
      <div
        className='flex flex-1 flex-col gap-2 px-2 pt-2 pb-8'
        style={
          isOver && !isColumnDrag
            ? {
                backgroundColor:
                  'color-mix(in srgb, var(--primary), transparent 92%)'
              }
            : undefined
        }
      >
        {/* Drop-zone indicator */}
        <div
          className='text-muted-foreground/60 hover:text-muted-foreground flex shrink-0 items-center justify-center rounded border border-dashed py-1.5 text-xs transition-colors'
          aria-hidden
        >
          <Plus className='h-4 w-4' />
        </div>

        {items.length === 0 ? (
          <div className='text-muted-foreground flex flex-1 items-center justify-center text-xs'>
            Keine Fahrten
          </div>
        ) : (
          chunkItemsByGroup(items).map((chunk, chunkIdx) =>
            chunk.type === 'single' ? (
              <TripCard
                key={chunk.trips[0].id}
                trip={chunk.trips[0]}
                columnId={column.id}
                groupLabel={undefined}
                onTimeChange={onTimeChange}
                onStopOrderChange={onStopOrderChange}
                onUngroup={onUngroup}
              />
            ) : (
              <GroupedTripsContainer
                key={chunk.trips[0].group_id ?? chunkIdx}
                trips={chunk.trips}
                groupLabel={
                  chunk.trips[0]?.group_id
                    ? groupLabels[chunk.trips[0].group_id]
                    : undefined
                }
                columnId={column.id}
                onTimeChange={onTimeChange}
                onStopOrderChange={onStopOrderChange}
                onUngroup={onUngroup}
              />
            )
          )
        )}
      </div>
    </div>
  );
}
