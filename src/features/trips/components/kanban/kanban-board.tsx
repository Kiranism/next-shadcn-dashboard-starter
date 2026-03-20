'use client';

/**
 * TripsKanbanBoard – top-level orchestrator for the Kanban board.
 *
 * Responsibilities (this file only):
 * - State: groupBy, zoom, column order, expand/collapse, activeDragId, isSaving
 * - Pending changes: proxy to useKanbanPendingStore (via setPendingChanges)
 * - DnD event handling: handleDragStart / handleDragEnd
 * - Save / Reset logic
 * - Layout: expanded (portal) vs inline
 *
 * All visual sub-components live in sibling files.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin
} from '@dnd-kit/core';
import { toast } from 'sonner';

import { tripsService } from '../../api/trips.service';
import {
  useKanbanPendingStore,
  syncTripIds
} from '@/features/trips/stores/use-kanban-pending-store';
import { useTripFormData } from '@/features/trips/hooks/use-trip-form-data';
import { getStatusWhenDriverChanges } from '@/features/trips/lib/trip-status';
import { getItem, setItem, STORAGE_KEYS } from '@/lib/kanban-local-storage';
import {
  buildColumns,
  buildItemsByColumn
} from '@/features/trips/lib/kanban-columns';
import { deriveStatusForPending } from '@/features/trips/lib/kanban-grouping';
import type {
  KanbanTrip,
  GroupByMode,
  KanbanColumn,
  PendingChange
} from '@/features/trips/lib/kanban-types';

import { KanbanHeader } from './kanban-header';
import { KanbanColumnView } from './kanban-column';
import { KanbanDragPreview } from './kanban-drag-preview';

// ─── Props ────────────────────────────────────────────────────────────────────

interface TripsKanbanBoardProps {
  trips: KanbanTrip[];
  totalItems: number;
}

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Kanban board for managing trips. Groups trips by driver, status, or payer.
 *
 * All changes (assignments, grouping, time edits) are staged in localStorage
 * until the user clicks "Speichern". "Verwerfen" clears pending changes.
 *
 * Reliability:
 * - useKanbanPendingStore persists to localStorage; beforeunload warns.
 * - Orphan columns prevent cards from disappearing when a driver/status is removed.
 * - DragOverlay avoids coordinate glitches under CSS transform scale.
 * - Status is staged at drag-end so the badge is immediately correct.
 */
