import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { localStorageAdapter, STORAGE_KEYS } from '@/lib/kanban-local-storage';

/**
 * Zustand store for Kanban pending changes. Persisted to localStorage so all
 * changes survive view switch, reload, and accidental close until "Speichern".
 *
 * Holds: driver_id, status, payer_id, scheduled_at, group_id, stop_order.
 * User clicks "Speichern" to persist to DB; "Verwerfen" clears the store.
 */

/** Pending change for a single trip; staged until Save is applied. */
export type KanbanPendingChange = {
  driver_id?: string | null;
  status?: string;
  payer_id?: string | null;
  scheduled_at?: string | null;
  group_id?: string | null;
  stop_order?: number | null;
};

export interface KanbanPendingState {
  /** Trip ID → pending changes. */
  pendingChanges: Record<string, KanbanPendingChange>;

  setPendingChanges: (
    updater:
      | Record<string, KanbanPendingChange>
      | ((
          prev: Record<string, KanbanPendingChange>
        ) => Record<string, KanbanPendingChange>)
  ) => void;

  clearPendingChanges: () => void;

  /**
   * Remove pending entries whose trip IDs are not in `ids`.
   *
   * Call this synchronously after knowing the current visible trip IDs.
   * This is the primary defence against stale entries from other days
   * surviving across date-filter changes.
   */
  pruneToIds: (ids: Set<string>) => void;
}

const initialState = {
  pendingChanges: {} as Record<string, KanbanPendingChange>
};

export const useKanbanPendingStore = create<KanbanPendingState>()(
  persist(
    (set) => ({
      ...initialState,

      setPendingChanges: (updater) =>
        set((s) => ({
          pendingChanges:
            typeof updater === 'function' ? updater(s.pendingChanges) : updater
        })),

      clearPendingChanges: () => set({ pendingChanges: {} }),

      pruneToIds: (ids: Set<string>) =>
        set((s) => {
          const next: Record<string, KanbanPendingChange> = {};
          for (const [id, change] of Object.entries(s.pendingChanges)) {
            if (ids.has(id)) next[id] = change;
          }
          // Return same reference when nothing changed (avoids re-renders).
          if (
            Object.keys(next).length === Object.keys(s.pendingChanges).length
          ) {
            return s;
          }
          return { pendingChanges: next };
        })
    }),
    {
      name: STORAGE_KEYS.KANBAN_PENDING,
      storage: localStorageAdapter,
      /** Only persist serializable slice (not action functions). */
      partialize: (state) => ({ pendingChanges: state.pendingChanges }),
      /**
       * onRehydrateStorage fires synchronously after localStorage is read,
       * before the new state is merged into the store. We use it to prune
       * stale entries immediately — before any component can read them.
       *
       * The trip IDs are captured in `latestTripIds` (a module-level ref set
       * by kanban-board.tsx on every render) so this callback always has
       * access to the current visible set.
       */
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        const ids = latestTripIds;
        if (!ids || ids.size === 0) return;
        state.pruneToIds(ids);
      }
    }
  )
);

/**
 * Module-level mutable ref — updated synchronously by TripsKanbanBoard
 * on every render so the rehydration callback always has the current IDs.
 *
 * This is intentionally NOT React state; it must be readable outside any
 * React component lifecycle (inside the Zustand persist callback).
 */
export let latestTripIds: Set<string> = new Set();

/** Called by TripsKanbanBoard to keep latestTripIds up to date. */
export function syncTripIds(ids: Set<string>): void {
  latestTripIds = ids;
}
