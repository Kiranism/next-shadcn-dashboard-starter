'use client';

/**
 * Driver app header — burger menu with logout.
 *
 * Used in /driver/* layout. Mobile-first, minimal UI.
 * No sidebar; drivers get a compact header with sign-out.
 */

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { createClient } from '@/lib/supabase/client';
import { IconLogout, IconMenu2 } from '@tabler/icons-react';
import { useRouter } from 'next/navigation';

export function DriverHeader() {
  const router = useRouter();

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/sign-in');
    router.refresh();
  };

  return (
    <header className='flex h-14 shrink-0 items-center justify-between border-b px-4'>
      <h1 className='text-foreground text-lg font-semibold'>TaxiGo Fahrer</h1>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' size='icon' aria-label='Menü öffnen'>
            <IconMenu2 className='h-6 w-6' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' side='bottom' className='min-w-48'>
          <DropdownMenuItem onClick={handleSignOut}>
            <IconLogout className='mr-2 h-4 w-4' />
            Abmelden
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
