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
  // id/name/aria-* are wired by the field system — a caller-supplied id
  // would sever the label/description/error pairing, so they're not props.
  'value' | 'onChange' | 'onBlur' | 'id' | 'name' | 'aria-invalid' | 'aria-describedby'
> {
  label: string;
  description?: string;
  /** Class for the outer field wrapper (grid placement, spans, …). */
  fieldClassName?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'password' | 'tel' | 'url' | 'number';
  /** Visually hide the label (kept for screen readers) — for dense grids. */
  labelSrOnly?: boolean;
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
  fieldClassName,
  required,
  type = 'text',
  labelSrOnly,
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
    // flex-1/min-w-0 in side-by-side orientations: the input fills the row
    // remainder instead of collapsing to content width.
    <div className={orientation === 'vertical' ? 'relative' : 'relative min-w-0 flex-1'}>
      <Input
        id={field.controlId}
        name={field.name}
        type={type}
        value={value ?? ''}
        onBlur={field.handleBlur}
        onChange={(e) => {
          if (type === 'number') {
            const v = e.target.value;
            // Clearing writes undefined (not ''): optional number schemas
            // pass, and required z.number() reports a missing value instead
            // of the confusing 'expected number, received string'.
            field.handleChange(v === '' ? undefined : parseFloat(v));
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

/** @deprecated Use useFormFields(form).FormTextField — typed and instance-bound. Removed next release. */
export const FormTextField = createFormField(TextField);
