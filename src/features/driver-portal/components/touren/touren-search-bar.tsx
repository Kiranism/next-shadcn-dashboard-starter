'use client';

/**
 * TourenSearchBar — controlled text input for searching trips by
 * passenger name or address on the Touren page.
 *
 * Debounces the onChange callback by 300 ms so that the Touren page
 * doesn't re-query Supabase on every keystroke.
 */

import { Input } from '@/components/ui/input';
import { IconSearch, IconX } from '@tabler/icons-react';
import { useEffect, useRef, useState } from 'react';

interface TourenSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const DEBOUNCE_MS = 300;

export function TourenSearchBar({
  value,
  onChange,
  placeholder = 'Name oder Adresse suchen…'
}: TourenSearchBarProps) {
  // Internal state tracks the raw input; we debounce before calling onChange
  const [localValue, setLocalValue] = useState(value);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep local in sync when the parent resets it
  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const next = e.target.value;
    setLocalValue(next);

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onChange(next);
    }, DEBOUNCE_MS);
  };

  const handleClear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setLocalValue('');
    onChange('');
  };

  return (
    <div className='relative'>
      <IconSearch className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
      <Input
        type='search'
        inputMode='search'
        className='h-11 pr-9 pl-9 text-base'
        placeholder={placeholder}
        value={localValue}
        onChange={handleChange}
        aria-label='Suche'
      />
      {localValue.length > 0 && (
        <button
          type='button'
          className='text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2 transition-colors'
          onClick={handleClear}
          aria-label='Suche zurücksetzen'
        >
          <IconX className='h-4 w-4' />
        </button>
      )}
    </div>
  );
}
