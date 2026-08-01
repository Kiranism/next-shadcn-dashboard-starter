'use client';

import { useStore } from '@tanstack/react-form';
import { Checkbox } from '@/components/ui/checkbox';
import { FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  createFormField
} from '@/components/ui/form-context';

interface CheckboxFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  /** Non-interactive but not dimmed — for view-permission display modes. */
  readOnly?: boolean;
}

/** Path value type CheckboxField can edit — matches the `as boolean` cast below. */
export type CheckboxFieldValue = boolean | null | undefined;

export function CheckboxField({
  label,
  description,
  required,
  disabled,
  readOnly
}: CheckboxFieldProps) {
  const field = useFieldContext();
  const value = useStore(field.store, (s) => s.value) as boolean;

  const describedBy =
    [description ? field.formDescriptionId : null, field.isInvalid ? field.formMessageId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <FormFieldSet>
      <FormField orientation='horizontal'>
        <Checkbox
          id={field.controlId}
          name={field.name}
          // ?? false keeps the control CONTROLLED on undefined paths (Base UI
          // latches controlled-ness on first render).
          checked={value ?? false}
          disabled={disabled}
          onCheckedChange={(checked) => {
            if (readOnly) return;
            field.handleChange(checked as boolean);
            field.handleBlur();
          }}
          aria-readonly={readOnly || undefined}
          aria-invalid={field.isInvalid}
          aria-describedby={describedBy}
        />
        <FieldContent>
          <FieldLabel htmlFor={field.controlId} className='leading-none'>
            {label}
            {required && ' *'}
          </FieldLabel>
          {description && (
            <FieldDescription id={field.formDescriptionId}>{description}</FieldDescription>
          )}
          <FormFieldError />
        </FieldContent>
      </FormField>
    </FormFieldSet>
  );
}

/** @deprecated Use useFormFields(form).FormCheckboxField — typed and instance-bound. Removed next release. */
export const FormCheckboxField = createFormField(CheckboxField);
