'use client';

import { Icons } from '@/components/icons';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar
} from '@/components/ui/sidebar';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { NotificationsRepository } from '@/repositories/notifications.repository';
import { NotificationCenter } from '@/features/notifications/components/notification-center';
import { cn } from '@/lib/utils';

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

function NotificationBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  const label = count >= 10 ? '9+' : String(count);
  return (
    <span className='absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white'>
      {label}
    </span>
  );
}

function UserAvatar({
  initials,
  avatarUrl,
  size = 'md'
}: {
  initials: string;
  avatarUrl?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <Avatar className={size === 'sm' ? 'size-7' : 'size-8'}>
      <AvatarImage src={avatarUrl} alt={initials} referrerPolicy='no-referrer' />
      <AvatarFallback className='bg-primary text-primary-foreground text-xs font-semibold'>
        {initials}
      </AvatarFallback>
    </Avatar>
  );
}

export function SidebarUserFooter() {
  const [user, setUser] = useState<User | null>(null);
  const [centerOpen, setCenterOpen] = useState(false);
  const router = useRouter();
  const { state } = useSidebar();
  const isCollapsed = state === 'collapsed';

  const { data: notifications } = NotificationsRepository.useNotifications();
  const notificationCount = notifications?.length ?? 0;

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
  }, []);

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/sign-in');
  }

  const name = user?.user_metadata?.full_name ?? user?.email ?? 'Usuário';
  const email = user?.email ?? '';
  const initials = getInitials(name);
  const avatarUrl = user?.user_metadata?.avatar_url as string | undefined;

  return (
    <>
      <NotificationCenter open={centerOpen} onOpenChange={setCenterOpen} />

      <SidebarMenu>
        {/* Notification bell button */}
        <SidebarMenuItem>
          <SidebarMenuButton
            tooltip='Notificações'
            onClick={() => setCenterOpen(true)}
            className='relative'
          >
            <span className='relative inline-flex'>
              <Icons.notification className='size-4' />
              <NotificationBadge count={notificationCount} />
            </span>
            <span>Notificações</span>
            {notificationCount > 0 && (
              <span
                className={cn(
                  'ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-white',
                  !isCollapsed ? 'flex' : 'hidden'
                )}
              >
                {notificationCount >= 10 ? '9+' : notificationCount}
              </span>
            )}
          </SidebarMenuButton>
        </SidebarMenuItem>

        {/* User avatar with dropdown */}
        <SidebarMenuItem>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <SidebarMenuButton
                size='lg'
                className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
              >
                <UserAvatar initials={initials} avatarUrl={avatarUrl} />
                <div className='grid flex-1 text-left text-sm leading-tight'>
                  <span className='truncate font-semibold'>{name}</span>
                  <span className='text-muted-foreground truncate text-xs'>{email}</span>
                </div>
                <Icons.chevronsDown className='ml-auto size-4' />
              </SidebarMenuButton>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className='w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg'
              side='top'
              align='end'
              sideOffset={4}
            >
              <DropdownMenuLabel className='p-0 font-normal'>
                <div className='flex items-center gap-2 px-1 py-1.5 text-left text-sm'>
                  <UserAvatar initials={initials} avatarUrl={avatarUrl} size='sm' />
                  <div className='grid flex-1 text-left text-sm leading-tight'>
                    <span className='truncate font-semibold'>{name}</span>
                    <span className='text-muted-foreground truncate text-xs'>{email}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <Icons.logout className='mr-2 h-4 w-4' />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </SidebarMenuItem>
      </SidebarMenu>
    </>
  );
}
