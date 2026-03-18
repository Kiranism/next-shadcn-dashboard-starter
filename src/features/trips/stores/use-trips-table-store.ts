import { create } from 'zustand';
import type { Table, VisibilityState } from '@tanstack/react-table';

interface TripsTableStore {
  table: Table<any> | null;
  columnVisibility: VisibilityState;
  setTable: (table: Table<any> | null) => void;
  setColumnVisibility: (visibility: VisibilityState) => void;
}

export const useTripsTableStore = create<TripsTableStore>((set) => ({
  table: null,
  columnVisibility: {},
  setTable: (table) => set({ table }),
  setColumnVisibility: (columnVisibility) => set({ columnVisibility })
}));
