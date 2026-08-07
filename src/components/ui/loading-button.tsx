'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

export interface LoadingButtonProps extends Omit<React.ComponentProps<typeof Button>, 'className'> {
  /** When true, overlays a spinner and disables the button. */
  loading?: boolean;
  /** Polite screen-reader announcement while loading. */
  loadingLabel?: string;
  className?: string;
}

/**
 * A `Button` with a built-in loading state. The spinner is overlaid on top of
 * the label, which stays in layout (`opacity-0`) while loading — so toggling
 * `loading` never changes the button's size and there's no layout shift.
 * Inherits every Button `variant` / `size` and the theme tokens.
 */
export function LoadingButton({
  loading = false,
  loadingLabel = 'Loading…',
  disabled,
  className,
  children,
  ...props
}: LoadingButtonProps) {
  const gap = props.size === 'sm' || props.size === 'xs' ? 'gap-1' : 'gap-1.5';
  return (
    <>
      <Button
        {...props}
        disabled={disabled || loading}
        aria-busy={loading || undefined}
        className={cn('relative', loading && 'disabled:opacity-100', className)}
      >
        {loading && <Spinner aria-hidden className='absolute inset-0 m-auto' />}
        <span className={cn('inline-flex items-center', gap, loading && 'opacity-0')}>
          {children}
        </span>
      </Button>
      <span role='status' aria-live='polite' className='sr-only'>
        {loading ? loadingLabel : ''}
      </span>
    </>
  );
}
