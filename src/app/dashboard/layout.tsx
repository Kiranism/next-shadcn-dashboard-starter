import KBar from '@/components/kbar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { InfoSidebar } from '@/components/layout/info-sidebar';
import { InfobarProvider } from '@/components/ui/infobar';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { auth } from '@clerk/nextjs/server';
import type { Metadata } from 'next';
import type { CSSProperties } from 'react';
import { cookies } from 'next/headers';

export const metadata: Metadata = {
  title: 'Next Shadcn Dashboard Starter',
  description: 'Basic dashboard with Next.js and Shadcn',
  robots: {
    index: false,
    follow: false
  }
};

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  // Defense in depth: every /dashboard page also calls auth.protect() itself,
  // because layouts don't always re-render when pages do (Clerk guidance).
  await auth.protect();
  // Persisting the sidebar state in the cookie.
  const cookieStore = await cookies();
  const defaultOpen = cookieStore.get('sidebar_state')?.value === 'true';
  return (
    <KBar>
      {/* Fixed-height shell: the sidebar sits on the --sidebar canvas and the page is an
          inset panel with a single scroller, so nothing needs calc(100vh - header) maths.
          The 2.375rem icon rail leaves 12px either side of the 32px icons. */}
      <SidebarProvider
        defaultOpen={defaultOpen}
        className='h-dvh'
        style={{ '--sidebar-width-icon': '2.375rem' } as CSSProperties}
      >
        <a
          href='#main-content'
          className='bg-background ring-ring sr-only rounded-md px-3 py-2 text-sm font-medium shadow focus:not-sr-only focus:absolute focus:top-2 focus:start-2 focus:z-50 focus:ring-2'
        >
          Skip to content
        </a>
        <AppSidebar />
        <SidebarInset
          id='main-content'
          tabIndex={-1}
          className='md:ring-foreground/10 min-h-0 min-w-0 overflow-hidden outline-none md:ring-1'
        >
          <Header />
          <InfobarProvider defaultOpen={false} className='min-h-0'>
            <div
              data-slot='page-scroller'
              className='flex min-h-0 min-w-0 flex-1 flex-col overflow-x-hidden overflow-y-auto'
            >
              {children}
            </div>
            <InfoSidebar side='right' />
          </InfobarProvider>
        </SidebarInset>
      </SidebarProvider>
    </KBar>
  );
}
