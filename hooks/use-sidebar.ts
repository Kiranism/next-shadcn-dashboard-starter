import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { produce } from 'immer';

type SidebarSettings = { isHoverOpen: boolean };
type SidebarStore = {
  isOpen: boolean;
  isHover: boolean;
  settings: SidebarSettings;
  toggleOpen: () => void;
  setIsHover: (isHover: boolean) => void;
  setIsOpen: (isOpen: boolean) => void;
  getIsOpenState: () => boolean;
  setSettings: (settings: Partial<SidebarSettings>) => void;
};

export const useSidebar = create(
  persist<SidebarStore>(
    (set, get) => ({
      isOpen: true,
      isHover: false,
      settings: { isHoverOpen: true, test: false },
      toggleOpen: () => {
        set({ isOpen: !get().isOpen });
      },
      setIsOpen: (isOpen: boolean) => {
        set({ isOpen });
      },
      setIsHover: (isHover: boolean) => {
        set({ isHover });
      },
      getIsOpenState: () => {
        const state = get();
        return state.isOpen || (state.settings.isHoverOpen && state.isHover);
      },
      setSettings: (settings: Partial<SidebarSettings>) => {
        set(
          produce((state: SidebarStore) => {
            state.settings = { ...state.settings, ...settings };
          })
        );
      }
    }),
    {
      name: 'sidebar',
      storage: createJSONStorage(() => localStorage)
    }
  )
);
