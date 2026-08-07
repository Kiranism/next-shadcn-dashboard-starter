'use client';

import * as React from 'react';
import { LoadingButton } from '@/components/ui/loading-button';
import { useFormContext } from '@/lib/form-context';

/** Submit button that shows a no-layout-shift spinner while the form submits. */
export function SubmitButton({
  children,
  disabled,
  ...props
}: React.ComponentProps<typeof LoadingButton>) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <LoadingButton
          type='submit'
          {...props}
          loading={isSubmitting}
          disabled={disabled || isSubmitting}
        >
          {children}
        </LoadingButton>
      )}
    </form.Subscribe>
  );
}
