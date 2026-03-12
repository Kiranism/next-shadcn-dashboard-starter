'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import type { Trip } from '@/features/trips/api/trips.service';
import { useTripFormData } from '@/features/trips/hooks/use-trip-form-data';

interface DriverSelectCellProps {
  trip: Trip & { group_id?: string | null };
}

export function DriverSelectCell({ trip }: DriverSelectCellProps) {
  const router = useRouter();
  const { drivers, isLoading } = useTripFormData();
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(
    trip.driver_id
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Keep local state in sync with latest trip data so reused table cells
  // don't show a stale driver for rows that are actually unassigned.
  useEffect(() => {
    setSelectedDriverId(trip.driver_id);
  }, [trip.driver_id, trip.id]);

  const handleChange = async (value: string) => {
    const newDriverId = value === 'unassigned' ? null : value;
    if (newDriverId === selectedDriverId) return;

    setIsUpdating(true);

    // #region agent log
    fetch('http://127.0.0.1:7665/ingest/fea5df42-b29d-48fc-9b64-783ecb4dafb8', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Debug-Session-Id': 'ba8809'
      },
      body: JSON.stringify({
        sessionId: 'ba8809',
        runId: 'pre-refresh',
        hypothesisId: 'H1',
        location: 'driver-select-cell.tsx:handleChange',
        message: 'Driver change requested from cell',
        data: {
          tripId: trip.id,
          groupId: trip.group_id,
          previousDriverId: selectedDriverId,
          newDriverId: newDriverId
        },
        timestamp: Date.now()
      })
    }).catch(() => {});
    // #endregion agent log

    const supabase = createClient();

    try {
      if (trip.group_id) {
        const { error } = await supabase
          .from('trips')
          .update({ driver_id: newDriverId })
          .eq('group_id', trip.group_id);

        if (error) throw error;
        toast.success('Fahrer für die Gruppe aktualisiert');
      } else {
        const { error } = await supabase
          .from('trips')
          .update({ driver_id: newDriverId })
          .eq('id', trip.id);

        if (error) throw error;
        toast.success('Fahrer aktualisiert');
      }

      setSelectedDriverId(newDriverId);

      // #region agent log
      fetch(
        'http://127.0.0.1:7665/ingest/fea5df42-b29d-48fc-9b64-783ecb4dafb8',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': 'ba8809'
          },
          body: JSON.stringify({
            sessionId: 'ba8809',
            runId: 'pre-refresh',
            hypothesisId: 'H1',
            location: 'driver-select-cell.tsx:afterUpdate',
            message: 'Driver updated successfully, triggering refresh',
            data: {
              tripId: trip.id,
              groupId: trip.group_id,
              appliedDriverId: newDriverId
            },
            timestamp: Date.now()
          })
        }
      ).catch(() => {});
      // #endregion agent log

      router.refresh();
    } catch (error: any) {
      toast.error(
        `Fehler beim Zuweisen des Fahrers: ${
          error?.message ?? 'Unbekannter Fehler'
        }`
      );
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return <Skeleton className='h-8 w-32' />;
  }

  return (
    <Select
      value={selectedDriverId ?? 'unassigned'}
      onValueChange={handleChange}
      disabled={isUpdating}
    >
      <SelectTrigger className='h-8 w-40 text-xs'>
        <SelectValue placeholder='Fahrer auswählen' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem
          value='unassigned'
          className='text-muted-foreground text-xs italic'
        >
          Nicht zugewiesen
        </SelectItem>
        {drivers.map((driver) => (
          <SelectItem
            key={driver.id}
            value={driver.id}
            className='text-xs font-medium'
          >
            {driver.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
