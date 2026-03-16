'use client';

import { create } from 'zustand';

interface PassengerSearchState {
  open: boolean;
  selectedClientId: string | null;
  openSearch: (clientId?: string | null) => void;
  closeSearch: () => void;
}

export const usePassengerSearchStore = create<PassengerSearchState>((set) => ({
  open: false,
  selectedClientId: null,
  openSearch: (clientId) =>
    set({
      open: true,
      selectedClientId: clientId ?? null
    }),
  closeSearch: () =>
    set({
      open: false,
      selectedClientId: null
    })
}));
