'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  type DragEndEvent,
  useDraggable,
  useDroppable
} from '@dnd-kit/core';
import { MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import { closestCenter } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { Maximize2, Minimize2 } from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { Trip } from '../api/trips.service';
import { tripsService } from '../api/trips.service';
import { useTripFormData } from '@/features/trips/hooks/use-trip-form-data';
import { getStatusWhenDriverChanges } from '@/features/trips/lib/trip-status';
import {
  tripStatusBadge,
  tripStatusLabels,
  type TripStatus
} from '@/lib/trip-status';
import { cn } from '@/lib/utils';

interface TripsKanbanBoardProps {
  trips: (Trip & {
    payer?: { name?: string | null } | null;
    billing_type?: { name?: string | null; color?: string | null } | null;
    driver?: { name?: string | null } | null;
  })[];
  totalItems: number;
}

type GroupByMode = 'driver' | 'status' | 'payer';

type KanbanColumn = {
  id: string;
  title: string;
  subtitle?: string;
};

export function TripsKanbanBoard({ trips }: TripsKanbanBoardProps) {
  const router = useRouter();
  const { drivers } = useTripFormData();
  const [groupBy, setGroupBy] = useState<GroupByMode>('driver');
  const [pendingChanges, setPendingChanges] = useState<
    Record<
      string,
      { driver_id?: string | null; status?: string; payer_id?: string | null }
    >
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    if (!isExpanded) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsExpanded(false);
    };
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [isExpanded]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 }
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 }
    })
  );

  const effectiveTrips = useMemo(
    () =>
      trips.map((trip) => {
        const override = pendingChanges[trip.id];
        if (!override) return trip;
        return {
          ...trip,
          ...override
        };
      }),
    [trips, pendingChanges]
  );

  const columns: KanbanColumn[] = useMemo(
    () => buildColumns(effectiveTrips, groupBy, drivers),
    [effectiveTrips, groupBy, drivers]
  );
  const itemsByColumn = useMemo(
    () => buildItemsByColumn(effectiveTrips, columns, groupBy),
    [effectiveTrips, columns, groupBy]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const tripId = String(active.id);
      const targetColumnId = String(over.id);

      setPendingChanges((prev) => {
        const next = { ...prev };
        const current = next[tripId] ?? {};

        if (groupBy === 'driver') {
          current.driver_id =
            targetColumnId === 'unassigned' ? null : targetColumnId;
        } else if (groupBy === 'status') {
          current.status = targetColumnId;
        } else if (groupBy === 'payer') {
          current.payer_id =
            targetColumnId === 'no_payer' ? null : targetColumnId;
        }

        next[tripId] = current;
        return next;
      });
    },
    [groupBy]
  );

  const handleReset = useCallback(() => {
    setPendingChanges({});
  }, []);

  const handleSave = useCallback(async () => {
    if (Object.keys(pendingChanges).length === 0) return;
    setIsSaving(true);
    try {
      const updates = Object.entries(pendingChanges);
      if (updates.length === 0) return;

      await Promise.all(
        updates.map(([id, change]) => {
          const trip = trips.find((t) => t.id === id);
          const status =
            change.status ??
            getStatusWhenDriverChanges(
              trip?.status ?? 'pending',
              change.driver_id ?? null
            );
          return tripsService.updateTrip(id, {
            driver_id: change.driver_id,
            status,
            payer_id: change.payer_id
          });
        })
      );

      setPendingChanges({});
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges, router]);

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  const expandButton = (
    <Button
      type='button'
      variant='ghost'
      size='icon'
      className='text-muted-foreground hover:text-foreground h-8 w-8 shrink-0'
      onClick={() => setIsExpanded((v) => !v)}
      aria-label={isExpanded ? 'Kanban verkleinern' : 'Kanban vergrößern'}
    >
      {isExpanded ? (
        <Minimize2 className='h-4 w-4' />
      ) : (
        <Maximize2 className='h-4 w-4' />
      )}
    </Button>
  );

  const headerBar = (
    <div className='flex shrink-0 items-center justify-between gap-3 border-b px-4 py-2 text-sm'>
      <div className='flex items-center gap-2'>
        {expandButton}
        <div className='flex flex-col'>
          <span className='font-medium'>Kanban-Ansicht</span>
          <span className='text-muted-foreground text-xs'>
            {effectiveTrips.length} Fahrten – gruppiert nach{' '}
            {groupBy === 'driver'
              ? 'Fahrer'
              : groupBy === 'status'
                ? 'Status'
                : 'Kostenträger'}
          </span>
        </div>
      </div>
      <div className='flex items-center gap-2'>
        <Select
          value={groupBy}
          onValueChange={(value: GroupByMode) => setGroupBy(value)}
        >
          <SelectTrigger className='h-8 w-40 text-xs'>
            <SelectValue placeholder='Gruppieren nach' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='driver' className='text-xs'>
              Fahrer
            </SelectItem>
            <SelectItem value='status' className='text-xs'>
              Status
            </SelectItem>
            <SelectItem value='payer' className='text-xs'>
              Kostenträger
            </SelectItem>
          </SelectContent>
        </Select>
        <div className='flex items-center gap-1.5'>
          <Button
            variant='ghost'
            size='sm'
            className='text-muted-foreground hover:text-foreground h-8 px-3 text-xs'
            disabled={!hasPendingChanges || isSaving}
            onClick={handleReset}
          >
            Verwerfen
          </Button>
          <Button
            variant='default'
            size='sm'
            className='h-8 px-3 text-xs'
            disabled={!hasPendingChanges || isSaving}
            onClick={handleSave}
          >
            {isSaving ? 'Speichern…' : 'Speichern'}
          </Button>
        </div>
      </div>
    </div>
  );

  const boardArea = (
    <div className='min-h-0 min-w-0 flex-1 overflow-auto'>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <div className='inline-flex min-h-[260px] min-w-max gap-3 p-3'>
          {columns.map((column) => {
            const items = itemsByColumn[column.id] ?? [];
            return (
              <KanbanColumnView
                key={column.id}
                column={column}
                items={items}
                groupBy={groupBy}
              />
            );
          })}
        </div>
      </DndContext>
    </div>
  );

  if (isExpanded && typeof document !== 'undefined') {
    return createPortal(
      <div className='bg-background fixed inset-[2.5%] z-40 flex flex-col overflow-hidden rounded-lg border shadow-2xl'>
        {headerBar}
        {boardArea}
      </div>,
      document.body
    );
  }

  return (
    <div className='bg-background flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border'>
      {headerBar}
      {boardArea}
    </div>
  );
}

