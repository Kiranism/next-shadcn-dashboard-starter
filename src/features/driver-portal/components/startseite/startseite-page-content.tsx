'use client';

/**
 * StartseitePageContent — Startseite (home) page orchestrator.
 *
 * Layout (single column, mobile-first):
 *   1. Personalised greeting — time-of-day salutation + driver name
 *   2. Date sub-line — today's date in German locale
 *   3. ShiftStatusCard — compact today-only shift control
 *   4. Section heading "Meine Touren heute"
 *   5. TodaysTripsList — driver's assigned trips for today
 */

import { ShiftStatusCard } from '@/features/driver-portal/components/startseite/shift-status-card';
import { TodaysTripsList } from '@/features/driver-portal/components/startseite/todays-trips-list';
import { createClient } from '@/lib/supabase/client';
import { useEffect, useState } from 'react';

/** Time-of-day greeting in German. */
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 5) return 'Guten Abend';
  if (hour < 11) return 'Guten Morgen';
  if (hour < 14) return 'Guten Tag';
  if (hour < 18) return 'Guten Nachmittag';
  return 'Guten Abend';
}

function formatTodayHeader(): string {
  return new Date().toLocaleDateString('de-DE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

export function StartseitePageContent() {
  const [driverId, setDriverId] = useState<string | null>(null);
  const [driverName, setDriverName] = useState<string | null>(null);
  /**
   * Tracks whether the driver has an active (non-ended, non-idle) shift.
   * Updated via the onShiftStateChange callback from ShiftStatusCard.
   * Used to gate "Tour starten" in TodaysTripsList.
   */
  const [shiftActive, setShiftActive] = useState(false);

  // Load current user's ID + display name once on mount
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) return;

      setDriverId(user.id);

      const { data: profile } = await supabase
        .from('accounts')
        .select('first_name, name')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Prefer first_name for a friendly tone; fall back to full name
        setDriverName(profile.first_name ?? profile.name ?? null);
      }
    };
    void init();
  }, []);

  return (
    <div className='flex flex-col gap-6 p-4'>
      {/* Personalised greeting */}
      <div>
        <h1 className='text-foreground text-2xl font-bold'>
          {getGreeting()}
          {driverName ? `, ${driverName}` : ''} 👋
        </h1>
        <p className='text-muted-foreground mt-0.5 text-sm capitalize'>
          {formatTodayHeader()}
        </p>
      </div>

      {/* Compact shift status + controls */}
      <section aria-label='Schichtstatus'>
        <ShiftStatusCard
          onShiftStateChange={(state) =>
            setShiftActive(state === 'active' || state === 'on_break')
          }
        />
      </section>

      {/* Today's scheduled trips */}
      <section aria-label='Meine Touren heute'>
        <h2 className='text-foreground mb-3 text-base font-semibold'>
          Meine Touren heute
        </h2>
        {driverId ? (
          <TodaysTripsList driverId={driverId} shiftActive={shiftActive} />
        ) : (
          <div className='flex flex-col gap-3'>
            {[1, 2].map((i) => (
              <div
                key={i}
                className='bg-muted h-32 animate-pulse rounded-xl border'
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
