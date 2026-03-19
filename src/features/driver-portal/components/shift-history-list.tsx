'use client';

/**
 * List of worked shifts for the driver.
 * Fetches shifts with events and renders expandable rows.
 * Read-only, no editing.
 */

import { createClient } from '@/lib/supabase/client';
import { shiftsService } from '@/features/driver-portal/api/shifts.service';
import { ShiftHistoryRow } from '@/features/driver-portal/components/shift-history-row';
import { useEffect, useState } from 'react';

type ShiftWithEvents = Awaited<
  ReturnType<typeof shiftsService.getShiftsWithEvents>
>[number];

export interface ShiftHistoryListProps {
  refreshTrigger?: number;
}

export function ShiftHistoryList({ refreshTrigger }: ShiftHistoryListProps) {
  const [driverId, setDriverId] = useState<string | null>(null);
  const [shifts, setShifts] = useState<ShiftWithEvents[]>([]);
  const [loading, setLoading] = useState(true);

  const loadShifts = async (id: string) => {
    const data = await shiftsService.getShiftsWithEvents(id, { limit: 60 });
    setShifts(data);
  };

  useEffect(() => {
    const init = async () => {
      const supabase = createClient();
      const {
        data: { user }
      } = await supabase.auth.getUser();
      if (!user) {
        setLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from('accounts')
        .select('id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      setDriverId(profile.id);
      try {
        await loadShifts(profile.id);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  useEffect(() => {
    if (refreshTrigger !== undefined && refreshTrigger > 0 && driverId) {
      loadShifts(driverId);
    }
  }, [refreshTrigger, driverId]);

  if (loading || !driverId) {
    return null;
  }

  if (shifts.length === 0) {
    return (
      <div className='rounded-lg border p-6 text-center'>
        <p className='text-muted-foreground text-sm'>
          Noch keine Schichten erfasst.
        </p>
      </div>
    );
  }

  return (
    <div className='space-y-2'>
      <h3 className='text-foreground mb-3 text-sm font-medium'>
        Erfasste Schichten
      </h3>
      {shifts.map((shift) => (
        <ShiftHistoryRow key={shift.id} shift={shift} />
      ))}
    </div>
  );
}
