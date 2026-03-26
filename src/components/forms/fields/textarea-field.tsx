'use client';

import { useStore } from '@tanstack/react-form';
import { Textarea } from '@/components/ui/textarea';
import { FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  createFormField
} from '@/components/ui/form-context';

interface TextareaFieldProps
  extends Omit<
    React.ComponentProps<'textarea'>,
    'value' | 'onChange' | 'onBlur'
  > {
  label: string;
  description?: string;
  required?: boolean;
  maxLength?: number;
  showCount?: boolean;
}

export function TextareaField({
  label,
  description,
  required,
  maxLength,
  showCount = !!maxLength,
  className,
  ...textareaProps
}: TextareaFieldProps) {
  const field = useFieldContext();
  const isTouched = useStore(field.store, (s) => s.meta.isTouched);
  const isValid = useStore(field.store, (s) => s.meta.isValid);
  const value = (useStore(field.store, (s) => s.value) as string) ?? '';

  return (
    <FormFieldSet>
      <FormField>
        <FieldLabel htmlFor={field.name}>
          {label}
          {required && ' *'}
        </FieldLabel>
        <Textarea
          id={field.name}
          value={value}
          onBlur={field.handleBlur}
          onChange={(e) => field.handleChange(e.target.value)}
          maxLength={maxLength}
          aria-invalid={isTouched && !isValid}
          className={className}
          {...textareaProps}
        />
        {showCount && (
          <div className='text-muted-foreground text-right text-xs tabular-nums'>
            {value.length}
            {maxLength ? ` / ${maxLength}` : ''}
          </div>
        )}
        {description && <FieldDescription>{description}</FieldDescription>}
      </FormField>
      <FormFieldError />
    </FormFieldSet>
  );
}

export const FormTextareaField = createFormField(TextareaField);
