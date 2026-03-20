'use client';

/**
 * ShiftStatusCard — compact today-only shift control for the Startseite.
 *
 * Shows the current state of the driver's shift for TODAY:
 *   idle     → "Schicht starten" button
 *   active   → green pulsing dot + elapsed time + Pause / Beenden buttons
 *   on_break → orange pulsing dot + break timer + "Pause beenden" button
 *   ended    → total duration summary
 *
 * History and manual time-entry are NOT shown here — they live on the
 * dedicated Schichtenzettel page (/driver/shift).
 */

import { Button } from '@/components/ui/button';
import { createClient } from '@/lib/supabase/client';
import { shiftsService } from '@/features/driver-portal/api/shifts.service';
import { SHIFT_STATUSES } from '@/features/driver-portal/types';
import type { Shift } from '@/features/driver-portal/types';
import { cn } from '@/lib/utils';
import {
  IconPlayerPause,
  IconPlayerPlay,
  IconSquare
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Utilities
// ---------------------------------------------------------------------------

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const secs = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }
  return `${minutes}:${String(secs).padStart(2, '0')}`;
}

/**
 * Non-blocking GPS helper — resolves null immediately after a short
 * timeout so UI actions never freeze while waiting for the device.
 * Location is attached to the event best-effort only.
 */
async function getPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    // Hard cap at 2 s — we never want the user to wait longer than this
    const timeout = setTimeout(() => resolve(null), 2000);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        clearTimeout(timeout);
        resolve({ lat: p.coords.latitude, lng: p.coords.longitude });
      },
      () => {
        clearTimeout(timeout);
        resolve(null);
      },
      { enableHighAccuracy: false, timeout: 2000, maximumAge: 60000 }
    );
  });
}

type TrackerState = 'loading' | 'idle' | 'active' | 'on_break' | 'ended';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ShiftStatusCardProps {
  /**
   * Called whenever the shift state changes.
   * The parent uses this to gate "Tour starten" in TodaysTripsList:
   * only 'active' and 'on_break' mean the driver has a running shift.
   */
  onShiftStateChange?: (state: TrackerState) => void;
}

