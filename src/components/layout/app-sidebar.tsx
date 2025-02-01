'use client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar
} from '@/components/ui/sidebar';
import { navItems } from '@/constants/data';
import { cn } from '@/lib/utils';
import {
  BadgeCheck,
  Bell,
  ChevronRight,
  ChevronsUpDown,
  ClipboardCheck,
  ClipboardList,
  CreditCard,
  GalleryVerticalEnd,
  LayoutDashboard,
  ListVideo,
  LogOut,
  User,
  CircuitBoardIcon
} from 'lucide-react';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';
import { Icons } from '../icons';

export const company = {
  name: 'Acme Inc',
  logo: GalleryVerticalEnd,
  plan: 'Enterprise'
};

export default function AppSidebar() {
  const { data: session } = useSession();
  const { open } = useSidebar();
  const pathname = usePathname();

  // 图标映射
  const iconMap: { [key: string]: React.ElementType } = {
    home: LayoutDashboard,
    play: ListVideo,
    list: ClipboardList,
    check: ClipboardCheck,
    user: User
  };

  // Filter navigation items based on user role
  const filteredNavItems = navItems.filter(item => {
    if (!session?.user) return false;
    if (session.user.isAdmin) return true;
    return !item.adminOnly;
  });

  return (
    <Sidebar>
      <SidebarHeader>
        <Link href='/'>
          <div className='flex items-center gap-2 px-4'>
            <CircuitBoardIcon className='h-6 w-6' />
            <span className='text-lg font-semibold'>控制面板</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {filteredNavItems.map((item) => {
            const Icon = iconMap[item.icon!] || CircuitBoardIcon;
            return (
              <Link key={item.title} href={item.url}>
                <SidebarMenuButton
                  className={cn(
                    'w-full',
                    pathname === item.url && 'bg-accent'
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </Link>
            );
          })}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter>
        <div className='flex w-full items-center justify-between p-4'>
          <div className='flex flex-1 items-center gap-4 overflow-hidden'>
            <Avatar className='h-8 w-8'>
              <AvatarImage
                src={session?.user?.image ?? ''}
                alt={session?.user?.username ?? ''}
              />
              <AvatarFallback>
                {session?.user?.username?.[0]}
              </AvatarFallback>
            </Avatar>
            {open && (
              <div className='overflow-hidden'>
                <div className='text-sm font-medium leading-none'>
                  {session?.user?.username}
                </div>
                <div className='text-xs text-muted-foreground'>
                  {session?.user?.isAdmin ? '管理员' : '普通用户'}
                </div>
              </div>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
