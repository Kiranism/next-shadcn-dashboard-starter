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

function InitialsAvatar({ initials, size = 'md' }: { initials: string; size?: 'sm' | 'md' }) {
  return (
    <div
      className={`bg-primary text-primary-foreground flex shrink-0 items-center justify-center rounded-full font-semibold ${size === 'sm' ? 'size-7 text-[10px]' : 'size-8 text-xs'}`}
    >
      {initials}
    </div>
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

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size='lg'
              className='data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground'
            >
              <InitialsAvatar initials={initials} />
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
                <InitialsAvatar initials={initials} size='sm' />
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