function buildColumns(
  trips: TripsKanbanBoardProps['trips'],
  groupBy: GroupByMode,
  drivers: { id: string; name: string }[]
): KanbanColumn[] {
  if (groupBy === 'driver') {
    const driverColumns: KanbanColumn[] = drivers
      .map((driver) => ({
        id: driver.id,
        title: driver.name
      }))
      .sort((a, b) => a.title.localeCompare(b.title, 'de'));

    return [
      {
        id: 'unassigned',
        title: 'Nicht zugewiesen'
      },
      ...driverColumns
    ];
  }

  if (groupBy === 'status') {
    const statusOrder: { id: string; title: string }[] = [
      { id: 'pending', title: 'Offen' },
      { id: 'assigned', title: 'Zugewiesen' },
      { id: 'in_progress', title: 'In Fahrt' },
      { id: 'completed', title: 'Abgeschlossen' },
      { id: 'cancelled', title: 'Storniert' }
    ];

    return statusOrder;
  }

  if (groupBy === 'payer') {
    const payerNames = new Map<string, string>();

    for (const trip of trips) {
      const payerId = trip.payer_id;
      const name = trip.payer?.name;
      if (payerId && name && !payerNames.has(payerId)) {
        payerNames.set(payerId, name);
      }
    }

    const payerColumns: KanbanColumn[] = Array.from(payerNames.entries()).map(
      ([id, name]) => ({
        id,
        title: name
      })
    );

    payerColumns.sort((a, b) => a.title.localeCompare(b.title, 'de'));

    return [
      {
        id: 'no_payer',
        title: 'Ohne Kostenträger'
      },
      ...payerColumns
    ];
  }

  return [];
}

