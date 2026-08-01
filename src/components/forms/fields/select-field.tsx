'use client';

import { useStore } from '@tanstack/react-form';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  createFormField
} from '@/components/ui/form-context';

type Option = { value: string; label: string; disabled?: boolean };

interface SelectFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  /** 'horizontal'/'responsive' render label + description + error beside the
   *  trigger (canonical FieldContent anatomy). Default: stacked. */
  orientation?: 'vertical' | 'horizontal' | 'responsive';
}

/** Path value type SelectField can edit — matches the `as string` cast below. */
export type SelectFieldValue = string | null | undefined;

export function SelectField({
  label,
  description,
  required,
  options,
  placeholder = 'Select an option',
  disabled,
  orientation = 'vertical'
}: SelectFieldProps) {
  const field = useFieldContext();
  const value = useStore(field.store, (s) => s.value) as string;

  const describedBy =
    [description ? field.formDescriptionId : null, field.isInvalid ? field.formMessageId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  const control = (
    <Select
      items={options}
      name={field.name}
      // ?? '' keeps the control CONTROLLED when the path starts undefined —
      // Base UI latches controlled-ness on first render (useControlled ref).
      value={value ?? ''}
      disabled={disabled}
      onValueChange={(v) => field.handleChange(v ?? '')}
      onOpenChange={(open) => {
        if (!open) field.handleBlur();
      }}
    >
      <SelectTrigger
        id={field.controlId}
        aria-invalid={field.isInvalid}
        aria-describedby={describedBy}
      >
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );

  if (orientation !== 'vertical') {
    return (
      <FormFieldSet>
        <FormField orientation={orientation}>
          <FieldContent>
            <FieldLabel htmlFor={field.controlId}>
              {label}
              {required && ' *'}
            </FieldLabel>
            {description && (
              <FieldDescription id={field.formDescriptionId}>{description}</FieldDescription>
            )}
            <FormFieldError />
          </FieldContent>
          {control}
        </FormField>
      </FormFieldSet>
    );
  }

  return (
    <FormFieldSet>
      <FormField>
        <FieldLabel htmlFor={field.controlId}>
          {label}
          {required && ' *'}
        </FieldLabel>
        {control}
        {description && (
          <FieldDescription id={field.formDescriptionId}>{description}</FieldDescription>
        )}
      </FormField>
      <FormFieldError />
    </FormFieldSet>
  );
}

/** @deprecated Use useFormFields(form).FormSelectField — typed and instance-bound. Removed next release. */
export const FormSelectField = createFormField(SelectField);
