'use client';

import { useStore } from '@tanstack/react-form';
import { Textarea } from '@/components/ui/textarea';
import { FieldContent, FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  createFormField
} from '@/components/ui/form-context';

interface TextareaFieldProps extends Omit<
  React.ComponentProps<'textarea'>,
  'value' | 'onChange' | 'onBlur'
> {
  label: string;
  description?: string;
  required?: boolean;
  maxLength?: number;
  showCount?: boolean;
  /** Visually hide the label (kept for screen readers). */
  labelSrOnly?: boolean;
  /** 'horizontal'/'responsive' render label + description + error beside the
   *  textarea (canonical FieldContent anatomy). Default: stacked. */
  orientation?: 'vertical' | 'horizontal' | 'responsive';
}

/** Path value type TextareaField can edit — matches the `as string` cast below. */
export type TextareaFieldValue = string | null | undefined;

export function TextareaField({
  label,
  description,
  required,
  maxLength,
  showCount = !!maxLength,
  labelSrOnly,
  orientation = 'vertical',
  className,
  ...textareaProps
}: TextareaFieldProps) {
  const field = useFieldContext();
  const value = (useStore(field.store, (s) => s.value) as string) ?? '';

  const describedBy =
    [description ? field.formDescriptionId : null, field.isInvalid ? field.formMessageId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  const control = (
    <div className={orientation === 'vertical' ? 'w-full' : 'min-w-0 flex-1'}>
      <Textarea
        id={field.controlId}
        name={field.name}
        value={value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        maxLength={maxLength}
        aria-invalid={field.isInvalid}
        aria-describedby={describedBy}
        className={className}
        {...textareaProps}
      />
      {showCount && (
        <div className='text-muted-foreground text-right text-xs tabular-nums'>
          {value.length}
          {maxLength ? ` / ${maxLength}` : ''}
        </div>
      )}
    </div>
  );

  if (orientation !== 'vertical') {
    return (
      <FormFieldSet>
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
    <FormFieldSet>
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

/** @deprecated Use useFormFields(form).FormTextareaField — typed and instance-bound. Removed next release. */
export const FormTextareaField = createFormField(TextareaField);
