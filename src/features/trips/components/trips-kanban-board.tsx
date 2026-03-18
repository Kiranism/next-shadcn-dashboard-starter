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
import {
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Maximize2, Minimize2, Users, X } from 'lucide-react';
import { format, set } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
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
import { createClient } from '@/lib/supabase/client';
import {
  tripStatusBadge,
  tripStatusLabels,
  type TripStatus
} from '@/lib/trip-status';
import { cn } from '@/lib/utils';

/** Pending change for a single trip; staged until Save is clicked. */
type PendingChange = {
  driver_id?: string | null;
  status?: string;
  payer_id?: string | null;
  scheduled_at?: string | null;
  group_id?: string | null;
  stop_order?: number | null;
};

interface TripsKanbanBoardProps {
  trips: (Trip & {
    payer?: { name?: string | null } | null;
    billing_type?: { name?: string | null; color?: string | null } | null;
    driver?: { name?: string | null } | null;
    group_id?: string | null;
    stop_order?: number | null;
    requested_date?: string | null;
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
    Record<string, PendingChange>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  /** Callback when time is edited in TripCard; stages scheduled_at for save. */
  const onTimeChange = useCallback(
    (tripId: string, scheduledAt: string | null) => {
      setPendingChanges((prev) => {
        const next = { ...prev };
        const current = next[tripId] ?? {};
        current.scheduled_at = scheduledAt;
        next[tripId] = current;
        return next;
      });
    },
    []
  );

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

  /** Callback to dissolve a group; ungroups all trips in the group, persisted immediately. */
  const onUngroup = useCallback(
    async (groupId: string) => {
      try {
        const supabase = createClient();
        const { error } = await supabase
          .from('trips')
          .update({ group_id: null, stop_order: null })
          .eq('group_id', groupId);

        if (error) throw error;

        const tripIdsInGroup = effectiveTrips
          .filter((t) => t.group_id === groupId)
          .map((t) => t.id);
        setPendingChanges((prev) => {
          const next = { ...prev };
          for (const id of tripIdsInGroup) {
            const current = next[id];
            if (!current) continue;
            const { group_id, stop_order, ...rest } = current;
            if (Object.keys(rest).length === 0) delete next[id];
            else next[id] = rest;
          }
          return next;
        });
        toast.success('Gruppe aufgelöst');
        router.refresh();
      } catch (err) {
        toast.error(
          `Fehler beim Auflösen: ${err instanceof Error ? err.message : 'Unbekannt'}`
        );
      }
    },
    [router, effectiveTrips]
  );

  const columns: KanbanColumn[] = useMemo(
    () => buildColumns(effectiveTrips, groupBy, drivers),
    [effectiveTrips, groupBy, drivers]
  );
  const itemsByColumn = useMemo(
    () => buildItemsByColumn(effectiveTrips, columns, groupBy),
    [effectiveTrips, columns, groupBy]
  );

  /** Maps group_id to display label "Gruppe 1", "Gruppe 2", etc. (ordered by earliest scheduled_at). */
  const groupLabels = useMemo(() => {
    const ids = [
      ...new Set(effectiveTrips.map((t) => t.group_id).filter(Boolean))
    ] as string[];
    const withMinTime = ids.map((gid) => {
      const groupTrips = effectiveTrips.filter((t) => t.group_id === gid);
      const minTime = Math.min(
        ...groupTrips.map((t) =>
          t.scheduled_at ? new Date(t.scheduled_at).getTime() : Infinity
        )
      );
      return { gid, minTime };
    });
    withMinTime.sort((a, b) => a.minTime - b.minTime);
    const map: Record<string, string> = {};
    withMinTime.forEach(({ gid }, i) => {
      map[gid] = `Gruppe ${i + 1}`;
    });
    return map;
  }, [effectiveTrips]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over) return;

      const draggedId = String(active.id);

      // Drop on trip card → group trips (Option A)
      const overStr = String(over.id);
      // Droppable ids for trip cards use "trip-{id}" to distinguish from column ids.
      if (overStr.startsWith('trip-')) {
        const targetId = overStr.replace(/^trip-/, '');
        if (targetId === draggedId) return;

        const draggedTrip = effectiveTrips.find((t) => t.id === draggedId);
        const targetTrip = effectiveTrips.find((t) => t.id === targetId);
        if (!draggedTrip || !targetTrip) return;

        const targetGroupId = targetTrip.group_id ?? crypto.randomUUID();

        // Max stop_order in target's group; if new group, target gets 1, dragged gets 2
        const groupTrips = effectiveTrips.filter(
          (t) =>
            (t.group_id ?? (t.id === targetId ? targetGroupId : null)) ===
            targetGroupId
        );
        const maxStop = targetTrip.group_id
          ? Math.max(...groupTrips.map((t) => t.stop_order ?? 0), 0)
          : 1;
        const newStopOrder = maxStop + 1;

        setPendingChanges((prev) => {
          const next = { ...prev };

          // Dragged trip joins the group
          const draggedChange = next[draggedId] ?? {};
          draggedChange.group_id = targetGroupId;
          draggedChange.stop_order = newStopOrder;
          next[draggedId] = draggedChange;

          // If target had no group, assign it the new group too
          if (!targetTrip.group_id) {
            const targetChange = next[targetId] ?? {};
            targetChange.group_id = targetGroupId;
            targetChange.stop_order = 1;
            next[targetId] = targetChange;
          }

          return next;
        });
        return;
      }

      // Drop on column → update driver/status/payer
      const targetColumnId = overStr;
      setPendingChanges((prev) => {
        const next = { ...prev };
        const current = next[draggedId] ?? {};

        if (groupBy === 'driver') {
          current.driver_id =
            targetColumnId === 'unassigned' ? null : targetColumnId;
        } else if (groupBy === 'status') {
          current.status = targetColumnId;
        } else if (groupBy === 'payer') {
          current.payer_id =
            targetColumnId === 'no_payer' ? null : targetColumnId;
        }

        next[draggedId] = current;
        return next;
      });
    },
    [groupBy, effectiveTrips]
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
          const payload: Parameters<typeof tripsService.updateTrip>[1] = {
            driver_id: change.driver_id,
            status,
            payer_id: change.payer_id
          };
          if (change.scheduled_at !== undefined) {
            payload.scheduled_at = change.scheduled_at;
          }
          if (change.group_id !== undefined) {
            payload.group_id = change.group_id;
          }
          if (change.stop_order !== undefined) {
            payload.stop_order = change.stop_order;
          }
          return tripsService.updateTrip(id, payload);
        })
      );

      setPendingChanges({});
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges, router, trips]);

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
      {/* pointerWithin prefers smaller droppables (trip cards) over columns when overlapping. */}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
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
                groupLabels={groupLabels}
                onTimeChange={onTimeChange}
                onUngroup={onUngroup}
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

