import { NavItem } from 'types';

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
    title: '概览',
    url: '/dashboard',
    icon: 'home',
    isActive: false,
    shortcut: ['d', 'd'],
    items: [],
    adminOnly: true
  },
  {
    title: '视频',
    url: '/dashboard/videos',
    icon: 'play',
    shortcut: ['v', 'v'],
    isActive: false,
    items: [],
    adminOnly: false
  },
  {
    title: '任务队列',
    url: '/dashboard/tasks',
    icon: 'list',
    shortcut: ['t', 't'],
    isActive: false,
    items: [],
    adminOnly: true
  },
  {
    title: '我的任务',
    url: '/dashboard/my-tasks',
    icon: 'check',
    shortcut: ['m', 't'],
    isActive: false,
    items: [],
    adminOnly: false
  },
  {
    title: '个人信息',
    url: '/dashboard/profile',
    icon: 'user',
    shortcut: ['p', 'p'],
    isActive: false,
    items: [],
    adminOnly: false
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
    name: 'Olivia Martin',
    email: 'olivia.martin@email.com',
    amount: '+$1,999.00',
    image: 'https://api.slingacademy.com/public/sample-users/1.png',
    initials: 'OM'
  },
  {
    id: 2,
    name: 'Jackson Lee',
    email: 'jackson.lee@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/2.png',
    initials: 'JL'
  },
  {
    id: 3,
    name: 'Isabella Nguyen',
    email: 'isabella.nguyen@email.com',
    amount: '+$299.00',
    image: 'https://api.slingacademy.com/public/sample-users/3.png',
    initials: 'IN'
  },
  {
    id: 4,
    name: 'William Kim',
    email: 'will@email.com',
    amount: '+$99.00',
    image: 'https://api.slingacademy.com/public/sample-users/4.png',
    initials: 'WK'
  },
  {
    id: 5,
    name: 'Sofia Davis',
    email: 'sofia.davis@email.com',
    amount: '+$39.00',
    image: 'https://api.slingacademy.com/public/sample-users/5.png',
    initials: 'SD'
  }
];
