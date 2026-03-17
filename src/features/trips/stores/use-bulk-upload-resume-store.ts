import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface BulkUploadResumeState {
  /** Trip IDs that still need client resolution. */
  tripIds: string[];
  /** Current wizard position within the (rehydrated) unresolved list. */
  currentIndex: number;
  /** Which address to use as the home address when creating a client. */
  homeAddressChoice: 'pickup' | 'dropoff';
  /** ISO timestamp of when this session was started – informational only. */
  createdAt: string | null;

  /** Start a new resume session, replacing any previous one. */
  start: (tripIds: string[]) => void;
  /** Move forward one step. */
  advance: () => void;
  /** Jump to a specific index (used when the rehydrated list is shorter). */
  setIndex: (index: number) => void;
  setHomeAddressChoice: (choice: 'pickup' | 'dropoff') => void;
  /** Wipe all persisted state (called on completion or discard). */
  clear: () => void;
}

const initialState = {
  tripIds: [] as string[],
  currentIndex: 0,
  homeAddressChoice: 'pickup' as const,
  createdAt: null as string | null
};

export const useBulkUploadResumeStore = create<BulkUploadResumeState>()(
  persist(
    (set) => ({
      ...initialState,

      start: (tripIds) =>
        set({
          tripIds,
          currentIndex: 0,
          homeAddressChoice: 'pickup',
          createdAt: new Date().toISOString()
        }),

      advance: () => set((s) => ({ currentIndex: s.currentIndex + 1 })),

      setIndex: (index) => set({ currentIndex: index }),

      setHomeAddressChoice: (choice) => set({ homeAddressChoice: choice }),

      clear: () => set({ ...initialState })
    }),
    {
      name: 'bulk-upload-resolve-wizard'
    }
  )
);

/** True when there is a non-empty resume session stored. */
export function hasPendingResumeSession(
  state: Pick<BulkUploadResumeState, 'tripIds' | 'createdAt'>
): boolean {
  return state.tripIds.length > 0 && state.createdAt !== null;
}
