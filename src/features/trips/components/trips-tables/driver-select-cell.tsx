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
import { getStatusWhenDriverChanges } from '@/features/trips/lib/trip-status';

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

    const payload: { driver_id: string | null; status?: string } = {
      driver_id: newDriverId
    };
    const derivedStatus = getStatusWhenDriverChanges(trip.status, newDriverId);
    if (derivedStatus) payload.status = derivedStatus;

    const supabase = createClient();

    try {
      if (trip.group_id) {
        const { error } = await supabase
          .from('trips')
          .update(payload)
          .eq('group_id', trip.group_id);

        if (error) throw error;
        toast.success('Fahrer für die Gruppe aktualisiert');
      } else {
        const { error } = await supabase
          .from('trips')
          .update(payload)
          .eq('id', trip.id);

        if (error) throw error;
        toast.success('Fahrer aktualisiert');
      }

      setSelectedDriverId(newDriverId);
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
