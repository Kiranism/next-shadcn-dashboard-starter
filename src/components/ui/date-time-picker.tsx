'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
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
  const [open, setOpen] = React.useState(false);
  const [timeValue, setTimeValue] = React.useState<string>(() => {
    if (value) {
      return format(value, 'HH:mm');
    }
    return '';
  });

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
    setOpen(false);
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

  return (
    <div className='flex items-end gap-2'>
      <div className='flex-1'>
        {label && (
          <Label htmlFor={id} className='mb-2 block'>
            {label}
          </Label>
        )}
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              id={id}
              variant='outline'
              disabled={disabled}
              className={cn(
                'w-full justify-between text-left font-normal',
                !selectedDate && 'text-muted-foreground'
              )}
            >
              <span className='flex items-center gap-2'>
                <CalendarIcon className='h-4 w-4 shrink-0 opacity-60' />
                {displayDate}
              </span>
              <ChevronDownIcon className='h-4 w-4 opacity-50' />
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto overflow-hidden p-0' align='start'>
            <Calendar
              mode='single'
              selected={selectedDate}
              onSelect={handleDaySelect}
              defaultMonth={selectedDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
      <div className='w-32'>
        {label && <Label className='mb-2 block opacity-0'>Zeit</Label>}
        <div className='relative'>
          <ClockIcon className='text-muted-foreground pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            type='time'
            step='60'
            value={timeValue}
            onChange={handleTimeChange}
            disabled={disabled}
            className='appearance-none pl-9 [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none'
          />
        </div>
      </div>
    </div>
  );
}
