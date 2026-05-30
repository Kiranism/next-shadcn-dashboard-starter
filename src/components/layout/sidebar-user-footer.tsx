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
import { SidebarMenu, SidebarMenuButton, SidebarMenuItem } from '@/components/ui/sidebar';
import { createClient } from '@/utils/supabase/client';
import type { User } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
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
  const router = useRouter();

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
    <SidebarMenu>
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
  );
}