export function TripsKanbanBoard({ trips }: TripsKanbanBoardProps) {
  const router = useRouter();
  const { drivers, isLoading: isFormDataLoading } = useTripFormData();
  const { pendingChanges, setPendingChanges, clearPendingChanges, pruneToIds } =
    useKanbanPendingStore();

  // ── Synchronous ID sync — must happen before any useMemo that reads pendingChanges ─
  // syncTripIds keeps the module-level ref up to date so the Zustand
  // onRehydrateStorage callback can prune stale entries synchronously.
  // pruneToIds is also called here to cover the case where rehydration
  // already finished by the time this render runs.
  const currentTripIds = useMemo(
    () => new Set(trips.map((t) => t.id)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [trips]
  );
  syncTripIds(currentTripIds);
  // Prune inline (safe to call on every render — it's a no-op when nothing changed).
  pruneToIds(currentTripIds);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [groupBy, setGroupBy] = useState<GroupByMode>('driver');
  const [isSaving, setIsSaving] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [columnOrderByMode, setColumnOrderByMode] = useState<
    Partial<Record<GroupByMode, string[]>>
  >({});
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [zoomInput, setZoomInput] = useState<string | null>(null);

  // ── Column order persistence ────────────────────────────────────────────────
  useEffect(() => {
    const stored = getItem<Partial<Record<GroupByMode, string[]>>>(
      STORAGE_KEYS.KANBAN_COLUMN_ORDER
    );
    if (stored && typeof stored === 'object') setColumnOrderByMode(stored);
  }, []);

  useEffect(() => {
    if (Object.keys(columnOrderByMode).length === 0) return;
    setItem(STORAGE_KEYS.KANBAN_COLUMN_ORDER, columnOrderByMode);
  }, [columnOrderByMode]);

  // ── Expand / ESC ────────────────────────────────────────────────────────────
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

  // ── Zoom helpers ────────────────────────────────────────────────────────────
  const zoomIn = useCallback(
    () => setZoom((z) => Math.min(1, Math.round((z + 0.1) * 10) / 10)),
    []
  );
  const zoomOut = useCallback(
    () => setZoom((z) => Math.max(0.5, Math.round((z - 0.1) * 10) / 10)),
    []
  );
  const zoomDisplayValue =
    zoomInput !== null ? zoomInput : String(Math.round(zoom * 100));
  const applyZoomInput = useCallback((raw: string) => {
    const parsed = parseInt(raw.replace(/%/g, ''), 10);
    if (!Number.isNaN(parsed)) {
      const clamped = Math.max(50, Math.min(100, parsed));
      setZoom(clamped / 100);
    }
    setZoomInput(null);
  }, []);

  // ── beforeunload guard ──────────────────────────────────────────────────────────────
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (Object.keys(pendingChanges).length === 0) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [pendingChanges]);

  // ── DnD sensors ─────────────────────────────────────────────────────────────
  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 120, tolerance: 8 }
    })
  );

  // ── Effective trips (server + pending overlay) ──────────────────────────────
  const effectiveTrips = useMemo(
    () =>
      trips.map((trip) => {
        const override = pendingChanges[trip.id];
        if (!override) return trip;
        return { ...trip, ...override };
      }),
    [trips, pendingChanges]
  );

  // ── Callbacks staged in pendingChanges ─────────────────────────────────────

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

  const onStopOrderChange = useCallback((tripId: string, order: number) => {
    setPendingChanges((prev) => {
      const next = { ...prev };
      const current = next[tripId] ?? {};
      current.stop_order = order;
      next[tripId] = current;
      return next;
    });
  }, []);

  const onUngroup = useCallback(
    (groupId: string) => {
      const tripIdsInGroup = effectiveTrips
        .filter((t) => t.group_id === groupId)
        .map((t) => t.id);
      setPendingChanges((prev) => {
        const next = { ...prev };
        for (const id of tripIdsInGroup) {
          const current = next[id] ?? {};
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const { group_id, stop_order, ...rest } = current;
          next[id] = { ...rest, group_id: null, stop_order: null };
        }
        return next;
      });
      toast.success('Gruppe zum Auflösen vorgemerkt');
    },
    [effectiveTrips]
  );

  // ── Columns & layout ────────────────────────────────────────────────────────

  const columns: KanbanColumn[] = useMemo(
    () => buildColumns(effectiveTrips, groupBy, drivers),
    [effectiveTrips, groupBy, drivers]
  );

  const itemsByColumn = useMemo(
    () => buildItemsByColumn(effectiveTrips, columns, groupBy),
    [effectiveTrips, columns, groupBy]
  );

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

  /** Maps group_id → "Gruppe 1", "Gruppe 2", … (ordered by earliest scheduled_at). */
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

  // ── DnD handlers ────────────────────────────────────────────────────────────

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(String(event.active.id));
  }, []);

  /**
   * Handles all drag-end events. Three cases:
   * 1. Column header → another column: reorder columns.
   * 2. Trip → trip: group trips together.
   * 3. Trip/group → column: reassign driver / status / payer.
   * All changes staged in pendingChanges until "Speichern".
   */
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveDragId(null);
      const { active, over } = event;
      if (!over) return;

      const draggedId = String(active.id);
      const overStr = String(over.id);
      const isDraggingGroup = draggedId.startsWith('group-');

      // 1. Column reorder
      // pointerWithin may report a trip-card droppable (trip-{id}) as `over`
      // instead of the column droppable when the pointer lands on a card inside
      // the target column. Resolve the actual target column in both cases.
      if (draggedId.startsWith('column-')) {
        const draggedColumnId = draggedId.replace(/^column-/, '');

        let targetColumnId = overStr;

        // If we landed on a trip card, find which column owns that trip.
        if (overStr.startsWith('trip-')) {
          const tripId = overStr.replace(/^trip-/, '');
          const trip = effectiveTrips.find((t) => t.id === tripId);
          if (trip) {
            targetColumnId =
              groupBy === 'driver'
                ? (trip.driver_id ?? 'unassigned')
                : groupBy === 'status'
                  ? (trip.status ?? '')
                  : (trip.payer_id ?? 'no_payer');
          }
        }

        const isOverColumn = effectiveColumns.some(
          (c) => c.id === targetColumnId
        );
        if (isOverColumn && draggedColumnId !== targetColumnId) {
          setColumnOrderByMode((prev) => {
            // Always derive currentOrder from effectiveColumns (which already
            // merges the stored order with any new columns). This prevents the
            // silent no-op when localStorage didn't include the last column.
            const currentOrder = effectiveColumns.map((c) => c.id);
            const fromIdx = currentOrder.indexOf(draggedColumnId);
            const toIdx = currentOrder.indexOf(targetColumnId);
            if (fromIdx === -1 || toIdx === -1) return prev;
            const reordered = [...currentOrder];
            reordered.splice(fromIdx, 1);
            reordered.splice(toIdx, 0, draggedColumnId);
            return { ...prev, [groupBy]: reordered };
          });
        }
        // Always return — column drags must never fall through to grouping logic.
        return;
      }

      // 2. Trip → trip: grouping
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

      // 3. Trip/group → column: assignment
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
            const newDriverId = value as string | null;
            current.driver_id = newDriverId;
            // Stage derived status immediately so the badge reflects truth.
            const derivedStatus = deriveStatusForPending(
              id,
              newDriverId,
              prev,
              trips
            );
            if (derivedStatus !== undefined) current.status = derivedStatus;
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
    [groupBy, effectiveTrips, effectiveColumns, trips]
  );

  // ── Save / Reset ────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    clearPendingChanges();
    router.refresh();
  }, [clearPendingChanges, router]);

  const handleSave = useCallback(async () => {
    if (Object.keys(pendingChanges).length === 0) return;
    setIsSaving(true);
    try {
      await Promise.all(
        Object.entries(pendingChanges).map(([id, change]) => {
          const trip = trips.find((t) => t.id === id);
          const status =
            change.status ??
            // Only derive status from driver_id when it is explicitly staged.
            // Passing driver_id=undefined (group_id-only change) must NOT trigger
            // getStatusWhenDriverChanges, because that would pass null and reset
            // an already-assigned trip back to 'pending'.
            (change.driver_id !== undefined
              ? getStatusWhenDriverChanges(
                  trip?.status ?? 'pending',
                  change.driver_id
                )
              : undefined);
          const payload: Parameters<typeof tripsService.updateTrip>[1] = {};
          if (change.driver_id !== undefined)
            payload.driver_id = change.driver_id;
          if (status !== undefined) payload.status = status;
          if (change.payer_id !== undefined) payload.payer_id = change.payer_id;
          if (change.scheduled_at !== undefined)
            payload.scheduled_at = change.scheduled_at;
          if (change.group_id !== undefined) payload.group_id = change.group_id;
          if (change.stop_order !== undefined)
            payload.stop_order = change.stop_order;
          return tripsService.updateTrip(id, payload);
        })
      );
      // Await refresh before clearing so the board never shows stale data.
      await router.refresh();
      clearPendingChanges();
    } finally {
      setIsSaving(false);
    }
  }, [pendingChanges, router, trips, clearPendingChanges]);

  const hasPendingChanges = Object.keys(pendingChanges).length > 0;

  // ── Board layout ────────────────────────────────────────────────────────────

  const header = (
    <KanbanHeader
      tripCount={effectiveTrips.length}
      groupBy={groupBy}
      onGroupByChange={setGroupBy}
      zoom={zoom}
      zoomDisplayValue={zoomDisplayValue}
      onZoomIn={zoomIn}
      onZoomOut={zoomOut}
      onZoomInputChange={setZoomInput}
      onZoomInputFocus={() => setZoomInput(zoomDisplayValue)}
      onZoomInputBlur={applyZoomInput}
      onZoomInputKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
      }}
      isExpanded={isExpanded}
      onToggleExpand={() => setIsExpanded((v) => !v)}
      hasPendingChanges={hasPendingChanges}
      isSaving={isSaving}
      onSave={handleSave}
      onReset={handleReset}
    />
  );

  const boardArea = isFormDataLoading ? (
    <div className='text-muted-foreground flex min-h-[260px] min-w-0 flex-1 items-center justify-center'>
      Laden…
    </div>
  ) : (
    <div className='min-h-0 min-w-0 flex-1 overflow-auto'>
      {/* pointerWithin prefers smaller droppables (trip cards) over columns. */}
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
                activeDragId={activeDragId}
                onTimeChange={onTimeChange}
                onStopOrderChange={onStopOrderChange}
                onUngroup={onUngroup}
              />
            );
          })}
        </div>

        {/*
         * DragOverlay must be fully controlled by dnd-kit for cursor tracking.
         * Do NOT add a transform style here — it overrides dnd-kit's own
         * translate3d that follows the pointer.
         * Instead, we zoom the inner content wrapper so the preview card
         * matches the board's visual scale.
         */}
        <DragOverlay dropAnimation={null}>
          {activeDragId ? (
            <div style={{ zoom }}>
              <KanbanDragPreview
                activeId={activeDragId}
                effectiveTrips={effectiveTrips}
                groupLabels={groupLabels}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );

  const boardContent = (
    <>
      {header}
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
