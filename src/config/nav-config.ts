import { NavGroup } from '@/types';

export const navGroups: NavGroup[] = [
  {
    label: 'Aplicação',
    items: [
      {
        title: 'Individual',
        url: '/dashboard/individual',
        icon: 'user2',
        shortcut: ['i', 'i'],
        isActive: false,
        items: []
      },
      {
        title: 'Ponto Eletrônico',
        url: '/dashboard/ponto',
        icon: 'clock',
        shortcut: ['p', 'p'],
        isActive: false,
        items: []
      }
    ]
  },
  {
    label: 'Administração',
    minRank: 3,
    items: [
      {
        title: 'Usuários',
        url: '/dashboard/users',
        icon: 'teams',
        shortcut: ['u', 'u'],
        isActive: false,
        items: [],
        minRank: 3
      }
    ]
  }
];