export function ShiftStatusCard({ onShiftStateChange }: ShiftStatusCardProps) {
  const [state, setState] = useState<TrackerState>('loading');
  const [shift, setShift] = useState<Shift | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [breakStartedAt, setBreakStartedAt] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  // Tick counter forces re-renders every second during on_break so the
  // break duration display counts up (Date.now() is evaluated on each render)
  const [, setTick] = useState(0);

  // Initialize: load user profile + check for active shift
  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        setState('idle');
        return;
      }

      const { data: profile } = await supabase
        .from('accounts')
        .select('id, company_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setState('idle');
        return;
      }

      setDriverId(profile.id);
      setCompanyId(profile.company_id);

      const activeShift = await shiftsService.getActiveShift(profile.id);
      if (activeShift) {
        setShift(activeShift);
        if (activeShift.status === SHIFT_STATUSES.ON_BREAK) {
          setState('on_break');
          setBreakStartedAt(Date.now());
        } else {
          setState('active');
          setElapsedMs(Date.now() - new Date(activeShift.started_at).getTime());
        }
      } else {
        setState('idle');
      }
    };
    void init();
  }, []);

  // Notify parent whenever shift state changes (used to gate Tour starten)
  useEffect(() => {
    onShiftStateChange?.(state);
  }, [state, onShiftStateChange]);

  // Tick timer every second while active or on break
  useEffect(() => {
    if (state !== 'active' && state !== 'on_break') return;
    const interval = setInterval(() => {
      if (state === 'active' && shift) {
        setElapsedMs(Date.now() - new Date(shift.started_at).getTime());
      } else {
        // Force re-render so the inline Date.now() in the break timer stays live
        setTick((t) => t + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [state, shift]);

  // ------------------------------------------------------------------
  // Actions
  // ------------------------------------------------------------------

  const handleStartShift = async () => {
    if (!driverId || !companyId || actionLoading) return;
    setActionLoading(true);
    try {
      const pos = await getPosition();
      const newShift = await shiftsService.startShift({
        driverId,
        companyId,
        vehicleId: null,
        lat: pos?.lat,
        lng: pos?.lng
      });
      setShift(newShift);
      setState('active');
      setElapsedMs(0);
      toast.success('Schicht gestartet.');
    } catch {
      toast.error('Fehler beim Starten der Schicht.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStartBreak = async () => {
    if (!shift || actionLoading) return;
    setActionLoading(true);
    try {
      const pos = await getPosition();
      await shiftsService.startBreak({
        shiftId: shift.id,
        lat: pos?.lat,
        lng: pos?.lng
      });
      setState('on_break');
      setBreakStartedAt(Date.now());
      toast.success('Pause gestartet.');
    } catch (err) {
      const msg =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: string }).message)
          : 'Unbekannter Fehler';
      console.error('[ShiftStatusCard] startBreak error:', err);
      toast.error(`Pause konnte nicht gestartet werden: ${msg}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndBreak = async () => {
    if (!shift || actionLoading) return;
    setActionLoading(true);
    try {
      const pos = await getPosition();
      await shiftsService.endBreak({
        shiftId: shift.id,
        lat: pos?.lat,
        lng: pos?.lng
      });
      setState('active');
      setBreakStartedAt(null);
      setElapsedMs(Date.now() - new Date(shift.started_at).getTime());
      toast.success('Pause beendet.');
    } catch {
      toast.error('Fehler beim Beenden der Pause.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEndShift = async () => {
    if (!shift || actionLoading) return;
    setActionLoading(true);
    try {
      const pos = await getPosition();
      const ended = await shiftsService.endShift({
        shiftId: shift.id,
        lat: pos?.lat,
        lng: pos?.lng
      });
      setShift(ended);
      setState('ended');
      const start = new Date(ended.started_at).getTime();
      const end = ended.ended_at
        ? new Date(ended.ended_at).getTime()
        : Date.now();
      setElapsedMs(end - start);
      toast.success('Schicht beendet.');
    } catch {
      toast.error('Fehler beim Beenden der Schicht.');
    } finally {
      setActionLoading(false);
    }
  };

  // ------------------------------------------------------------------
  // Loading skeleton
  // ------------------------------------------------------------------

  if (state === 'loading') {
    return (
      <div className='bg-card flex h-[100px] items-center justify-center rounded-2xl border'>
        <span className='text-muted-foreground text-sm'>Laden…</span>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Idle — not yet started
  // ------------------------------------------------------------------

  if (state === 'idle') {
    return (
      <div className='bg-card rounded-2xl border p-5'>
        <div className='mb-4 flex items-center gap-3'>
          <div className='h-2.5 w-2.5 rounded-full bg-gray-300' />
          <span className='text-muted-foreground text-sm font-medium'>
            Noch keine Schicht heute
          </span>
        </div>
        <Button
          className='w-full'
          size='lg'
          onClick={() => void handleStartShift()}
          disabled={actionLoading}
        >
          <IconPlayerPlay className='mr-2 h-5 w-5' />
          Schicht starten
        </Button>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Ended — show summary
  // ------------------------------------------------------------------

  if (state === 'ended') {
    return (
      <div className='bg-card rounded-2xl border p-5'>
        <div className='mb-3 flex items-center gap-3'>
          <div className='h-2.5 w-2.5 rounded-full bg-gray-400' />
          <span className='text-muted-foreground text-sm font-medium'>
            Schicht beendet
          </span>
        </div>
        <p className='text-muted-foreground text-center text-xs'>Gesamtdauer</p>
        <p className='text-center font-mono text-3xl font-bold tabular-nums'>
          {formatDuration(elapsedMs)}
        </p>
      </div>
    );
  }

  // ------------------------------------------------------------------
  // Active or on_break
  // ------------------------------------------------------------------

  const isOnBreak = state === 'on_break';

  return (
    <div
      className={cn(
        'bg-card rounded-2xl border p-5 transition-colors',
        isOnBreak &&
          'border-amber-200 bg-amber-50/30 dark:border-amber-900 dark:bg-amber-950/20'
      )}
    >
      {/* Status indicator row */}
      <div className='mb-4 flex items-center gap-3'>
        {/* Pulsing status dot */}
        <span className='relative flex h-3 w-3'>
          <span
            className={cn(
              'absolute inline-flex h-full w-full animate-ping rounded-full opacity-60',
              isOnBreak ? 'bg-amber-400' : 'bg-green-400'
            )}
          />
          <span
            className={cn(
              'relative inline-flex h-3 w-3 rounded-full',
              isOnBreak ? 'bg-amber-500' : 'bg-green-500'
            )}
          />
        </span>
        <span className='text-sm font-medium'>
          {isOnBreak ? 'Pause läuft' : 'Schicht läuft'}
        </span>
      </div>

      {/* Elapsed time */}
      <p className='mb-4 text-center font-mono text-4xl font-bold tabular-nums'>
        {state === 'active'
          ? formatDuration(elapsedMs)
          : breakStartedAt
            ? formatDuration(Date.now() - breakStartedAt)
            : '0:00'}
      </p>

      {/* Action buttons — Pause is prominent primary, Beenden is secondary */}
      {state === 'active' && (
        <div className='flex flex-col gap-2'>
          <Button
            size='lg'
            className='w-full'
            onClick={() => void handleStartBreak()}
            disabled={actionLoading}
          >
            <IconPlayerPause className='mr-2 h-5 w-5' />
            {actionLoading ? 'Bitte warten…' : 'Pause starten'}
          </Button>
          <Button
            variant='outline'
            size='sm'
            className='text-destructive hover:text-destructive w-full border-red-200 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30'
            onClick={() => void handleEndShift()}
            disabled={actionLoading}
          >
            <IconSquare className='mr-2 h-4 w-4' />
            Schicht beenden
          </Button>
        </div>
      )}

      {state === 'on_break' && (
        <Button
          className='w-full'
          size='lg'
          onClick={() => void handleEndBreak()}
          disabled={actionLoading}
        >
          <IconPlayerPlay className='mr-2 h-5 w-5' />
          Pause beenden
        </Button>
      )}
    </div>
  );
}
