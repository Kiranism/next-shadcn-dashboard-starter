'use client';

import { useStore } from '@tanstack/react-form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLegend,
  FieldLabel,
  FieldSet,
  FieldTitle
} from '@/components/ui/field';
import { useFieldContext, FormFieldError, createFormField } from '@/components/ui/form-context';

type Option = { value: string; label: string; description?: string; disabled?: boolean };

interface RadioGroupFieldProps {
  label: string;
  description?: string;
  /** Class for the outer field wrapper (grid placement, spans, …). */
  fieldClassName?: string;
  required?: boolean;
  options: Option[];
  disabled?: boolean;
  /** Non-interactive but not dimmed — for view-permission display modes. */
  readOnly?: boolean;
  /** 'card' renders each option as a selectable card with title + description
   *  (canonical shadcn anatomy). Defaults to 'card' automatically when any
   *  option carries a description, else 'inline'. */
  variant?: 'inline' | 'card';
}

/** Path value type RadioGroupField can edit — matches the `as string` cast below. */
export type RadioGroupFieldValue = string | null | undefined;

export function RadioGroupField({
  label,
  description,
  fieldClassName,
  required,
  options,
  disabled,
  readOnly,
  variant
}: RadioGroupFieldProps) {
  const field = useFieldContext();
  const value = useStore(field.store, (s) => s.value) as string;
  const legendId = `${field.controlId}-legend`;
  const resolvedVariant = variant ?? (options.some((o) => o.description) ? 'card' : 'inline');

  const describedBy =
    [description ? field.formDescriptionId : null, field.isInvalid ? field.formMessageId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    // A real <fieldset>: this is a semantic GROUP with a legend (canonical
    // Field anatomy reserves fieldset/legend for exactly this).
    <FieldSet data-invalid={field.isInvalid} className={fieldClassName}>
      <FieldLegend variant='label' id={legendId}>
        {label}
        {required && ' *'}
      </FieldLegend>
      {description && (
        <FieldDescription id={field.formDescriptionId}>{description}</FieldDescription>
      )}
      <RadioGroup
        name={field.name}
        // ?? '' keeps the control CONTROLLED on undefined paths (Base UI
        // latches controlled-ness on first render).
        value={value ?? ''}
        disabled={disabled}
        onValueChange={(next) => {
          if (readOnly) return;
          field.handleChange(next);
        }}
        onBlur={field.handleBlur}
        aria-readonly={readOnly || undefined}
        aria-labelledby={legendId}
        aria-describedby={describedBy}
        className={
          resolvedVariant === 'card' ? 'flex flex-col gap-2' : 'flex flex-wrap gap-x-6 gap-y-2'
        }
      >
        {resolvedVariant === 'card'
          ? options.map((opt) => (
              <FieldLabel key={opt.value} htmlFor={`${field.controlId}-${opt.value}`}>
                <Field orientation='horizontal' data-invalid={field.isInvalid}>
                  <FieldContent>
                    <FieldTitle>{opt.label}</FieldTitle>
                    {opt.description && <FieldDescription>{opt.description}</FieldDescription>}
                  </FieldContent>
                  <RadioGroupItem
                    value={opt.value}
                    id={`${field.controlId}-${opt.value}`}
                    disabled={opt.disabled}
                    aria-invalid={field.isInvalid}
                  />
                </Field>
              </FieldLabel>
            ))
          : options.map((opt) => (
              <div key={opt.value} className='flex items-center space-x-2'>
                <RadioGroupItem
                  value={opt.value}
                  id={`${field.controlId}-${opt.value}`}
                  disabled={opt.disabled}
                  aria-invalid={field.isInvalid}
                />
                <Label htmlFor={`${field.controlId}-${opt.value}`}>{opt.label}</Label>
              </div>
            ))}
      </RadioGroup>
      <FormFieldError />
    </FieldSet>
  );
}

/** @deprecated Use useFormFields(form).FormRadioGroupField — typed and instance-bound. Removed next release. */
export const FormRadioGroupField = createFormField(RadioGroupField);