/** Group items: single trips stay single; all trips with the same group_id go into one container. */
function chunkItemsByGroup(
  items: TripsKanbanBoardProps['trips']
): { type: 'single' | 'group'; trips: TripsKanbanBoardProps['trips'] }[] {
  const groupMap = new Map<string, TripsKanbanBoardProps['trips']>();
  const singles: TripsKanbanBoardProps['trips'] = [];

  for (const trip of items) {
    if (!trip.group_id) {
      singles.push(trip);
    } else {
      const existing = groupMap.get(trip.group_id) ?? [];
      existing.push(trip);
      groupMap.set(trip.group_id, existing);
    }
  }

  // Sort trips within each group by scheduled_at / stop_order
  const blocks: {
    type: 'single' | 'group';
    trips: TripsKanbanBoardProps['trips'];
    position: number;
  }[] = [];

  for (const trip of singles) {
    const pos = trip.scheduled_at
      ? new Date(trip.scheduled_at).getTime()
      : Infinity;
    blocks.push({ type: 'single', trips: [trip], position: pos });
  }

  for (const trips of groupMap.values()) {
    trips.sort((a, b) => {
      if (a.stop_order != null && b.stop_order != null)
        return a.stop_order - b.stop_order;
      const aTime = a.scheduled_at
        ? new Date(a.scheduled_at).getTime()
        : Infinity;
      const bTime = b.scheduled_at
        ? new Date(b.scheduled_at).getTime()
        : Infinity;
      return aTime - bTime;
    });
    const position = Math.min(
      ...trips.map((t) =>
        t.scheduled_at ? new Date(t.scheduled_at).getTime() : Infinity
      )
    );
    blocks.push({ type: 'group', trips, position });
  }

  blocks.sort((a, b) => a.position - b.position);
  return blocks.map(({ type, trips }) => ({ type, trips }));
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

interface GroupedTripsContainerProps {
  trips: TripsKanbanBoardProps['trips'];
  groupLabel?: string;
  columnId: string;
  onTimeChange: (tripId: string, scheduledAt: string | null) => void;
  onUngroup: (groupId: string) => void;
}

function GroupedTripsContainer({
  trips,
  groupLabel,
  columnId,
  onTimeChange,
  onUngroup
}: GroupedTripsContainerProps) {
  const groupId = trips[0]?.group_id;
  if (!groupId || trips.length === 0) return null;

  return (
    <div className='border-primary/25 bg-primary/5 flex flex-col gap-1.5 rounded-lg border-2 p-1.5'>
      <div className='flex items-center justify-between gap-2 px-1.5 py-0.5'>
        <span className='text-muted-foreground text-[10px] font-medium uppercase'>
          {groupLabel ?? 'Gruppe'}
        </span>
        <button
          type='button'
          onClick={(e) => {
            e.stopPropagation();
            onUngroup(groupId);
          }}
          className='text-muted-foreground hover:text-foreground text-[10px]'
          title='Gruppe auflösen'
          aria-label='Gruppe auflösen'
        >
          ×
        </button>
      </div>
      {trips.map((trip) => (
        <TripCard
          key={trip.id}
          trip={trip}
          columnId={columnId}
          groupLabel={groupLabel}
          hideGroupBadge
          onTimeChange={onTimeChange}
          onUngroup={onUngroup}
        />
      ))}
    </div>
  );
}

interface TripCardProps {
  trip: TripsKanbanBoardProps['trips'][number];
  columnId: string;
  groupLabel?: string;
  hideGroupBadge?: boolean;
  onTimeChange: (tripId: string, scheduledAt: string | null) => void;
  onUngroup: (groupId: string) => void;
}

function KanbanColumnView({
  column,
  items,
  groupBy,
  groupLabels,
  onTimeChange,
  onUngroup
}: {
  column: KanbanColumn;
  items: TripsKanbanBoardProps['trips'];
  groupBy: GroupByMode;
  groupLabels: Record<string, string>;
  onTimeChange: (tripId: string, scheduledAt: string | null) => void;
  onUngroup: (groupId: string) => void;
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
          chunkItemsByGroup(items).map((chunk, chunkIdx) =>
            chunk.type === 'single' ? (
              <TripCard
                key={chunk.trips[0].id}
                trip={chunk.trips[0]}
                columnId={column.id}
                groupLabel={undefined}
                onTimeChange={onTimeChange}
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
                onUngroup={onUngroup}
              />
            )
          )
        )}
      </div>
    </div>
  );
}

