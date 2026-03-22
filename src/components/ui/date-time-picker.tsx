'use client';

import * as React from 'react';
import { Button, buttonVariants } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { CalendarIcon, ChevronDownIcon, ClockIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useIsNarrowScreen } from '@/hooks/use-is-narrow-screen';
import { MobileDateTimeSheet } from '@/features/trips/components/create-trip/mobile-datetime-sheet';

/** Larger cells + touch-manipulation so the calendar works on phones (e.g. inside Drawer/Dialog). */
const dateTimePickerCalendarClassNames = {
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

interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  label?: string;
  disabled?: boolean;
  id?: string;
}

export function DateTimePicker({
  value,
  onChange,
  label,
  disabled,
  id = 'date-time-picker'
}: DateTimePickerProps) {
  const narrow = useIsNarrowScreen(768);
  const [popoverOpen, setPopoverOpen] = React.useState(false);
  const [dateSheetOpen, setDateSheetOpen] = React.useState(false);
  const [timeSheetOpen, setTimeSheetOpen] = React.useState(false);
  const [timeValue, setTimeValue] = React.useState<string>(() => {
    if (value) {
      return format(value, 'HH:mm');
    }
    return '';
  });

  React.useEffect(() => {
    if (value) {
      setTimeValue(format(value, 'HH:mm'));
    }
  }, [value]);

  const selectedDate = value;

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) {
      onChange?.(undefined);
      return;
    }
    const [hours, minutes] = timeValue
      ? timeValue.split(':').map(Number)
      : [0, 0];
    const newDate = new Date(day);
    newDate.setHours(hours, minutes, 0, 0);
    onChange?.(newDate);
    setPopoverOpen(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = e.target.value;
    setTimeValue(time);
    if (selectedDate && time) {
      const [hours, minutes] = time.split(':').map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes, 0, 0);
      onChange?.(newDate);
    }
  };

  const displayDate = selectedDate
    ? format(selectedDate, 'dd. MMMM yyyy', { locale: de })
    : 'Datum wählen';

  const displayTime = selectedDate
    ? format(selectedDate, 'HH:mm')
    : timeValue || '—';

  const timeId = `${id}-time`;

  if (narrow) {
    return (
      <div className='flex w-full flex-col gap-2'>
        {label ? <span className='text-xs font-medium'>{label}</span> : null}
        <div className='flex w-full flex-row items-end gap-2'>
          <div className='min-w-0 flex-1'>
            <Label
              htmlFor={id}
              className='text-muted-foreground mb-1 block text-xs'
            >
              Datum
            </Label>
            <Button
              type='button'
              id={id}
              variant='outline'
              disabled={disabled}
              onClick={() => setDateSheetOpen(true)}
              className={cn(
                'h-10 min-h-10 w-full touch-manipulation justify-between text-left text-base font-normal md:h-9 md:min-h-0',
                !selectedDate && 'text-muted-foreground'
              )}
            >
              <span className='flex min-w-0 items-center gap-2'>
                <CalendarIcon className='h-4 w-4 shrink-0 opacity-60' />
                <span className='min-w-0 truncate'>{displayDate}</span>
              </span>
              <ChevronDownIcon className='h-4 w-4 shrink-0 opacity-50' />
            </Button>
            <MobileDateTimeSheet
              open={dateSheetOpen}
              onOpenChange={setDateSheetOpen}
              value={selectedDate}
              title='Datum wählen'
              mode='date'
              onConfirm={(d) => {
                onChange?.(d);
                setTimeValue(format(d, 'HH:mm'));
              }}
            />
          </div>
          <div className='w-[8.25rem] shrink-0 sm:w-[9.5rem]'>
            <Label
              htmlFor={timeId}
              className='text-muted-foreground mb-1 block text-xs'
            >
              Uhrzeit
            </Label>
            <Button
              type='button'
              id={timeId}
              variant='outline'
              disabled={disabled || !selectedDate}
              onClick={() => setTimeSheetOpen(true)}
              className={cn(
                'h-10 min-h-10 w-full touch-manipulation justify-between text-left font-mono text-base font-normal md:h-9 md:min-h-0',
                !selectedDate && 'text-muted-foreground'
              )}
            >
              <span className='flex min-w-0 items-center gap-2'>
                <ClockIcon className='h-4 w-4 shrink-0 opacity-60' />
                <span className='min-w-0 truncate'>{displayTime}</span>
              </span>
              <ChevronDownIcon className='h-4 w-4 shrink-0 opacity-50' />
            </Button>
            <MobileDateTimeSheet
              open={timeSheetOpen}
              onOpenChange={setTimeSheetOpen}
              value={selectedDate}
              title='Uhrzeit wählen'
              mode='time'
              onConfirm={(d) => {
                onChange?.(d);
                setTimeValue(format(d, 'HH:mm'));
              }}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className='flex items-end gap-2'>
      <div className='min-w-0 flex-1'>
        {label && (
          <Label htmlFor={id} className='mb-2 block'>
            {label}
          </Label>
        )}
        <Popover modal={false} open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <Button
              type='button'
              id={id}
              variant='outline'
              disabled={disabled}
              className={cn(
                'h-10 min-h-10 w-full touch-manipulation justify-between text-left font-normal md:h-9 md:min-h-0',
                !selectedDate && 'text-muted-foreground'
              )}
            >
              <span className='flex min-w-0 items-center gap-2'>
                <CalendarIcon className='h-4 w-4 shrink-0 opacity-60' />
                <span className='truncate'>{displayDate}</span>
              </span>
              <ChevronDownIcon className='h-4 w-4 shrink-0 opacity-50' />
            </Button>
          </PopoverTrigger>
          <PopoverContent
            align='start'
            side='bottom'
            sideOffset={4}
            collisionPadding={16}
            onOpenAutoFocus={(event) => event.preventDefault()}
            className={cn(
              'z-[100] w-[min(100vw-1rem,20rem)] max-w-[calc(100vw-1rem)] touch-manipulation overflow-y-auto overscroll-contain p-0 sm:w-auto sm:max-w-none',
              'pb-[max(0.5rem,env(safe-area-inset-bottom,0px))]'
            )}
          >
            <Calendar
              mode='single'
              selected={selectedDate}
              onSelect={handleDaySelect}
              defaultMonth={selectedDate}
              initialFocus={false}
              className='w-full max-w-full'
              classNames={dateTimePickerCalendarClassNames}
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className='w-32 shrink-0'>
        {label && <Label className='mb-2 block opacity-0'>Zeit</Label>}
        <div className='relative'>
          <ClockIcon className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            type='time'
            step='60'
            value={timeValue}
            onChange={handleTimeChange}
            disabled={disabled}
            className={cn(
              'h-10 min-h-10 touch-manipulation pl-9 md:h-9 md:min-h-0',
              'appearance-none md:[&::-webkit-calendar-picker-indicator]:hidden md:[&::-webkit-calendar-picker-indicator]:appearance-none'
            )}
          />
        </div>
      </div>
    </div>
  );
}
