import { create } from 'zustand';
// import { persist } from 'zustand/middleware';
import type {
  NotificationStatus,
  NotificationAction
} from '@/components/ui/notification-card';

export type Notification = {
  id: string;
  title: string;
  body: string;
  status: NotificationStatus;
  createdAt: string;
  actions?: NotificationAction[];
};

type NotificationState = {
  notifications: Notification[];
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  addNotification: (notification: Omit<Notification, 'status'>) => void;
  unreadCount: () => number;
};

const mockNotifications: Notification[] = [
  {
    id: '1',
    title: 'New team member joined',
    body: 'Sarah Connor has joined the Engineering workspace.',
    status: 'unread',
    createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    actions: [
      { id: 'view', label: 'View profile', type: 'redirect', style: 'primary' }
    ]
  },
  {
    id: '2',
    title: 'Product update published',
    body: 'Version 2.4.0 has been deployed to production successfully.',
    status: 'unread',
    createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString()
  },
  {
    id: '3',
    title: 'Subscription renewed',
    body: 'Your Pro plan has been renewed for another month.',
    status: 'unread',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    actions: [
      {
        id: 'billing',
        label: 'View invoice',
        type: 'redirect',
        style: 'primary'
      }
    ]
  },
  {
    id: '4',
    title: 'Task assigned to you',
    body: 'You have been assigned "Update dashboard analytics" in the Kanban board.',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    actions: [
      { id: 'open', label: 'Open task', type: 'redirect', style: 'primary' }
    ]
  },
  {
    id: '5',
    title: 'Weekly report ready',
    body: 'Your weekly analytics report is ready for review.',
    status: 'read',
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString()
  }
];

export const useNotificationStore = create<NotificationState>()(
  // To enable persistence across refreshes, uncomment the persist wrapper below:
  // persist(
  (set, get) => ({
    notifications: mockNotifications,

    markAsRead: (id) =>
      set((state) => ({
        notifications: state.notifications.map((n) =>
          n.id === id ? { ...n, status: 'read' as const } : n
        )
      })),

    markAllAsRead: () =>
      set((state) => ({
        notifications: state.notifications.map((n) => ({
          ...n,
          status: 'read' as const
        }))
      })),

    removeNotification: (id) =>
      set((state) => ({
        notifications: state.notifications.filter((n) => n.id !== id)
      })),

    addNotification: (notification) =>
      set((state) => ({
        notifications: [
          { ...notification, status: 'unread' as const },
          ...state.notifications
        ]
      })),

    unreadCount: () =>
      get().notifications.filter((n) => n.status === 'unread').length
  })
  //   ,
  //   { name: 'notifications' }
  // )
);
