/**
 * Driver app layout — mobile-first, no sidebar, no KBar.
 * Uses safe-area-inset for notched devices.
 * Redirects admins to dashboard (driver routes are for drivers only).
 */

import { DriverHeader } from '@/features/driver-portal/components/driver-header';
import { createClient } from '@/lib/supabase/server';
import type { Metadata } from 'next';
import { redirect } from 'next/navigation';

export const metadata: Metadata = {
  title: 'TaxiGo Fahrer',
  description: 'Schicht-Tracking für Fahrer',
  robots: { index: false, follow: false }
};

export default async function DriverLayout({
  children
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (user) {
    const { data: profile } = await supabase
      .from('accounts')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'driver') {
      redirect('/dashboard/overview');
    }
  }

  return (
    <div className='bg-background min-h-dvh min-h-screen pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)] pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)]'>
      <main className='mx-auto flex min-h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] max-w-lg flex-col'>
        <DriverHeader />
        {children}
      </main>
    </div>
  );
}
