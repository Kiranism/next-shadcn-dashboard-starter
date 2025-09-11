import { NavItem } from '@/types';

export type Product = {
  photo_url: string;
  name: string;
  description: string;
  created_at: string;
  price: number;
  id: number;
  category: string;
  updated_at: string;
};

//Info: The following data is used for the sidebar navigation and Cmd K bar.
export const navItems: NavItem[] = [
  {
    title: 'Обзор',
    url: '/dashboard',
    icon: 'dashboard',
    isActive: false,
    shortcut: ['d', 'd'],
    items: []
  },
  {
    title: 'Проекты',
    url: '/dashboard/projects',
    icon: 'kanban',
    isActive: false,
    shortcut: ['p', 'r'],
    items: []
  },
  {
    title: 'Бонусы',
    url: '/dashboard/bonuses',
    icon: 'bonus',
    isActive: false,
    shortcut: ['b', 'n'],
    items: []
  },
  {
    title: 'Уведомления',
    url: '/dashboard/notifications',
    icon: 'bell',
    isActive: false,
    shortcut: ['n', 'o'],
    items: []
  },
  {
    title: 'Настройки',
    url: '/dashboard/settings',
    icon: 'settings',
    isActive: false,
    shortcut: ['s', 'e'],
    items: []
  },
  {
    title: 'Биллинг',
    url: '/dashboard/billing',
    icon: 'creditCard',
    isActive: false,
    shortcut: ['b', 'i'],
    items: []
  },
  {
    title: 'Профиль',
    url: '/dashboard/profile',
    icon: 'userPen',
    isActive: false,
    shortcut: ['m', 'm'],
    items: []
  }
];

export interface SaleUser {
  id: number;
  name: string;
  email: string;
  amount: string;
  image: string;
  initials: string;
}

export const recentSalesData: SaleUser[] = [
  {
    id: 1,
    name: 'Ольга Мартина',
    email: 'olivia.martin@email.com',
    amount: '+1,999₽',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'ОМ'
  },
  {
    id: 2,
    name: 'Джексон Ли',
    email: 'jackson.lee@email.com',
    amount: '+39₽',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'ДЛ'
  },
  {
    id: 3,
    name: 'Изабелла Нгуен',
    email: 'isabella.nguyen@email.com',
    amount: '+299₽',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'ИН'
  },
  {
    id: 4,
    name: 'Вильям Ким',
    email: 'will@email.com',
    amount: '+99₽',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'ВК'
  },
  {
    id: 5,
    name: 'София Дэвис',
    email: 'sofia.davis@email.com',
    amount: '+39₽',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'СД'
  }
];
