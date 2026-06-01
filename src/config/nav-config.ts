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
      },
      {
        title: 'Visão do Time',
        url: '/dashboard/team',
        icon: 'usersGroup',
        shortcut: ['t', 't'],
        isActive: false,
        items: [],
        minRank: 1
      },
      {
        title: 'Reembolsos',
        url: '/dashboard/reembolsos',
        icon: 'receipt',
        shortcut: ['r', 'r'],
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
      },
      {
        title: 'Controle de Reembolsos',
        url: '/dashboard/reembolsos/controle',
        icon: 'receipt',
        shortcut: ['c', 'r'],
        isActive: false,
        items: [],
        minRank: 3
      }
    ]
  }
];
