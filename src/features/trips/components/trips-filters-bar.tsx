'use client';

import { useMemo, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
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
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const name = searchParams.get('name') ?? '';
  const driverId = searchParams.get('driver_id') ?? 'all';
  const status = searchParams.get('status') ?? 'all';
  const payerId = searchParams.get('payer_id') ?? 'all';
  const billingTypeId = searchParams.get('billing_type_id') ?? 'all';
  const scheduledAt = searchParams.get('scheduled_at') ?? '';

  const { drivers, payers, billingTypes } = useTripFormData(payerId ?? null);

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
  const updateFilters = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === '') {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    });

    // Always reset to first page when filters change
    params.set('page', '1');

    const next = `${pathname}?${params.toString()}`;
    startTransition(() => {
      router.replace(next, { scroll: false });
    });
  };

  return (
    <div className='bg-muted/40 mb-1 flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs'>
      <div className='flex min-w-0 flex-1 flex-wrap items-center gap-2 md:flex-nowrap'>
        <Input
          placeholder='Fahrgast / Adresse suchen'
          value={name}
          onChange={(event) => {
            updateFilters({ name: event.target.value || null });
          }}
          className='h-8 min-w-[120px] flex-1 truncate'
        />

        <Popover open={datePopoverOpen} onOpenChange={setDatePopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              size='sm'
              className='h-8 flex-shrink-0 justify-start gap-2 border-dashed'
            >
              <CalendarIcon className='h-4 w-4' />
              <span className='xs:inline hidden'>
                {selectedDate
                  ? format(selectedDate, 'dd.MM.yyyy', { locale: de })
                  : 'Heute wählen'}
              </span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <Calendar
              mode='single'
              selected={selectedDate}
              onSelect={(date) => {
                if (!date) {
                  updateFilters({ scheduled_at: null });
                  return;
                }
                const ts = date.getTime();
                updateFilters({ scheduled_at: String(ts) });
                setDatePopoverOpen(false);
              }}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        <Select
          value={driverId}
          onValueChange={(val) => {
            if (val === 'all') {
              updateFilters({ driver_id: null });
            } else {
              updateFilters({ driver_id: val });
            }
          }}
        >
          <SelectTrigger className='h-8 min-w-[110px] flex-shrink-0 text-xs'>
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
          value={status}
          onValueChange={(val) => {
            if (val === 'all') {
              updateFilters({ status: null });
            } else {
              updateFilters({ status: val });
            }
          }}
        >
          <SelectTrigger className='h-8 min-w-[110px] flex-shrink-0 text-xs'>
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
          value={payerId}
          onValueChange={(val) => {
            // Changing payer invalidates billing type
            if (val === 'all') {
              updateFilters({ payer_id: null, billing_type_id: null });
            } else {
              updateFilters({ payer_id: val, billing_type_id: null });
            }
          }}
        >
          <SelectTrigger className='h-8 min-w-[120px] flex-shrink-0 text-xs'>
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

        {payerId !== 'all' && billingTypes.length > 0 && (
          <Select
            value={billingTypeId}
            onValueChange={(val) => {
              if (val === 'all') {
                updateFilters({ billing_type_id: null });
              } else {
                updateFilters({ billing_type_id: val });
              }
            }}
          >
            <SelectTrigger className='h-8 min-w-[120px] flex-shrink-0 text-xs'>
              <SelectValue placeholder='Abrechnung' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all' className='text-xs'>
                Alle Abrechnungen
              </SelectItem>
              {billingTypes.map((bt) => (
                <SelectItem key={bt.id} value={bt.id} className='text-xs'>
                  {bt.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
            updateFilters({
              name: null,
              driver_id: null,
              status: null,
              payer_id: null,
              scheduled_at: null,
              billing_type_id: null
            });
          }}
        >
          Filter zurücksetzen
        </Button>
      </div>
    </div>
  );
}
