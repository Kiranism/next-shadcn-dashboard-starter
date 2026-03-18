import { NavItem } from '@/types';

/**
 * Navigation configuration
 * Used by sidebar and Cmd+K bar.
 */
export const navItems: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard/overview',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Fahrten',
    url: '/dashboard/trips',
    icon: 'trips',
    shortcut: ['t', 't'],
    isActive: false,
    items: []
  },
  {
    title: 'Account',
    url: '#',
    icon: 'account',
    isActive: true,
    items: [
      {
        title: 'Fahrgäste',
        url: '/dashboard/clients',
        icon: 'teams',
        shortcut: ['f', 'f']
      },
      {
        title: 'Fahrer',
        url: '/dashboard/drivers',
        icon: 'user',
        shortcut: ['f', 'a']
      },
      {
        title: 'Kostenträger',
        url: '/dashboard/payers',
        icon: 'billing',
        shortcut: ['k', 'k']
      }
    ]
  }
];
