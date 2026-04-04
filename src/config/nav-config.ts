import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: '',
    items: [
     {
        title: 'Trips',
        url: '/dashboard/trips',
        icon: 'mapPin',
        shortcut: ['t', 't'],
        isActive: false,
        items: []
      },
      {
        title: 'Chat',
        url: '/dashboard/chat',
        icon: 'chat',
        shortcut: ['c', 'c'],
        isActive: false,
        items: []
      },

            {
        title: 'Dashboard',
        url: '/dashboard/overview',
        icon: 'dashboard',
        isActive: false,
        shortcut: ['d', 'd'],
        items: []
      },
 
      {
        title: 'Rewards',
        url: '/dashboard/rewards',
        icon: 'wallet',
        shortcut: ['m', 'p'],
        isActive: false,
        items: []
      }
    ]
  }
];
