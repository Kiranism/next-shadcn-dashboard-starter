'use client';

import * as React from 'react';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Textarea } from '@/components/ui/textarea';
import { useFieldContext, useFieldInvalid, type BaseFieldProps } from '@/lib/form-context';

export function TextareaField({
  label,
  description,
  required,
  showCount,
  ...textareaProps
}: BaseFieldProps & {
  /** Show a character counter (uses `maxLength` as the denominator). */
  showCount?: boolean;
} & Omit<React.ComponentProps<typeof Textarea>, 'value' | 'onChange' | 'onBlur'>) {
  const field = useFieldContext<string>();
  const isInvalid = useFieldInvalid();

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && ' *'}
      </FieldLabel>
      <Textarea
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        aria-describedby={isInvalid ? `${field.name}-error` : undefined}
        {...textareaProps}
      />
      {showCount && textareaProps.maxLength && (
        <div className='text-muted-foreground text-right text-sm'>
          {field.state.value?.length || 0} / {textareaProps.maxLength}
        </div>
      )}
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />}
    </Field>
  );
}