function buildItemsByColumn(
  trips: TripsKanbanBoardProps['trips'],
  columns: KanbanColumn[],
  groupBy: GroupByMode
) {
  const itemsByColumn: Record<string, TripsKanbanBoardProps['trips']> = {};

  for (const column of columns) {
    itemsByColumn[column.id] = [];
  }

  for (const trip of trips) {
    const columnId =
      groupBy === 'driver'
        ? (trip.driver_id ?? 'unassigned')
        : groupBy === 'status'
          ? trip.status
          : (trip.payer_id ?? 'no_payer');

    if (!itemsByColumn[columnId]) {
      itemsByColumn[columnId] = [];
    }
    itemsByColumn[columnId].push(trip);
  }

  Object.keys(itemsByColumn).forEach((columnId) => {
    itemsByColumn[columnId].sort((a, b) => {
      const aTime = a.scheduled_at ? new Date(a.scheduled_at).getTime() : 0;
      const bTime = b.scheduled_at ? new Date(b.scheduled_at).getTime() : 0;
      return aTime - bTime;
    });
  });

  return itemsByColumn;
}

interface TripCardProps {
  trip: TripsKanbanBoardProps['trips'][number];
  columnId: string;
}

function KanbanColumnView({
  column,
  items,
  groupBy
}: {
  column: KanbanColumn;
  items: TripsKanbanBoardProps['trips'];
  groupBy: GroupByMode;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id
  });

  return (
    <div
      ref={setNodeRef}
      className='bg-muted/40 flex w-72 flex-shrink-0 flex-col rounded-lg border'
    >
      <div className='flex items-baseline justify-between gap-2 border-b px-3 py-2'>
        <div className='flex flex-col'>
          <span className='text-sm font-medium'>{column.title}</span>
          {column.subtitle && (
            <span className='text-muted-foreground text-[11px]'>
              {column.subtitle}
            </span>
          )}
        </div>
        <Badge variant='outline' className='px-2 py-0 text-[11px]'>
          {items.length}
        </Badge>
      </div>
      <div
        className='flex flex-1 flex-col gap-2 p-2'
        style={
          isOver
            ? {
                backgroundColor:
                  'color-mix(in srgb, var(--primary), transparent 92%)'
              }
            : undefined
        }
      >
        {items.length === 0 ? (
          <div className='text-muted-foreground flex flex-1 items-center justify-center text-xs'>
            Keine Fahrten
          </div>
        ) : (
          items.map((trip) => (
            <TripCard key={trip.id} trip={trip} columnId={column.id} />
          ))
        )}
      </div>
    </div>
  );
}

function TripCard({ trip, columnId }: TripCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } =
    useDraggable({
      id: trip.id,
      data: {
        tripId: trip.id,
        columnId
      }
    });

  const dragStyle = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1
  };

  const date = trip.scheduled_at ? new Date(trip.scheduled_at) : null;
  const timeLabel =
    date && !Number.isNaN(date.getTime())
      ? format(date, 'HH:mm', { locale: de })
      : '–';

  const payerName = trip.payer?.name;
  const billing = trip.billing_type;
  const cardColor = billing?.color || 'transparent';

  const style =
    cardColor !== 'transparent'
      ? {
          ...dragStyle,
          backgroundColor: `color-mix(in srgb, ${cardColor}, var(--background) 88%)`,
          borderLeft: `3px solid ${cardColor}`
        }
      : dragStyle;

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className='bg-background flex cursor-grab flex-col gap-1 rounded-md border p-2 text-xs shadow-sm active:cursor-grabbing'
      {...listeners}
      {...attributes}
    >
      <div className='flex items-center justify-between gap-2'>
        <span className='font-semibold'>{timeLabel}</span>
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
      <div className='mt-0.5 line-clamp-1 text-[11px] font-medium'>
        {trip.client_name || 'Unbekannter Fahrgast'}
      </div>
      <div className='text-muted-foreground mt-0.5 line-clamp-2 text-[11px]'>
        {trip.pickup_address} → {trip.dropoff_address}
      </div>
      <div className='mt-1 flex flex-wrap items-center gap-1'>
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
  );
}
