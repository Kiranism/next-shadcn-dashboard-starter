'use client';

/**
 * URL-driven trip filters for `/dashboard/trips` (shared by list + kanban queries).
 * Below `md`: compact row (search, date, “more filters”); advanced selects + Spalten expand
 * inside a collapsible. From `md` up, all controls stay in one non-wrapping row
 * (horizontal scroll if needed). State syncs
 * via `router.replace` + `router.refresh()` so the server RSC reloads with matching query params.
 */
import { useEffect, useMemo, useRef, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { format, startOfWeek, subWeeks, addWeeks } from 'date-fns';
import { de } from 'date-fns/locale';
import {
  CalendarIcon,
  ChevronDown,
  ListFilter,
  RotateCcw,
  Settings2
} from 'lucide-react';
import { CheckIcon, CaretSortIcon } from '@radix-ui/react-icons';

import { Button, buttonVariants } from '@/components/ui/button';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from '@/components/ui/collapsible';
import { useTripFormData } from '@/features/trips/hooks/use-trip-form-data';
import { useTripsTableStore } from '@/features/trips/stores/use-trips-table-store';
import { useIsNarrowScreen } from '@/hooks/use-is-narrow-screen';
import { cn } from '@/lib/utils';

interface TripsFiltersBarProps {
  totalItems: number;
}

/** Larger tap targets + `touch-manipulation` on small viewports; matches default Calendar styles from `md`. */
const tripsDateFilterCalendarClassNames = {
  day: cn(
    buttonVariants({ variant: 'ghost' }),
    'min-h-11 min-w-[2.75rem] touch-manipulation p-0 text-base font-normal aria-selected:opacity-100 sm:min-h-9 sm:min-w-9 sm:text-sm md:size-8 md:min-h-8 md:min-w-8'
  ),
  head_cell:
    'text-muted-foreground min-w-[2.75rem] rounded-md text-[0.85rem] font-normal sm:min-w-9 sm:text-[0.8rem] md:w-8',
  nav_button: cn(
    buttonVariants({ variant: 'outline' }),
    'min-h-11 min-w-11 touch-manipulation bg-transparent p-0 opacity-70 hover:opacity-100 sm:min-h-9 sm:min-w-9 md:size-7'
  )
};

export function TripsFiltersBar({ totalItems }: TripsFiltersBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  /** One filter layout at a time so the date `Popover` (and other overlays) are not mounted twice. */
  const isNarrow = useIsNarrowScreen(768);

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
  const [filtersExpanded, setFiltersExpanded] = useState(false);

  const hasAdvancedFilters = useMemo((): boolean => {
    return (
      driverId !== 'all' ||
      status !== 'all' ||
      payerId !== 'all' ||
      (Boolean(billingTypeId) && billingTypeId !== 'all')
    );
  }, [driverId, status, payerId, billingTypeId]);

  const prevAdvancedRef = useRef<boolean | null>(null);
  useEffect(() => {
    if (prevAdvancedRef.current === null) {
      prevAdvancedRef.current = hasAdvancedFilters;
      if (hasAdvancedFilters) {
        setFiltersExpanded(true);
      }
      return;
    }
    if (hasAdvancedFilters !== prevAdvancedRef.current) {
      if (hasAdvancedFilters) {
        setFiltersExpanded(true);
      } else {
        setFiltersExpanded(false);
      }
      prevAdvancedRef.current = hasAdvancedFilters;
    }
  }, [hasAdvancedFilters]);

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

    params.set('page', '1');

    const next = `${pathname}?${params.toString()}`;
    startTransition(() => {
      router.replace(next, { scroll: false });
      // `replace` alone can reuse a stale RSC payload; `refresh` refetches for the new URL.
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

  const renderColumnVisibilityPopover = (triggerClassName: string) =>
    currentView === 'list' && table ? (
      <Popover>
        <PopoverTrigger asChild>
          <Button variant='outline' size='sm' className={triggerClassName}>
            <Settings2 className='h-3.5 w-3.5 shrink-0' />
            <span className='truncate'>Spalten</span>
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
    ) : null;

  const dateFilterPopover = (
    <Popover
      modal={false}
      open={datePopoverOpen}
      onOpenChange={setDatePopoverOpen}
    >
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          size='sm'
          className='h-10 min-h-10 min-w-0 flex-1 touch-manipulation justify-start gap-2 border-dashed md:h-8 md:min-h-0 md:flex-initial'
        >
          <CalendarIcon className='h-4 w-4 shrink-0' />
          <span className='truncate'>{dateButtonLabel}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        align='start'
        side='bottom'
        sideOffset={isNarrow ? 8 : 4}
        collisionPadding={16}
        onOpenAutoFocus={(event) => event.preventDefault()}
        className={cn(
          'flex max-h-[min(78vh,560px)] w-[min(100vw-1rem,22rem)] touch-manipulation flex-col overflow-y-auto overscroll-contain p-0 sm:max-h-none sm:w-72 sm:min-w-[280px]',
          'pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]'
        )}
      >
        <div className='flex shrink-0 flex-col gap-2 border-b px-3 py-2.5 sm:flex-row sm:flex-wrap sm:gap-1.5 sm:py-2'>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-10 min-h-10 w-full touch-manipulation justify-center text-sm sm:h-7 sm:min-h-0 sm:w-auto sm:text-xs'
            onClick={() => jumpToWeekStart(subWeeks(new Date(), 1))}
          >
            Letzte Woche
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-10 min-h-10 w-full touch-manipulation justify-center text-sm sm:h-7 sm:min-h-0 sm:w-auto sm:text-xs'
            onClick={() => jumpToWeekStart(new Date())}
          >
            Diese Woche
          </Button>
          <Button
            type='button'
            variant='outline'
            size='sm'
            className='h-10 min-h-10 w-full touch-manipulation justify-center text-sm sm:h-7 sm:min-h-0 sm:w-auto sm:text-xs'
            onClick={() => jumpToWeekStart(addWeeks(new Date(), 1))}
          >
            Nächste Woche
          </Button>
        </div>
        <div className='w-full min-w-0 shrink-0 px-1 pt-0.5 pb-1 sm:px-0 sm:pb-0'>
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
            initialFocus={false}
            className='w-full max-w-full'
            classNames={tripsDateFilterCalendarClassNames}
          />
        </div>
      </PopoverContent>
    </Popover>
  );

  const advancedFilterSelects = (
    <>
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
        <SelectTrigger className='h-10 min-h-10 w-full min-w-0 text-xs sm:min-w-[110px] md:h-8 md:min-h-0 md:w-auto md:shrink-0'>
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
        <SelectTrigger className='h-10 min-h-10 w-full min-w-0 text-xs sm:min-w-[110px] md:h-8 md:min-h-0 md:w-auto md:shrink-0'>
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
          if (val === 'all') {
            updateFilters({ payer_id: null, billing_type_id: null });
          } else {
            updateFilters({ payer_id: val, billing_type_id: null });
          }
        }}
      >
        <SelectTrigger className='h-10 min-h-10 w-full min-w-0 text-xs sm:min-w-[120px] md:h-8 md:min-h-0 md:w-auto md:shrink-0'>
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
          <SelectTrigger className='h-10 min-h-10 w-full min-w-0 text-xs sm:min-w-[120px] md:h-8 md:min-h-0 md:w-auto md:shrink-0'>
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
    </>
  );

  const filterCountResetFooter = (
    <div className='border-border/60 flex w-full min-w-0 shrink-0 flex-row items-center justify-between gap-2 border-t pt-2 md:w-auto md:justify-end md:border-0 md:pt-0'>
      <span className='text-muted-foreground text-[11px]'>
        {totalItems} Fahrten
      </span>
      <Button
        type='button'
        variant='ghost'
        size='icon'
        className='text-muted-foreground hover:text-foreground size-10 shrink-0 md:size-8'
        aria-label='Filter zurücksetzen'
        title='Filter zurücksetzen'
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
        <RotateCcw className='size-4' />
      </Button>
    </div>
  );

  return (
    <>
      {isNarrow ? (
        <div className='bg-muted/40 mb-1 flex min-w-0 shrink-0 flex-col gap-2 rounded-lg px-3 py-2 text-xs'>
          <Collapsible open={filtersExpanded} onOpenChange={setFiltersExpanded}>
            <div className='flex min-w-0 flex-col gap-2'>
              <div className='flex min-w-0 gap-2'>
                <Input
                  placeholder='Fahrgast oder Adresse suchen'
                  value={localSearch}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  className='h-10 min-h-10 min-w-0 flex-1'
                />
                {dateFilterPopover}
                <CollapsibleTrigger asChild>
                  <Button
                    type='button'
                    variant='outline'
                    size='sm'
                    className='text-muted-foreground h-10 min-h-10 shrink-0 gap-1.5 px-2.5'
                    aria-expanded={filtersExpanded}
                  >
                    <ListFilter className='h-4 w-4 shrink-0' />
                    <ChevronDown
                      className={cn(
                        'h-4 w-4 shrink-0 transition-transform',
                        filtersExpanded && 'rotate-180'
                      )}
                    />
                    <span className='sr-only'>Weitere Filter</span>
                  </Button>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className='flex flex-col gap-2 pt-1'>
                  <div className='grid w-full grid-cols-1 gap-2 sm:grid-cols-2'>
                    {advancedFilterSelects}
                  </div>
                  {renderColumnVisibilityPopover(
                    'h-10 min-h-10 w-full justify-between gap-1.5 text-xs font-normal'
                  )}
                </div>
              </CollapsibleContent>
            </div>
          </Collapsible>
          {filterCountResetFooter}
        </div>
      ) : (
        <div className='bg-muted/40 mb-1 flex min-w-0 shrink-0 flex-col gap-2 rounded-lg px-3 py-2 text-xs md:flex-row md:items-start md:justify-between md:gap-3'>
          <div className='flex w-full min-w-0 flex-col gap-2 md:min-w-0 md:flex-1 md:flex-row md:flex-nowrap md:items-center md:gap-2 md:overflow-x-auto'>
            <Input
              placeholder='Fahrgast oder Adresse suchen'
              value={localSearch}
              onChange={(event) => handleSearchChange(event.target.value)}
              className='h-10 min-h-10 w-full min-w-0 md:h-8 md:min-h-0 md:min-w-[120px] md:flex-1'
            />

            <div className='flex w-full min-w-0 gap-2 md:w-auto md:shrink-0'>
              {dateFilterPopover}
              {renderColumnVisibilityPopover(
                'h-10 min-h-10 min-w-0 flex-1 justify-between gap-1.5 text-xs font-normal md:h-8 md:min-h-0 md:min-w-[8.5rem] md:flex-initial'
              )}
            </div>

            <div className='grid w-full grid-cols-1 gap-2 sm:grid-cols-2 md:contents'>
              {advancedFilterSelects}
            </div>
          </div>

          {filterCountResetFooter}
        </div>
      )}
    </>
  );
}
