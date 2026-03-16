import { create } from 'zustand';

interface CreateTripDialogState {
  open: boolean;
  /**
   * Optional client preset when opening the dialog from Cmd+K
   * (e.g. \"Neue Fahrt für [Name]\").
   */
  preselectedClientId: string | null;
  openDialog: (options?: { clientId?: string | null }) => void;
  closeDialog: () => void;
}

export const useCreateTripDialogStore = create<CreateTripDialogState>(
  (set) => ({
    open: false,
    preselectedClientId: null,
    openDialog: (options) =>
      set({
        open: true,
        preselectedClientId: options?.clientId ?? null
      }),
    closeDialog: () =>
      set({
        open: false,
        preselectedClientId: null
      })
  })
);
