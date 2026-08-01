'use client';

import { useStore } from '@tanstack/react-form';
import { FileUploader } from '@/components/file-uploader';
import { FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  createFormField
} from '@/components/ui/form-context';

interface FileUploadFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
}

/** Path value type FileUploadField can edit — matches the `as File[] | undefined` cast below. */
export type FileUploadFieldValue = File[] | null | undefined;

export function FileUploadField({
  label,
  description,
  required,
  maxSize,
  maxFiles,
  disabled
}: FileUploadFieldProps) {
  const field = useFieldContext();
  const value = useStore(field.store, (s) => s.value) as File[] | undefined;

  return (
    <FormFieldSet>
      <FormField>
        {/* No htmlFor: FileUploader renders a dropzone region, not a
            labellable control — the visible label text is the association. */}
        <FieldLabel>
          {label}
          {required && ' *'}
        </FieldLabel>
        <div onBlur={field.handleBlur}>
          <FileUploader
            value={value}
            onValueChange={field.handleChange}
            maxSize={maxSize}
            maxFiles={maxFiles}
            disabled={disabled}
          />
        </div>
        {description && (
          <FieldDescription id={field.formDescriptionId}>{description}</FieldDescription>
        )}
      </FormField>
      <FormFieldError />
    </FormFieldSet>
  );
}

/** @deprecated Use useFormFields(form).FormFileUploadField — typed and instance-bound. Removed next release. */
export const FormFileUploadField = createFormField(FileUploadField);
