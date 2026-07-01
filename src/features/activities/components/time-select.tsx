'use client';

import { useMemo } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

/** Time options at 30-minute steps: 00:00, 00:30, … 23:30 */
const TIME_OPTIONS = Array.from({ length: 48 }, (_, i) => {
  const hour = String(Math.floor(i / 2)).padStart(2, '0');
  const minute = i % 2 === 0 ? '00' : '30';
  return `${hour}:${minute}`;
});

interface TimeSelectProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
}

export function TimeSelect({ value, onChange, disabled, className }: TimeSelectProps) {
  // Keep an off-grid value (e.g. an older 08:05) selectable so editing never drops it.
  const options = useMemo(() => {
    if (value && !TIME_OPTIONS.includes(value)) {
      return [...TIME_OPTIONS, value].toSorted((a, b) => a.localeCompare(b));
    }
    return TIME_OPTIONS;
  }, [value]);

  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className={cn('w-full', className)}>
        <span className='flex items-center gap-2'>
          <Icons.clock className='text-muted-foreground size-4 shrink-0' />
          <SelectValue placeholder='--:--' />
        </span>
      </SelectTrigger>
      <SelectContent className='max-h-60'>
        {options.map((t) => (
          <SelectItem key={t} value={t} className='tabular-nums'>
            {t}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
