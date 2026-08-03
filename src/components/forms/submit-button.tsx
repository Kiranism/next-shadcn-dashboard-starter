'use client';

import * as React from 'react';
import type { VariantProps } from 'class-variance-authority';
import { Button, type buttonVariants } from '@/components/ui/button';
import { useFormContext } from '@/lib/form-context';

/** Submit button that disables while the form is submitting. */
export function SubmitButton({
  children,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => state.isSubmitting}>
      {(isSubmitting) => (
        <Button {...props} type='submit' disabled={props.disabled || isSubmitting}>
          {children}
        </Button>
      )}
    </form.Subscribe>
  );
}
