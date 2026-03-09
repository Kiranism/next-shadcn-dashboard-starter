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
    title: 'Fahrgäste',
    url: '/dashboard/clients',
    icon: 'teams',
    shortcut: ['f', 'f'],
    isActive: false,
    items: []
  },
  {
    title: 'Kostenträger',
    url: '/dashboard/payers',
    icon: 'billing',
    shortcut: ['k', 'k'],
    isActive: false,
    items: []
  },
  {
    title: 'Product',
    url: '/dashboard/product',
    icon: 'product',
    shortcut: ['p', 'p'],
    isActive: false,
    items: []
  },
  {
    title: 'Kanban',
    url: '/dashboard/kanban',
    icon: 'kanban',
    shortcut: ['k', 'k'],
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
        title: 'Login',
        shortcut: ['l', 'l'],
        url: '/auth/sign-in',
        icon: 'login'
      }
    ]
  }
];
