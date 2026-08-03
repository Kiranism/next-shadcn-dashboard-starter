'use client';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel
} from '@/components/ui/field';
import { useFieldContext, useFieldInvalid, type BaseFieldProps } from '@/lib/form-context';

/** Single boolean checkbox (terms, consent, …). */
export function CheckboxField({ label, description, required }: BaseFieldProps) {
  const field = useFieldContext<boolean>();
  const isInvalid = useFieldInvalid();

  return (
    <Field orientation='horizontal' data-invalid={isInvalid}>
      <Checkbox
        id={field.name}
        name={field.name}
        checked={field.state.value}
        onCheckedChange={(checked) => field.handleChange(checked === true)}
        aria-invalid={isInvalid}
        aria-describedby={isInvalid ? `${field.name}-error` : undefined}
      />
      <FieldContent>
        <FieldLabel htmlFor={field.name} className='font-normal'>
          {label}
          {required && ' *'}
        </FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
        {isInvalid && <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />}
      </FieldContent>
    </Field>
  );
}
