'use client';

/**
 * R6 probe support: a FEATURE-LOCAL custom field, written the way a fork
 * user would — base component reads useFieldContext, then one fieldFor()
 * brand to join the typed registry. Zero template-owned files edited.
 */

import * as React from 'react';
import { useStore } from '@tanstack/react-form';
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  FormFieldError
} from '@/components/ui/form-context';
import { FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { fieldFor } from '@/components/ui/tanstack-form';

interface DatePickerBaseProps {
  label: string;
  description?: string;
  required?: boolean;
}

function DatePickerBase({ label, description, required }: DatePickerBaseProps) {
  const field = useFieldContext();
  const value = useStore(field.store, (s) => s.value) as Date | null | undefined;

  return (
    <FormFieldSet>
      <FormField>
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && ' *'}
        </FieldLabel>
        <Input
          id={field.name}
          type='date'
          value={value ? value.toISOString().slice(0, 10) : ''}
          onChange={(e) => field.handleChange(e.target.value ? new Date(e.target.value) : null)}
          onBlur={field.handleBlur}
        />
        {description && <FieldDescription>{description}</FieldDescription>}
      </FormField>
      <FormFieldError />
    </FormFieldSet>
  );
}

/** The one-line brand that admits this field to useFormFields' typed registry. */
export const DatePickerField = fieldFor<Date | null | undefined>()(DatePickerBase);

/** Deliberately UNBRANDED twin — used to prove the registry rejects it. */
export const UnbrandedDatePickerField = DatePickerBase;
