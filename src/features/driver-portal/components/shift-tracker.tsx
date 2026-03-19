'use client';

/**
 * @deprecated Replaced by ShiftTimeForm (manual time entry).
 * Shift tracker — Start / Pause (break) / End shift.
 *
 * Previously used at /driver/shift. State machine:
 * idle → active → on_break → active → ended
 *
 * Kept for reference only. Use ShiftTimeForm instead.
 */

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { createClient } from '@/lib/supabase/client';
import { shiftsService } from '@/features/driver-portal/api/shifts.service';
import { SHIFT_STATUSES, BREAK_REASONS } from '@/features/driver-portal/types';
import type { Shift } from '@/features/driver-portal/types';
import {
  IconPlayerPause,
  IconPlayerPlay,
  IconSquare
} from '@tabler/icons-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

type TrackerState = 'idle' | 'loading' | 'active' | 'on_break' | 'ended';

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

function getPosition(): Promise<{ lat: number; lng: number } | null> {
  return new Promise((resolve) => {
    if (!navigator.geolocation) {
      resolve(null);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (p) => resolve({ lat: p.coords.latitude, lng: p.coords.longitude }),
      () => resolve(null),
      { enableHighAccuracy: false, timeout: 5000, maximumAge: 60000 }
    );
  });
}

export function ShiftTracker() {
  const [state, setState] = useState<TrackerState>('loading');
  const [shift, setShift] = useState<Shift | null>(null);
  const [driverId, setDriverId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<{ id: string; name: string }[]>([]);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [breakStartedAt, setBreakStartedAt] = useState<number | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [, setTick] = useState(0);

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

      const { data: v } = await supabase
        .from('vehicles')
        .select('id, name')
        .eq('company_id', profile.company_id)
        .eq('is_active', true)
        .order('name');
      setVehicles((v as { id: string; name: string }[]) ?? []);

      const activeShift = await shiftsService.getActiveShift(profile.id);
      if (activeShift) {
        setShift(activeShift);
        setVehicleId(activeShift.vehicle_id);
        if (activeShift.status === SHIFT_STATUSES.ON_BREAK) {
          setState('on_break');
          setBreakStartedAt(Date.now());
        } else {
          setState('active');
          const start = new Date(activeShift.started_at).getTime();
          setElapsedMs(Date.now() - start);
        }
      } else {
        setState('idle');
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (state !== 'active' && state !== 'on_break') return;
    const interval = setInterval(() => {
      if (state === 'active' && shift) {
        const start = new Date(shift.started_at).getTime();
        setElapsedMs(Date.now() - start);
      } else {
        setTick((t) => t + 1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [state, shift]);

  const handleStartShift = async () => {
    if (!driverId || !companyId || actionLoading) return;
    setActionLoading(true);
    try {
      const pos = await getPosition();
      const newShift = await shiftsService.startShift({
        driverId,
        companyId,
        vehicleId: vehicleId || null,
        lat: pos?.lat,
        lng: pos?.lng
      });
      setShift(newShift);
      setState('active');
      setElapsedMs(0);
      toast.success('Schicht gestartet.');
    } catch (e) {
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
        reason: BREAK_REASONS.KURZPAUSE,
        lat: pos?.lat,
        lng: pos?.lng
      });
      setState('on_break');
      setBreakStartedAt(Date.now());
      toast.success('Pause gestartet.');
    } catch {
      toast.error('Fehler beim Starten der Pause.');
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
      const start = new Date(shift.started_at).getTime();
      setElapsedMs(Date.now() - start);
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

  if (state === 'loading') {
    return (
      <Card>
        <CardContent className='flex items-center justify-center py-12'>
          <span className='text-muted-foreground'>Laden...</span>
        </CardContent>
      </Card>
    );
  }

  if (!driverId || !companyId) {
    return (
      <Card>
        <CardContent className='py-8 text-center'>
          <p className='text-muted-foreground'>
            Bitte melden Sie sich an, um Ihre Schicht zu verwalten.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <h2 className='text-lg font-medium'>
          {state === 'idle' && 'Bereit zum Starten'}
          {state === 'active' && 'Schicht läuft'}
          {state === 'on_break' && 'Pause'}
          {state === 'ended' && 'Schicht beendet'}
        </h2>
      </CardHeader>
      <CardContent className='space-y-6'>
        {(state === 'active' || state === 'on_break') && (
          <div className='text-center'>
            <p className='text-muted-foreground text-sm'>
              {state === 'active' ? 'Arbeitszeit' : 'Pausenzeit'}
            </p>
            <p className='font-mono text-4xl font-semibold tabular-nums'>
              {state === 'active'
                ? formatDuration(elapsedMs)
                : breakStartedAt
                  ? formatDuration(Date.now() - breakStartedAt)
                  : '0:00'}
            </p>
          </div>
        )}

        {state === 'ended' && shift && (
          <div className='text-center'>
            <p className='text-muted-foreground text-sm'>Gesamtdauer</p>
            <p className='font-mono text-3xl font-semibold tabular-nums'>
              {formatDuration(elapsedMs)}
            </p>
          </div>
        )}

        {state === 'idle' && (
          <div className='space-y-4'>
            {vehicles.length > 0 && (
              <div>
                <label className='text-muted-foreground mb-2 block text-sm'>
                  Fahrzeug (optional)
                </label>
                <Select
                  value={vehicleId ?? '__none__'}
                  onValueChange={(v) =>
                    setVehicleId(v === '__none__' ? null : v)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder='Kein Fahrzeug' />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value='__none__'>Kein Fahrzeug</SelectItem>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            <Button
              className='w-full'
              size='lg'
              onClick={handleStartShift}
              disabled={actionLoading}
            >
              <IconPlayerPlay className='mr-2 h-5 w-5' /> Schicht starten
            </Button>
          </div>
        )}

        {state === 'active' && (
          <div className='flex flex-col gap-2'>
            <Button
              variant='secondary'
              className='w-full'
              onClick={handleStartBreak}
              disabled={actionLoading}
            >
              <IconPlayerPause className='mr-2 h-5 w-5' /> Pause
            </Button>
            <Button
              variant='destructive'
              className='w-full'
              onClick={handleEndShift}
              disabled={actionLoading}
            >
              <IconSquare className='mr-2 h-5 w-5' /> Schicht beenden
            </Button>
          </div>
        )}

        {state === 'on_break' && (
          <Button
            className='w-full'
            size='lg'
            onClick={handleEndBreak}
            disabled={actionLoading}
          >
            <IconPlayerPlay className='mr-2 h-5 w-5' /> Pause beenden
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
