'use client';

/**
 * @file: src/components/layout/super-admin-sidebar.tsx
 * @description: Sidebar для панели супер-администратора
 * @project: SaaS Bonus System
 * @dependencies: Next.js, shadcn/ui sidebar
 * @created: 2025-01-30
 * @author: AI Assistant
 */

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail
} from '@/components/ui/sidebar';
import { Logo } from '@/components/ui/logo';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Bot,
  FolderKanban,
  CreditCard,
  AlertTriangle,
  Settings,
  LogOut
} from 'lucide-react';
const navItems = [
  {
    title: 'Dashboard',
    url: '/super-admin',
    icon: LayoutDashboard
  },
  {
    title: 'Пользователи',
    url: '/super-admin/users',
    icon: Users
  },
  {
    title: 'Боты',
    url: '/super-admin/bots',
    icon: Bot
  },
  {
    title: 'Проекты',
    url: '/super-admin/projects',
    icon: FolderKanban
  },
  {
    title: 'Подписки',
    url: '/super-admin/subscriptions',
    icon: CreditCard
  },
  {
    title: 'Ошибки',
    url: '/super-admin/errors',
    icon: AlertTriangle
  },
  {
    title: 'Настройки',
    url: '/super-admin/settings',
    icon: Settings
  }
];

export default function SuperAdminSidebar() {
  const pathname = usePathname();

  const handleLogout = async () => {
    await fetch('/api/super-admin/auth/logout', { method: 'POST' });
    window.location.href = '/super-admin/login';
  };

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size='lg' asChild>
              <Link href='/super-admin'>
                <div className='bg-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg'>
                  <Logo className='size-4 text-white' width={16} height={16} />
                </div>
                <div className='flex flex-col gap-0.5 leading-none'>
                  <span className='font-semibold'>Супер-админка</span>
                  <span className='text-xs'>Управление системой</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Навигация</SidebarGroupLabel>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.url;
              return (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={isActive}>
                    <Link href={item.url}>
                      <Icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip='Выйти'
              className='w-full'
              onClick={handleLogout}
            >
              <LogOut />
              <span>Выйти</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
