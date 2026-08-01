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
  /** Class for the outer field wrapper (grid placement, spans, …). */
  fieldClassName?: string;
  required?: boolean;
  options: Option[];
  placeholder?: string;
  disabled?: boolean;
  /** Non-interactive but not dimmed — for view-permission display modes. */
  readOnly?: boolean;
  /** Visually hide the label (kept for screen readers). */
  labelSrOnly?: boolean;
  /** 'horizontal'/'responsive' render label + description + error beside the
   *  trigger (canonical FieldContent anatomy). Default: stacked. */
  orientation?: 'vertical' | 'horizontal' | 'responsive';
}

/** Path value type SelectField can edit — matches the `as string` cast below. */
export type SelectFieldValue = string | null | undefined;

export function SelectField({
  label,
  description,
  fieldClassName,
  required,
  options,
  placeholder = 'Select an option',
  disabled,
  readOnly,
  labelSrOnly,
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
      onValueChange={(v) => {
        if (readOnly) return;
        field.handleChange(v ?? '');
      }}
      onOpenChange={(open) => {
        if (readOnly) return;
        if (!open) field.handleBlur();
      }}
      readOnly={readOnly}
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
      <FormFieldSet className={fieldClassName}>
        <FormField orientation={orientation}>
          <FieldContent>
            <FieldLabel htmlFor={field.controlId} className={labelSrOnly ? 'sr-only' : undefined}>
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
    <FormFieldSet className={fieldClassName}>
      <FormField>
        <FieldLabel htmlFor={field.controlId} className={labelSrOnly ? 'sr-only' : undefined}>
          {label}
          {required && ' *'}
        </FieldLabel>
        {control}
        {description && (
          <FieldDescription id={field.formDescriptionId}>{description}</FieldDescription>
        )}
        <FormFieldError />
      </FormField>
    </FormFieldSet>
  );
}

/** @deprecated Use useFormFields(form).FormSelectField — typed and instance-bound. Removed next release. */
export const FormSelectField = createFormField(SelectField);
