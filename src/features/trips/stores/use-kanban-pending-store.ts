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

/** Pending change for a single trip; staged until Save (or persist-on-drop) is applied. */
export type KanbanPendingChange = {
  driver_id?: string | null;
  status?: string;
  payer_id?: string | null;
  scheduled_at?: string | null;
  group_id?: string | null;
  stop_order?: number | null;
};

export interface KanbanPendingState {
  /** Trip ID → pending changes. Assignments and grouping persist on drop; this holds scheduled_at etc. */
  pendingChanges: Record<string, KanbanPendingChange>;

  setPendingChanges: (
    updater:
      | Record<string, KanbanPendingChange>
      | ((
          prev: Record<string, KanbanPendingChange>
        ) => Record<string, KanbanPendingChange>)
  ) => void;
  clearPendingChanges: () => void;
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

      clearPendingChanges: () => set({ pendingChanges: {} })
    }),
    {
      name: STORAGE_KEYS.KANBAN_PENDING,
      storage: localStorageAdapter,
      /** Only persist serializable slice (not action functions). */
      partialize: (state) => ({ pendingChanges: state.pendingChanges })
    }
  )
);
