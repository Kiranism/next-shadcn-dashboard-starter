import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Module {
  id: string;
  name: string;
  status: 'active' | 'beta' | 'coming-soon';
}

interface PortalState {
  // User preferences
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (collapsed: boolean) => void;
  
  // Active module tracking
  activeModule: string | null;
  setActiveModule: (moduleId: string | null) => void;
  
  // Recent activity
  recentModules: string[];
  addRecentModule: (moduleId: string) => void;
  
  // Search state
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  
  // Notifications
  notifications: Array<{
    id: string;
    type: 'info' | 'warning' | 'error' | 'success';
    message: string;
    read: boolean;
  }>;
  addNotification: (notification: Omit<PortalState['notifications'][0], 'id' | 'read'>) => void;
  markNotificationRead: (id: string) => void;
  clearNotifications: () => void;
  
  // Module filters
  moduleFilters: {
    status: ('active' | 'beta' | 'coming-soon')[];
    search: string;
  };
  setModuleFilters: (filters: Partial<PortalState['moduleFilters']>) => void;
  
  // Dashboard preferences
  dashboardLayout: 'grid' | 'list';
  setDashboardLayout: (layout: 'grid' | 'list') => void;
  
  // Command palette state
  commandPaletteOpen: boolean;
  setCommandPaletteOpen: (open: boolean) => void;
}

export const usePortalStore = create<PortalState>()(
  persist(
    (set, get) => ({
      // User preferences
      sidebarCollapsed: false,
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      
      // Active module tracking
      activeModule: null,
      setActiveModule: (moduleId) => set({ activeModule: moduleId }),
      
      // Recent activity
      recentModules: [],
      addRecentModule: (moduleId) => {
        const { recentModules } = get();
        const filtered = recentModules.filter((id) => id !== moduleId);
        set({ recentModules: [moduleId, ...filtered].slice(0, 5) });
      },
      
      // Search state
      searchQuery: '',
      setSearchQuery: (query) => set({ searchQuery: query }),
      
      // Notifications
      notifications: [],
      addNotification: (notification) => {
        const newNotification = {
          ...notification,
          id: `${Date.now()}-${Math.random()}`,
          read: false,
        };
        set((state) => ({
          notifications: [newNotification, ...state.notifications],
        }));
      },
      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((notif) =>
            notif.id === id ? { ...notif, read: true } : notif
          ),
        }));
      },
      clearNotifications: () => set({ notifications: [] }),
      
      // Module filters
      moduleFilters: {
        status: [],
        search: '',
      },
      setModuleFilters: (filters) => {
        set((state) => ({
          moduleFilters: { ...state.moduleFilters, ...filters },
        }));
      },
      
      // Dashboard preferences
      dashboardLayout: 'grid',
      setDashboardLayout: (layout) => set({ dashboardLayout: layout }),
      
      // Command palette state
      commandPaletteOpen: false,
      setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
    }),
    {
      name: 'amt-portal-storage',
      partialize: (state) => ({
        sidebarCollapsed: state.sidebarCollapsed,
        recentModules: state.recentModules,
        dashboardLayout: state.dashboardLayout,
        moduleFilters: state.moduleFilters,
      }),
    }
  )
);
