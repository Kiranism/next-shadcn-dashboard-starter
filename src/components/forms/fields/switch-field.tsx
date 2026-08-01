'use client';

import { useStore } from '@tanstack/react-form';
import { Switch } from '@/components/ui/switch';
import { FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  createFormField
} from '@/components/ui/form-context';

interface SwitchFieldProps {
  label: string;
  description?: string;
  disabled?: boolean;
}

/** Path value type SwitchField can edit — matches the `as boolean` cast below. */
export type SwitchFieldValue = boolean | null | undefined;

export function SwitchField({ label, description, disabled }: SwitchFieldProps) {
  const field = useFieldContext();
  const value = useStore(field.store, (s) => s.value) as boolean;

  const describedBy =
    [description ? field.formDescriptionId : null, field.isInvalid ? field.formMessageId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <FormFieldSet>
      {/* items-center: the field-content alignment hook flips horizontal
          fields to items-start, and its checkbox/radio optical nudge does not
          cover role=switch — center like the pre-FieldContent layout. */}
      <FormField orientation='horizontal' className='items-center'>
        <FieldContent>
          <FieldLabel htmlFor={field.controlId} className='text-base'>
            {label}
          </FieldLabel>
          {description && (
            <FieldDescription id={field.formDescriptionId}>{description}</FieldDescription>
          )}
          <FormFieldError />
        </FieldContent>
        <Switch
          id={field.controlId}
          name={field.name}
          // ?? false keeps the control CONTROLLED on undefined paths (Base UI
          // latches controlled-ness on first render).
          checked={value ?? false}
          disabled={disabled}
          onCheckedChange={field.handleChange}
          onBlur={field.handleBlur}
          aria-invalid={field.isInvalid}
          aria-describedby={describedBy}
        />
      </FormField>
    </FormFieldSet>
  );
}

/** @deprecated Use useFormFields(form).FormSwitchField — typed and instance-bound. Removed next release. */
export const FormSwitchField = createFormField(SwitchField);
