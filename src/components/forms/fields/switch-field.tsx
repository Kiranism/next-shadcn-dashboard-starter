'use client';

import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldLabel
} from '@/components/ui/field';
import { Switch } from '@/components/ui/switch';
import { useFieldContext, useFieldInvalid, type BaseFieldProps } from '@/lib/form-context';

export function SwitchField({ label, description, required }: BaseFieldProps) {
  const field = useFieldContext<boolean>();
  const isInvalid = useFieldInvalid();

  return (
    <Field orientation='horizontal' data-invalid={isInvalid}>
      <FieldContent>
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && ' *'}
        </FieldLabel>
        {description && <FieldDescription>{description}</FieldDescription>}
        {isInvalid && <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />}
      </FieldContent>
      <Switch
        id={field.name}
        name={field.name}
        checked={field.state.value}
        onCheckedChange={field.handleChange}
        aria-invalid={isInvalid}
        aria-describedby={isInvalid ? `${field.name}-error` : undefined}
      />
    </Field>
  );
}
