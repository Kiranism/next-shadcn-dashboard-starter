/**
 * Zustand store for driver form sheet state.
 *
 * Used by driver-management: table view (cell-action opens edit),
 * create button (opens create), DriverForm sheet.
 */

import type { DriverWithProfile } from '../types';
import { create } from 'zustand';

type DriverFormStore = {
  isOpen: boolean;
  mode: 'create' | 'edit';
  driver: DriverWithProfile | null;
  refreshTrigger: number;
  openForCreate: () => void;
  openForEdit: (driver: DriverWithProfile) => void;
  close: () => void;
  notifySuccess: () => void;
};

export const useDriverFormStore = create<DriverFormStore>((set) => ({
  isOpen: false,
  mode: 'create',
  driver: null,
  refreshTrigger: 0,
  openForCreate: () => set({ isOpen: true, mode: 'create', driver: null }),
  openForEdit: (driver) => set({ isOpen: true, mode: 'edit', driver }),
  close: () => set({ isOpen: false, driver: null }),
  notifySuccess: () => set((s) => ({ refreshTrigger: s.refreshTrigger + 1 }))
}));
