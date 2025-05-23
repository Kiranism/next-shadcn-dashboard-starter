import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { IUser } from '@/types/common.types';

interface UserState {
  currentUser: IUser | null;
  token: string | null;
  hasHydrated: boolean;
  setCurrentUser: (user: IUser | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  setHasHydrated: (state: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      currentUser: null,
      token: null,
      hasHydrated: false,
      setToken: (token) => set({ token }),
      setCurrentUser: (user) => set({ currentUser: user }),
      logout: () => set({ currentUser: null, token: null }),
      setHasHydrated: (state) => set({ hasHydrated: state })
    }),
    {
      name: 'yes-jobs',
      storage: createJSONStorage(() => localStorage),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      }
    }
  )
);