function TripCard({
  trip,
  columnId,
  groupLabel,
  hideGroupBadge = false,
  onTimeChange,
  onUngroup
}: TripCardProps) {
  const scheduledAt = trip.scheduled_at;

  const [timeValue, setTimeValue] = useState(() =>
    scheduledAt ? format(new Date(scheduledAt), 'HH:mm') : '08:00'
  );

  useEffect(() => {
    if (scheduledAt) {
      setTimeValue(format(new Date(scheduledAt), 'HH:mm'));
    }
  }, [scheduledAt]);

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

  const dragStyle = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1
  };

  const payerName = trip.payer?.name;
  const billing = trip.billing_type;
  const cardColor = billing?.color || 'transparent';
  const isGrouped = !!trip.group_id;

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setTimeValue(next);
    if (!next) return;
    const [hh, mm] = next.split(':').map(Number);
    const baseDate = scheduledAt
      ? new Date(scheduledAt)
      : trip.requested_date
        ? new Date(trip.requested_date + 'T12:00:00')
        : new Date();
    const scheduledDate = set(baseDate, {
      hours: isNaN(hh) ? 8 : hh,
      minutes: isNaN(mm) ? 0 : mm,
      seconds: 0,
      milliseconds: 0
    });
    onTimeChange(trip.id, scheduledDate.toISOString());
  };

  const style =
    cardColor !== 'transparent'
      ? {
          ...dragStyle,
          backgroundColor: `color-mix(in srgb, ${cardColor}, var(--background) 88%)`,
          borderLeft: `3px solid ${cardColor}`
        }
      : dragStyle;

  return (
    <div
      ref={setDroppableRef}
      className={cn('relative', isOver && 'ring-primary/50 rounded-md ring-2')}
    >
      <Card
        ref={setDraggableRef}
        style={style}
        className='bg-background flex cursor-grab flex-col gap-1 rounded-md border p-2 text-xs shadow-sm active:cursor-grabbing'
        {...listeners}
        {...attributes}
      >
        <div className='flex items-center justify-between gap-2'>
          <div
            className='flex min-w-0 items-center justify-center font-semibold'
            onClick={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <Input
              type='time'
              value={timeValue}
              onChange={handleTimeChange}
              className='hover:bg-muted/40 h-6 w-14 rounded border-0 bg-transparent p-0 text-center text-xs leading-6 font-semibold shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 [&::-webkit-datetime-edit]:text-center [&::-webkit-datetime-edit-fields-wrapper]:inline-flex [&::-webkit-datetime-edit-fields-wrapper]:justify-center'
            />
          </div>
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
