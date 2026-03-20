'use client';

import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { format, startOfWeek, subWeeks, addWeeks } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon, Settings2 } from 'lucide-react';
import { CheckIcon, CaretSortIcon } from '@radix-ui/react-icons';

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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { useTripFormData } from '@/features/trips/hooks/use-trip-form-data';
import { useTripsTableStore } from '@/features/trips/stores/use-trips-table-store';
import { cn } from '@/lib/utils';

interface TripsFiltersBarProps {
  totalItems: number;
}

export function TripsFiltersBar({ totalItems }: TripsFiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const search = searchParams.get('search') ?? '';
  const driverId = searchParams.get('driver_id') ?? 'all';
  const status = searchParams.get('status') ?? 'all';
  const payerId = searchParams.get('payer_id') ?? 'all';
  const billingTypeId = searchParams.get('billing_type_id') ?? 'all';
  const scheduledAt = searchParams.get('scheduled_at') ?? '';
  const currentView = searchParams.get('view') ?? 'list';

  const table = useTripsTableStore((s) => s.table);
  const columnVisibility = useTripsTableStore((s) => s.columnVisibility);

  const hidableColumns = useMemo(() => {
    if (!table) return [];
    return table
      .getAllColumns()
      .filter(
        (col) => typeof col.accessorFn !== 'undefined' && col.getCanHide()
      );
    // columnVisibility in deps ensures re-render (and fresh getIsVisible()) on every toggle
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [table, columnVisibility]);

  const [localSearch, setLocalSearch] = useState(search);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local input back when URL search param changes externally (e.g. reset button)
  useEffect(() => {
    setLocalSearch(search);
  }, [search]);

  // On first mount only: if no date is in the URL, default to today.
  useEffect(() => {
    if (searchParams.get('scheduled_at')) return;
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const params = new URLSearchParams(searchParams.toString());
    params.set('scheduled_at', String(startOfToday.getTime()));
    params.set('page', '1');
    const next = `${pathname}?${params.toString()}`;
    startTransition(() => {
      router.replace(next, { scroll: false });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { drivers, payers, billingTypes } = useTripFormData(payerId ?? null);

  const [datePopoverOpen, setDatePopoverOpen] = useState(false);

  const selectedDate = useMemo((): Date | undefined => {
    if (!scheduledAt) return undefined;
    // Only use the first part (ignore any legacy range suffix)
    const ts = Number(scheduledAt.split(',')[0]);
    if (Number.isNaN(ts)) return undefined;
    const d = new Date(ts);
    return Number.isNaN(d.getTime()) ? undefined : d;
  }, [scheduledAt]);

  const dateButtonLabel = useMemo(() => {
    if (!selectedDate) return 'Heute';
    return format(selectedDate, 'dd.MM.yyyy', { locale: de });
  }, [selectedDate]);

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
  const jumpToWeekStart = (anchor: Date) => {
    const weekStart = startOfWeek(anchor, { weekStartsOn: 1 });
    weekStart.setHours(0, 0, 0, 0);
    updateFilters({ scheduled_at: String(weekStart.getTime()) });
    setDatePopoverOpen(false);
  };

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
      /** Soft navigation can reuse a stale RSC payload; refresh loads trips for the new URL. */
      router.refresh();
    });
  };

  const handleSearchChange = (value: string) => {
    setLocalSearch(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      updateFilters({ search: value || null });
    }, 350);
  };

  return (
    <div className='bg-muted/40 mb-1 flex min-w-0 flex-1 items-center justify-between gap-2 rounded-lg px-3 py-2 text-xs'>
      <div className='flex min-w-0 flex-1 flex-wrap items-center gap-2 md:flex-nowrap'>
        <Input
          placeholder='Fahrgast oder Adresse suchen'
          value={localSearch}
          onChange={(event) => handleSearchChange(event.target.value)}
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
              <span className='xs:inline hidden'>{dateButtonLabel}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className='flex h-fit w-full min-w-[var(--radix-popover-trigger-width)] flex-col p-0 sm:min-w-[280px]'
            align='start'
          >
            <div className='flex shrink-0 flex-wrap gap-1.5 border-b px-3 py-2'>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-7 text-xs'
                onClick={() => jumpToWeekStart(subWeeks(new Date(), 1))}
              >
                Letzte Woche
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-7 text-xs'
                onClick={() => jumpToWeekStart(new Date())}
              >
                Diese Woche
              </Button>
              <Button
                type='button'
                variant='outline'
                size='sm'
                className='h-7 text-xs'
                onClick={() => jumpToWeekStart(addWeeks(new Date(), 1))}
              >
                Nächste Woche
              </Button>
            </div>
            <div className='w-full min-w-0 shrink-0'>
              <Calendar
                mode='single'
                selected={selectedDate}
                onSelect={(day: Date | undefined) => {
                  if (!day) {
                    updateFilters({ scheduled_at: null });
                    return;
                  }
                  const d = new Date(day);
                  d.setHours(0, 0, 0, 0);
                  updateFilters({ scheduled_at: String(d.getTime()) });
                  setDatePopoverOpen(false);
                }}
                numberOfMonths={1}
                initialFocus
                className='w-full'
              />
            </div>
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

        {currentView === 'list' && table && (
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='h-8 flex-shrink-0 justify-between gap-1.5 text-xs font-normal'
              >
                <Settings2 className='h-3.5 w-3.5 shrink-0' />
                <span>Spalten</span>
                <CaretSortIcon className='ml-1 h-3.5 w-3.5 shrink-0 opacity-50' />
              </Button>
            </PopoverTrigger>
            <PopoverContent align='start' className='w-48 p-0'>
              <Command>
                <CommandInput
                  placeholder='Spalte suchen...'
                  className='h-8 text-xs'
                />
                <CommandList>
                  <CommandEmpty className='py-2 text-center text-xs'>
                    Keine Spalten gefunden.
                  </CommandEmpty>
                  <CommandGroup>
                    {hidableColumns.map((column) => (
                      <CommandItem
                        key={column.id}
                        onSelect={() =>
                          column.toggleVisibility(!column.getIsVisible())
                        }
                        className='text-xs'
                      >
                        <span className='truncate'>
                          {(column.columnDef.meta as any)?.label ?? column.id}
                        </span>
                        <CheckIcon
                          className={cn(
                            'ml-auto size-3.5 shrink-0',
                            column.getIsVisible() ? 'opacity-100' : 'opacity-0'
                          )}
                        />
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
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
              search: null,
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
