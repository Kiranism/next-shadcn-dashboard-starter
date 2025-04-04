import { NavItem } from 'types';

// Info: Navigation for the medical practice management application
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
    title: 'Patients',
    url: '/dashboard/patients',
    icon: 'dashboard',
    shortcut: ['p', 'p'],
    isActive: false,
    items: []
  },
  {
    title: 'Appointments',
    url: '/dashboard/appointments',
    icon: 'calendar',
    shortcut: ['a', 'a'],
    isActive: false,
    items: []
  },
  {
    title: 'Billing',
    url: '/dashboard/billing',
    icon: 'billing',
    shortcut: ['b', 'b'],
    isActive: false,
    items: []
  },
  {
    title: 'Medical Records',
    url: '/dashboard/medical-records',
    icon: 'dashboard',
    shortcut: ['m', 'r'],
    isActive: false,
    items: []
  },
  {
    title: 'Account',
    url: '#',
    icon: 'user',
    isActive: true,
    items: [
      {
        title: 'Profile',
        url: '/dashboard/profile',
        icon: 'userPen',
        shortcut: ['m', 'm']
      },
      {
        title: 'Logout',
        shortcut: ['l', 'l'],
        url: '/logout',
        icon: 'dashboard'
      }
    ]
  }
];
