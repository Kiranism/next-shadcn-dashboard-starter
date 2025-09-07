'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

type DatePickerProps = {
  value?: string | Date | null;
  onChange: (value: string | null) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
};

function toDate(value?: string | Date | null): Date | undefined {
  if (!value) return undefined;
  if (value instanceof Date) return value;
  // Ensure consistent parsing without timezone shift
  const iso = `${value}T00:00:00`;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? undefined : d;
}

function toISODateString(date: Date | undefined): string | null {
  if (!date) return null;
  // Normalize to YYYY-MM-DD
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function DatePicker({
  value,
  onChange,
  placeholder = 'Выберите дату',
  disabled,
  className
}: DatePickerProps) {
  const selected = toDate(value ?? null);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          type='button'
          variant='outline'
          disabled={disabled}
          className={cn(
            'w-full justify-start text-left font-normal',
            !selected && 'text-muted-foreground',
            className
          )}
        >
          <CalendarIcon className='mr-2 h-4 w-4' />
          {selected ? selected.toLocaleDateString('ru-RU') : placeholder}
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-auto p-0' align='start'>
        <Calendar
          mode='single'
          selected={selected}
          onSelect={(d) => onChange(toISODateString(d))}
          initialFocus
        />
      </PopoverContent>
    </Popover>
  );
}

export default DatePicker;
