'use client';

import { FileUploader } from '@/components/file-uploader';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { useFieldContext, useFieldInvalid, type BaseFieldProps } from '@/lib/form-context';

export function FileUploadField({
  label,
  description,
  required,
  maxSize = 5 * 1024 * 1024,
  maxFiles = 1
}: BaseFieldProps & {
  maxSize?: number;
  maxFiles?: number;
}) {
  const field = useFieldContext<File[] | undefined>();
  const isInvalid = useFieldInvalid();

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && ' *'}
      </FieldLabel>
      <FileUploader
        value={field.state.value}
        onValueChange={(files) =>
          field.handleChange(typeof files === 'function' ? files(field.state.value ?? []) : files)
        }
        maxSize={maxSize}
        maxFiles={maxFiles}
      />
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />}
    </Field>
  );
}
