'use client';

import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@/components/ui/field';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useFieldContext, useFieldInvalid, type BaseFieldProps } from '@/lib/form-context';

export function RadioGroupField({
  label,
  description,
  required,
  options
}: BaseFieldProps & {
  options: { value: string; label: string; disabled?: boolean }[];
}) {
  const field = useFieldContext<string>();
  const isInvalid = useFieldInvalid();

  return (
    <FieldSet>
      <FieldLegend variant='label'>
        {label}
        {required && ' *'}
      </FieldLegend>
      {description && <FieldDescription>{description}</FieldDescription>}
      <RadioGroup
        name={field.name}
        value={field.state.value}
        onValueChange={field.handleChange}
        onBlur={field.handleBlur}
        className='flex flex-wrap gap-x-6 gap-y-2'
      >
        {options.map((opt) => (
          <Field
            key={opt.value}
            orientation='horizontal'
            data-invalid={isInvalid}
            className='w-auto'
          >
            <RadioGroupItem
              value={opt.value}
              id={`${field.name}-${opt.value}`}
              disabled={opt.disabled}
              aria-invalid={isInvalid}
              aria-describedby={isInvalid ? `${field.name}-error` : undefined}
            />
            <FieldLabel htmlFor={`${field.name}-${opt.value}`} className='font-normal'>
              {opt.label}
            </FieldLabel>
          </Field>
        ))}
      </RadioGroup>
      {isInvalid && <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />}
    </FieldSet>
  );
}
