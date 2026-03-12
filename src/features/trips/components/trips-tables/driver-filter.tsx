'use client';

import * as React from 'react';
import type { Table } from '@tanstack/react-table';
import { useQueryState, parseAsString } from 'nuqs';

import { useTripFormData } from '@/features/trips/hooks/use-trip-form-data';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

interface TripsDriverFilterProps<TData> {
  table: Table<TData>;
}

export function TripsDriverFilter<TData>({
  table
}: TripsDriverFilterProps<TData>) {
  const { drivers, isLoading } = useTripFormData();

  const [driverFilter, setDriverFilter] = useQueryState(
    'driver_id',
    parseAsString.withDefault('all')
  );

  const value = driverFilter ?? 'all';

  return (
    <Select
      value={value}
      onValueChange={(val) => {
        if (val === 'all') {
          void setDriverFilter(null); // clear from URL -> no filter
        } else {
          void setDriverFilter(val);
        }

        table.setPageIndex(0);

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
              runId: 'driver-filter-change',
              hypothesisId: 'H3',
              location: 'driver-filter.tsx:onValueChange',
              message: 'Driver filter changed',
              data: {
                newValue: val
              },
              timestamp: Date.now()
            })
          }
        ).catch(() => {});
        // #endregion agent log
      }}
      disabled={isLoading}
    >
      <SelectTrigger className='h-8 w-40 text-xs'>
        <SelectValue placeholder='Fahrer filtern' />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value='all'>Alle Fahrer</SelectItem>
        <SelectItem
          value='unassigned'
          className='text-muted-foreground text-xs italic'
        >
          Nicht zugewiesen
        </SelectItem>
        {drivers.map((driver) => (
          <SelectItem key={driver.id} value={driver.id} className='text-xs'>
            {driver.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
