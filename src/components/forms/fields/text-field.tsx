'use client';

import * as React from 'react';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Spinner } from '@/components/ui/spinner';
import { useFieldContext, useFieldInvalid, type BaseFieldProps } from '@/lib/form-context';

/**
 * Text-style input (text, email, password, tel, url, time, number).
 * For `type='number'` the value converts at the edge: clearing writes
 * `undefined` so a required `z.number({ error: '…' })` reports a human
 * message instead of a type error.
 */
export function TextField({
  label,
  description,
  required,
  ...inputProps
}: BaseFieldProps & Omit<React.ComponentProps<typeof Input>, 'value' | 'onChange' | 'onBlur'>) {
  const field = useFieldContext<string | number | undefined>();
  const isInvalid = useFieldInvalid();
  const isValidating = field.state.meta.isValidating;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && ' *'}
      </FieldLabel>
      <div className='relative'>
        <Input
          id={field.name}
          name={field.name}
          value={field.state.value ?? ''}
          onBlur={field.handleBlur}
          onChange={(e) =>
            field.handleChange(
              inputProps.type === 'number'
                ? e.target.value === ''
                  ? undefined
                  : Number(e.target.value)
                : e.target.value
            )
          }
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? `${field.name}-error` : undefined}
          {...inputProps}
        />
        {isValidating && <Spinner className='absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2' />}
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />}
    </Field>
  );
}
