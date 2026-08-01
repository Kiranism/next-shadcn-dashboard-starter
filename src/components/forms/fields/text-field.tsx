'use client';

import { useStore } from '@tanstack/react-form';
import { Input } from '@/components/ui/input';
import { FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  createFormField
} from '@/components/ui/form-context';
import { Spinner } from '@/components/ui/spinner';

interface TextFieldProps extends Omit<
  React.ComponentProps<'input'>,
  'value' | 'onChange' | 'onBlur'
> {
  label: string;
  description?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number';
  /** 'horizontal'/'responsive' render label + description + error beside the
   *  input (canonical FieldContent anatomy). Default: stacked. */
  orientation?: 'vertical' | 'horizontal' | 'responsive';
}

/** Path value type TextField can edit — matches the `as string | number`
 *  cast below; `number` covers type='number', null/undefined cover optional
 *  and nullable schema fields (rendered as ''). Widen deliberately if you
 *  change the component's value handling. */
export type TextFieldValue = string | number | null | undefined;

export function TextField({
  label,
  description,
  required,
  type = 'text',
  orientation = 'vertical',
  className,
  ...inputProps
}: TextFieldProps) {
  const field = useFieldContext();
  const isValidating = useStore(field.store, (s) => s.meta.isValidating);
  const value = useStore(field.store, (s) => s.value) as string | number;

  const describedBy =
    [description ? field.formDescriptionId : null, field.isInvalid ? field.formMessageId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  const control = (
    <div className='relative'>
      <Input
        id={field.controlId}
        name={field.name}
        type={type}
        value={value ?? ''}
        onBlur={field.handleBlur}
        onChange={(e) => {
          if (type === 'number') {
            const v = e.target.value;
            field.handleChange(v === '' ? '' : parseFloat(v));
          } else {
            field.handleChange(e.target.value);
          }
        }}
        aria-invalid={field.isInvalid}
        aria-describedby={describedBy}
        className={className}
        {...inputProps}
      />
      {isValidating && (
        <div className='absolute top-1/2 right-3 -translate-y-1/2'>
          <Spinner className='h-4 w-4' />
        </div>
      )}
    </div>
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

/** @deprecated Use useFormFields(form).FormTextField — typed and instance-bound. Removed next release. */
export const FormTextField = createFormField(TextField);
