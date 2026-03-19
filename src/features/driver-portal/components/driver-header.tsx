'use client';

/**
 * DriverHeader — mobile-first header for the driver portal.
 *
 * Features:
 *  - App title / logo area
 *  - Burger menu button → slides open a Sheet drawer from the left
 *  - Sheet contains: navigation links + sign-out
 *
 * Navigation items:
 *  - Startseite (/driver/startseite)
 *  - Touren     (/driver/touren)
 *  - Schichtenzettel (/driver/shift)
 *
 * Active route is highlighted using usePathname().
 * Each nav item has a 48 px minimum tap-target for comfortable thumb use.
 */

import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';
import { createClient } from '@/lib/supabase/client';
import { cn } from '@/lib/utils';
import {
  IconCalendarEvent,
  IconHome,
  IconList,
  IconLogout,
  IconMenu2
} from '@tabler/icons-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState } from 'react';

// ---------------------------------------------------------------------------
// Nav item definition
// ---------------------------------------------------------------------------

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/driver/startseite',
    label: 'Startseite',
    icon: IconHome
  },
  {
    href: '/driver/touren',
    label: 'Touren',
    icon: IconList
  },
  {
    href: '/driver/shift',
    label: 'Schichtenzettel',
    icon: IconCalendarEvent
  }
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Derive the display title for the current route. */
function getPageTitle(pathname: string): string {
  if (pathname.startsWith('/driver/touren')) return 'Touren';
  if (pathname.startsWith('/driver/shift')) return 'Schichtenzettel';
  return 'Startseite';
}

export function DriverHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const pageTitle = getPageTitle(pathname);

  /**
   * Sign out the current user and redirect to sign-in.
   */
  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/auth/sign-in');
    router.refresh();
  };

  return (
    <>
      {/* ------------------------------------------------------------------ */}
      {/* Top header bar                                                       */}
      {/* ------------------------------------------------------------------ */}
      <header className='flex h-14 shrink-0 items-center justify-between border-b px-4'>
        <Link href='/driver/startseite' className='flex items-center gap-2'>
          <span className='text-foreground text-lg font-semibold'>
            {pageTitle}
          </span>
        </Link>

        <Button
          variant='ghost'
          size='icon'
          aria-label='Menü öffnen'
          onClick={() => setOpen(true)}
        >
          <IconMenu2 className='h-6 w-6' />
        </Button>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/* Slide-in navigation drawer                                          */}
      {/* ------------------------------------------------------------------ */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side='left' className='flex w-72 flex-col p-0'>
          {/* Drawer header */}
          <SheetHeader className='border-b px-6 py-5'>
            <SheetTitle className='text-left text-base font-semibold'>
              TaxiGo Fahrer
            </SheetTitle>
          </SheetHeader>

          {/* Navigation links */}
          <nav
            className='flex flex-1 flex-col gap-1 px-3 py-4'
            aria-label='Hauptnavigation'
          >
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive =
                pathname === href || pathname.startsWith(href + '/');
              return (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    // Base styles — generous touch target for mobile
                    'flex min-h-[48px] items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className='h-5 w-5 shrink-0' />
                  {label}
                </Link>
              );
            })}
          </nav>

          {/* Bottom section: divider + sign-out */}
          <div className='border-t px-3 py-4'>
            <button
              type='button'
              onClick={() => void handleSignOut()}
              className='text-muted-foreground hover:text-destructive flex min-h-[48px] w-full items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-colors hover:bg-red-50 dark:hover:bg-red-950/30'
            >
              <IconLogout className='h-5 w-5 shrink-0' />
              Abmelden
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
