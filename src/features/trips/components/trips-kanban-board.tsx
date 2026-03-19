'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
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
import {
  GripVertical,
  Maximize2,
  Minimize2,
  Users,
  X,
  ZoomIn,
  ZoomOut
} from 'lucide-react';
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
import { useKanbanPendingStore } from '@/features/trips/stores/use-kanban-pending-store';
import { useTripFormData } from '@/features/trips/hooks/use-trip-form-data';
import { getStatusWhenDriverChanges } from '@/features/trips/lib/trip-status';
import {
  tripStatusBadge,
  tripStatusLabels,
  type TripStatus
} from '@/lib/trip-status';
import { cn } from '@/lib/utils';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/kanban-local-storage';

/** Pending change for a single trip. Assignments/grouping persist on drop; scheduled_at etc. via Save. */
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

/**
 * Kanban board for managing trips. Groups trips by driver, status, or payer.
 *
 * All changes (assignments, grouping, time edits) are staged in localStorage
 * until the user clicks "Speichern". "Verwerfen" clears pending changes.
 *
 * Reliability: useKanbanPendingStore persists to localStorage; beforeunload
 * warns on unsaved changes; orphan columns and loading state prevent cards
 * from disappearing; DragOverlay avoids DnD glitches.
 */
export function TripsKanbanBoard({ trips }: TripsKanbanBoardProps) {
  const router = useRouter();
  const { drivers, isLoading: isFormDataLoading } = useTripFormData();
  const { pendingChanges, setPendingChanges, clearPendingChanges } =
    useKanbanPendingStore();
  const [groupBy, setGroupBy] = useState<GroupByMode>('driver');
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [columnOrderByMode, setColumnOrderByMode] = useState<
    Partial<Record<GroupByMode, string[]>>
  >({});
  const [activeDragId, setActiveDragId] = useState<string | null>(null);

  /** Restore column order from localStorage on mount. */
  useEffect(() => {
    const stored = getItem<Partial<Record<GroupByMode, string[]>>>(
      STORAGE_KEYS.KANBAN_COLUMN_ORDER
    );
    if (stored && typeof stored === 'object') {
      setColumnOrderByMode(stored);
    }
  }, []);

  /** Persist column order to localStorage whenever it changes. */
  useEffect(() => {
    if (Object.keys(columnOrderByMode).length === 0) return;
    setItem(STORAGE_KEYS.KANBAN_COLUMN_ORDER, columnOrderByMode);
  }, [columnOrderByMode]);

  const zoomIn = useCallback(
    () => setZoom((z) => Math.min(1, Math.round((z + 0.1) * 10) / 10)),
    []
  );
  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10)),
    []
  );
  const [zoomInput, setZoomInput] = useState<string | null>(null);

  const applyZoomInput = useCallback((raw: string) => {
    const parsed = parseInt(raw.replace(/%/g, ''), 10);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.max(50, Math.min(100, parsed));
      setZoom(clamped / 100);
    }
    setZoomInput(null);
  }, []);

  const zoomDisplayValue =
    zoomInput !== null ? zoomInput : String(Math.round(zoom * 100));

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

  /** Warn before closing/refreshing when there are unsaved changes. */
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (Object.keys(pendingChanges).length > 0) {
        e.preventDefault();
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [pendingChanges]);

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

  /** Callback to dissolve a group; stages group_id=null, stop_order=null in localStorage. Save persists. */
  const onUngroup = useCallback(
    (groupId: string) => {
      const tripIdsInGroup = effectiveTrips
        .filter((t) => t.group_id === groupId)
        .map((t) => t.id);

      setPendingChanges((prev) => {
        const next = { ...prev };
        for (const id of tripIdsInGroup) {
          const current = next[id] ?? {};
          const { group_id, stop_order, ...rest } = current;
          next[id] = { ...rest, group_id: null, stop_order: null };
        }
        return next;
      });
      toast.success('Gruppe zum Auflösen vorgemerkt');
    },
    [effectiveTrips]
  );

  /** Column definitions (driver/status/payer) from current groupBy mode. */
  const columns: KanbanColumn[] = useMemo(
    () => buildColumns(effectiveTrips, groupBy, drivers),
    [effectiveTrips, groupBy, drivers]
  );
  /** Trips grouped by column id for display. */
  const itemsByColumn = useMemo(
    () => buildItemsByColumn(effectiveTrips, columns, groupBy),
    [effectiveTrips, columns, groupBy]
  );

  /**
   * Column order for display. Uses saved order from columnOrderByMode when available;
   * otherwise preserves buildColumns default. New columns (e.g. new driver) appear at end.
   */
  const effectiveColumns = useMemo(() => {
    const order = columnOrderByMode[groupBy];
    if (!order?.length) return columns;
    const orderSet = new Set(order);
    const ordered = order
      .filter((id) => columns.some((c) => c.id === id))
      .map((id) => columns.find((c) => c.id === id)!);
    const rest = columns.filter((c) => !orderSet.has(c.id));
    return [...ordered, ...rest];
  }, [columns, columnOrderByMode, groupBy]);

  /** Maps group_id → "Gruppe 1", "Gruppe 2", etc. (ordered by earliest scheduled_at). */
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

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  /**
   * Handles all drag-and-drop end events. All changes staged in localStorage.
   * 1. Column reorder: update columnOrderByMode only.
   * 2. Trip onto trip (grouping): stage group_id, stop_order in pendingChanges.
   * 3. Trip/group onto column (assignment): stage driver/status/payer in pendingChanges.
   * User clicks "Speichern" to persist all to DB.
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      if (!over) return;

      const draggedId = String(active.id);
      const overStr = String(over.id);
      const isDraggingGroup = draggedId.startsWith('group-');

      // 1. Column reorder: drag column header onto another column
      if (draggedId.startsWith('column-')) {
        const draggedColumnId = draggedId.replace(/^column-/, '');
        const isOverColumn = effectiveColumns.some((c) => c.id === overStr);
        if (isOverColumn && draggedColumnId !== overStr) {
          setColumnOrderByMode((prev) => {
            const currentOrder =
              prev[groupBy] ?? effectiveColumns.map((c) => c.id);
            const fromIdx = currentOrder.indexOf(draggedColumnId);
            const toIdx = currentOrder.indexOf(overStr);
            if (fromIdx === -1 || toIdx === -1) return prev;
            const reordered = [...currentOrder];
            reordered.splice(fromIdx, 1);
            reordered.splice(toIdx, 0, draggedColumnId);
            return { ...prev, [groupBy]: reordered };
          });
          return;
        }
      }

      // 2. Drop trip onto another trip card → group trips (dragged joins target's group). Staged in localStorage.
      if (!isDraggingGroup && overStr.startsWith('trip-')) {
        const targetId = overStr.replace(/^trip-/, '');
        if (targetId === draggedId) return;

        const draggedTrip = effectiveTrips.find((t) => t.id === draggedId);
        const targetTrip = effectiveTrips.find((t) => t.id === targetId);
        if (!draggedTrip || !targetTrip) return;

        const targetGroupId = targetTrip.group_id ?? crypto.randomUUID();

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
          const draggedChange = next[draggedId] ?? {};
          draggedChange.group_id = targetGroupId;
          draggedChange.stop_order = newStopOrder;
          next[draggedId] = draggedChange;
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

      // 3. Drop trip or group onto column → update driver/status/payer. Staged in localStorage.
      const targetColumnId = overStr;
      const tripIdsToUpdate = isDraggingGroup
        ? effectiveTrips
            .filter((t) => t.group_id === draggedId.replace('group-', ''))
            .map((t) => t.id)
        : [draggedId];

      const draggedTrip = effectiveTrips.find((t) => t.id === draggedId);
      const isSingleTripLeavingGroup =
        !isDraggingGroup && !!draggedTrip?.group_id;

      const value =
        groupBy === 'driver'
          ? targetColumnId === 'unassigned'
            ? null
            : targetColumnId
          : groupBy === 'status'
            ? targetColumnId
            : targetColumnId === 'no_payer'
              ? null
              : targetColumnId;

      setPendingChanges((prev) => {
        const next = { ...prev };
        for (const id of tripIdsToUpdate) {
          const current = next[id] ?? {};
          if (groupBy === 'driver') {
            current.driver_id = value as string | null;
          } else if (groupBy === 'status') {
            current.status = value as string;
          } else if (groupBy === 'payer') {
            current.payer_id = value as string | null;
          }
          if (isSingleTripLeavingGroup && id === draggedId) {
            current.group_id = null;
            current.stop_order = null;
          }
          next[id] = current;
        }
        return next;
      });
    },
    [groupBy, effectiveTrips, effectiveColumns]
  );

  const handleReset = useCallback(() => {
    clearPendingChanges();
  }, [clearPendingChanges]);

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

      clearPendingChanges();
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges, router, trips, clearPendingChanges]);

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
        <div className='text-muted-foreground flex items-center gap-0.5 border-r pr-2'>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={zoomOut}
            disabled={zoom <= 0.5}
            aria-label='Verkleinern'
          >
            <ZoomOut className='h-4 w-4' />
          </Button>
          <Input
            type='text'
            inputMode='numeric'
            value={zoomDisplayValue}
            onChange={(e) => setZoomInput(e.target.value)}
            onFocus={() => setZoomInput(zoomDisplayValue)}
            onBlur={() => applyZoomInput(zoomDisplayValue)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.currentTarget.blur();
              }
            }}
            className='h-8 w-14 [appearance:textfield] px-2 text-center text-xs [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none'
            aria-label='Zoom in Prozent'
          />
          <span className='text-muted-foreground text-xs'>%</span>
          <Button
            type='button'
            variant='ghost'
            size='icon'
            className='h-8 w-8'
            onClick={zoomIn}
            disabled={zoom >= 1}
            aria-label='Vergrößern'
          >
            <ZoomIn className='h-4 w-4' />
          </Button>
        </div>
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

  const boardArea = isFormDataLoading ? (
    <div className='text-muted-foreground flex min-h-[260px] min-w-0 flex-1 items-center justify-center'>
      Laden…
    </div>
  ) : (
    <div className='min-h-0 min-w-0 flex-1 overflow-auto'>
      {/* pointerWithin prefers smaller droppables (trip cards) over columns when overlapping. */}
      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div
          className='inline-flex min-h-[260px] min-w-max gap-3 p-3'
          style={{ zoom }}
        >
          {effectiveColumns.map((column) => {
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
        <DragOverlay dropAnimation={null}>
          {activeDragId ? (
            <KanbanDragPreview
              activeId={activeDragId}
              effectiveTrips={effectiveTrips}
              groupLabels={groupLabels}
            />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );

  const boardContent = (
    <>
      {headerBar}
      {boardArea}
    </>
  );

  if (isExpanded && typeof document !== 'undefined') {
    return createPortal(
      <div className='bg-background fixed inset-[2.5%] z-40 flex flex-col overflow-hidden rounded-lg border shadow-2xl'>
        {boardContent}
      </div>,
      document.body
    );
  }

  return (
    <div className='bg-background flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden rounded-lg border'>
      {boardContent}
    </div>
  );
}

/**
 * Builds column definitions for the Kanban board. Ensures every trip bucket has a column:
 * - Driver: known drivers + any driver_id in trips not in the list (orphan → "Fahrer (unbekannt)")
 * - Status: fixed list + any status in trips not in the list (orphan → "Status (unbekannt)")
 * - Payer: known payers + any payer_id in trips not in the list (orphan → "Kostenträger (unbekannt)")
 */
function buildColumns(
  trips: TripsKanbanBoardProps['trips'],
  groupBy: GroupByMode,
  drivers: { id: string; name: string }[]
): KanbanColumn[] {
  if (groupBy === 'driver') {
    const driverIds = new Set(drivers.map((d) => d.id));
    const driverColumns: KanbanColumn[] = drivers
      .map((driver) => ({ id: driver.id, title: driver.name }))
      .sort((a, b) => a.title.localeCompare(b.title, 'de'));

    const orphanDriverIds = [
      ...new Set(trips.map((t) => t.driver_id).filter(Boolean))
    ].filter((id): id is string => !!id && !driverIds.has(id));

    const orphanColumns: KanbanColumn[] = orphanDriverIds.map((id) => ({
      id,
      title: 'Fahrer (unbekannt)'
    }));

    return [
      { id: 'unassigned', title: 'Nicht zugewiesen' },
      ...driverColumns,
      ...orphanColumns
    ];
  }

  if (groupBy === 'status') {
    const knownStatuses = new Set([
      'pending',
      'assigned',
      'in_progress',
      'completed',
      'cancelled'
    ]);
    const statusOrder: { id: string; title: string }[] = [
      { id: 'pending', title: 'Offen' },
      { id: 'assigned', title: 'Zugewiesen' },
      { id: 'in_progress', title: 'In Fahrt' },
      { id: 'completed', title: 'Abgeschlossen' },
      { id: 'cancelled', title: 'Storniert' }
    ];

    const orphanStatuses = [
      ...new Set(trips.map((t) => t.status).filter(Boolean))
    ].filter((s): s is string => !!s && !knownStatuses.has(s));

    const orphanStatusColumns = orphanStatuses.map((id) => ({
      id,
      title: 'Status (unbekannt)'
    }));

    return [...statusOrder, ...orphanStatusColumns];
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
      ([id, name]) => ({ id, title: name })
    );
    payerColumns.sort((a, b) => a.title.localeCompare(b.title, 'de'));

    const knownPayerIds = new Set(payerNames.keys());
    const orphanPayerIds = [
      ...new Set(trips.map((t) => t.payer_id).filter(Boolean))
    ].filter((id): id is string => !!id && !knownPayerIds.has(id));

    const orphanPayerColumns = orphanPayerIds.map((id) => ({
      id,
      title: 'Kostenträger (unbekannt)'
    }));

    return [
      { id: 'no_payer', title: 'Ohne Kostenträger' },
      ...payerColumns,
      ...orphanPayerColumns
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

  const getSortPosition = (t: TripsKanbanBoardProps['trips'][number]) => {
    if (t.scheduled_at) return new Date(t.scheduled_at).getTime();
    if (t.link_type === 'return') return Infinity;
    return -1;
  };

  const blocks: {
    type: 'single' | 'group';
    trips: TripsKanbanBoardProps['trips'];
    position: number;
  }[] = [];

  for (const trip of singles) {
    blocks.push({
      type: 'single',
      trips: [trip],
      position: getSortPosition(trip)
    });
  }

  for (const groupTrips of groupMap.values()) {
    groupTrips.sort((a, b) => {
      if (a.stop_order != null && b.stop_order != null)
        return a.stop_order - b.stop_order;
      return getSortPosition(a) - getSortPosition(b);
    });
    const position = Math.min(...groupTrips.map(getSortPosition));
    blocks.push({ type: 'group', trips: groupTrips, position });
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

  const getSortPosition = (trip: TripsKanbanBoardProps['trips'][number]) => {
    if (trip.scheduled_at) return new Date(trip.scheduled_at).getTime();
    if (trip.link_type === 'return') return Infinity;
    return -1;
  };

  Object.keys(itemsByColumn).forEach((columnId) => {
    itemsByColumn[columnId].sort((a, b) => {
      return getSortPosition(a) - getSortPosition(b);
    });
  });

  return itemsByColumn;
}

/** Lightweight preview for DragOverlay; no hooks to avoid conflicting with active draggable. */
function KanbanDragPreview({
  activeId,
  effectiveTrips,
  groupLabels
}: {
  activeId: string;
  effectiveTrips: TripsKanbanBoardProps['trips'];
  groupLabels: Record<string, string>;
}) {
  const isGroup = activeId.startsWith('group-');
  if (isGroup) {
    const groupId = activeId.replace('group-', '');
    const groupTrips = effectiveTrips.filter((t) => t.group_id === groupId);
    if (groupTrips.length === 0) return null;
    return (
      <div className='border-primary/25 bg-primary/5 flex w-72 flex-shrink-0 flex-col gap-1.5 rounded-lg border-2 p-1.5 shadow-lg'>
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
      className='bg-background flex w-72 flex-shrink-0 flex-col gap-1 rounded-md border p-2 text-xs shadow-lg'
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

  const dragStyle = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1
  };

  return (
    <div
      ref={setDraggableRef}
      style={dragStyle}
      className='border-primary/25 bg-primary/5 flex flex-col gap-1.5 rounded-lg border-2 p-1.5'
    >
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
  disableDrag?: boolean;
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

  const setRefs = useCallback(
    (node: HTMLDivElement | null) => {
      setNodeRef(node);
      setDraggableRef(node);
    },
    [setNodeRef, setDraggableRef]
  );

  const dragStyle =
    transform && isDragging
      ? {
          transform: CSS.Translate.toString(transform),
          opacity: 0.9,
          zIndex: 50
        }
      : undefined;

  return (
    <div
      ref={setRefs}
      className={cn(
        'flex w-72 flex-shrink-0 flex-col rounded-lg border',
        isDragging ? 'bg-muted/60 ring-primary/30 z-50 ring-2' : 'bg-muted/40'
      )}
      style={dragStyle}
    >
      <div
        className='bg-muted sticky top-0 z-10 flex cursor-grab items-baseline justify-between gap-2 rounded-t-lg border-b px-3 py-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)] active:cursor-grabbing'
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
  disableDrag = false,
  onTimeChange,
  onUngroup
}: TripCardProps) {
  const scheduledAt = trip.scheduled_at;

  const [timeValue, setTimeValue] = useState(() =>
    scheduledAt ? format(new Date(scheduledAt), 'HH:mm') : ''
  );

  useEffect(() => {
    setTimeValue(scheduledAt ? format(new Date(scheduledAt), 'HH:mm') : '');
  }, [scheduledAt]);

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `trip-${trip.id}`
  });

  const draggable = useDraggable({
    id: trip.id,
    data: { tripId: trip.id, columnId }
  });

  const {
    attributes,
    listeners,
    setNodeRef: setDraggableRef,
    transform,
    isDragging
  } = draggable;

  const dragStyle = disableDrag
    ? {}
    : {
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
        ref={disableDrag ? undefined : setDraggableRef}
        style={style}
        className={cn(
          'bg-background flex flex-col gap-1 rounded-md border p-2 text-xs shadow-sm',
          !disableDrag && 'cursor-grab active:cursor-grabbing'
        )}
        {...(!disableDrag ? { ...listeners, ...attributes } : {})}
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
