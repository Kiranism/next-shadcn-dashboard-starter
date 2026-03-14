'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { parseAsString, useQueryState } from 'nuqs';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { useTripFormData } from '@/features/trips/hooks/use-trip-form-data';

interface TripsFiltersBarProps {
  totalItems: number;
}

export function TripsFiltersBar({ totalItems }: TripsFiltersBarProps) {
  const router = useRouter();
  const { drivers, payers } = useTripFormData();

  const [name, setName] = useQueryState('name', parseAsString);
  const [driverId, setDriverId] = useQueryState(
    'driver_id',
    parseAsString.withDefault('all')
  );
  const [status, setStatus] = useQueryState('status', parseAsString);
  const [payerId, setPayerId] = useQueryState('payer_id', parseAsString);
  const [scheduledAt, setScheduledAt] = useQueryState(
    'scheduled_at',
    parseAsString
  );

  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const selectedDate = useMemo(() => {
    if (!scheduledAt) return undefined;
    const ts = Number(scheduledAt.split(',')[0]);
    if (Number.isNaN(ts)) return undefined;
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }, [scheduledAt]);

  const driverOptions = useMemo(
    () => [
      { label: 'Alle Fahrer', value: 'all' },
      { label: 'Nicht zugewiesen', value: 'unassigned' },
      ...drivers.map((d) => ({ label: d.name, value: d.id }))
    ],
    [drivers]
  );

  const statusOptions = [
    { label: 'Alle Status', value: 'all' },
    { label: 'Offen', value: 'pending' },
    { label: 'Zugewiesen', value: 'assigned' },
    { label: 'In Fahrt', value: 'in_progress' },
    { label: 'Abgeschlossen', value: 'completed' },
    { label: 'Storniert', value: 'cancelled' }
  ];

  const triggerRefresh = () => {
    router.refresh();
  };

  return (
    <div className='bg-muted/40 mb-1 flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs'>
      <div className='flex flex-wrap items-center gap-2'>
        <Input
          placeholder='Fahrgast / Adresse suchen'
          value={name ?? ''}
          onChange={(event) => {
            void setName(event.target.value ? event.target.value : null);
            triggerRefresh();
          }}
          className='h-8 w-44 sm:w-56'
        />

        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              className='h-8 w-[150px] justify-start gap-2 border-dashed'
            >
              <CalendarIcon className='h-4 w-4' />
              {selectedDate
                ? format(selectedDate, 'dd.MM.yyyy', { locale: de })
                : 'Heute wählen'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <Calendar
              mode='single'
              selected={selectedDate}
              onSelect={(date) => {
                if (!date) {
                  void setScheduledAt(null);
                  triggerRefresh();
                  return;
                }
                const ts = date.getTime();
                void setScheduledAt(String(ts));
                setDatePopoverOpen(false);
                triggerRefresh();
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Select
          value={driverId ?? 'all'}
          onValueChange={(val) => {
            if (val === 'all') {
              void setDriverId(null);
            } else {
              void setDriverId(val);
            }
            triggerRefresh();
          }}
        >
          <SelectTrigger className='h-8 w-40 text-xs'>
            <SelectValue placeholder='Fahrer' />
          </SelectTrigger>
          <SelectContent>
            {driverOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className='text-xs'>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={status ?? 'all'}
          onValueChange={(val) => {
            if (val === 'all') {
              void setStatus(null);
            } else {
              void setStatus(val);
            }
            triggerRefresh();
          }}
        >
          <SelectTrigger className='h-8 w-40 text-xs'>
            <SelectValue placeholder='Status' />
          </SelectTrigger>
          <SelectContent>
            {statusOptions.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className='text-xs'>
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={payerId ?? 'all'}
          onValueChange={(val) => {
            if (val === 'all') {
              void setPayerId(null);
            } else {
              void setPayerId(val);
            }
            triggerRefresh();
          }}
        >
          <SelectTrigger className='h-8 w-44 text-xs'>
            <SelectValue placeholder='Kostenträger' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all' className='text-xs'>
              Alle Kostenträger
            </SelectItem>
            {payers.map((payer) => (
              <SelectItem key={payer.id} value={payer.id} className='text-xs'>
                {payer.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className='flex items-center gap-3'>
        <span className='text-muted-foreground hidden text-[11px] sm:inline'>
          {totalItems} Fahrten
        </span>
        <Button
          variant='ghost'
          size='sm'
          className='text-muted-foreground hover:text-foreground h-8 px-3 text-xs'
          onClick={() => {
            void setName(null);
            void setDriverId('all');
            void setStatus(null);
            void setPayerId(null);
            void setScheduledAt(null);
            triggerRefresh();
          }}
        >
          Filter zurücksetzen
        </Button>
      </div>
    </div>
  );
}
