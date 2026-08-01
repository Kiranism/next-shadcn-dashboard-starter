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
  /** Class for the outer field wrapper (grid placement, spans, …). */
  fieldClassName?: string;
  required?: boolean;
  maxSize?: number;
  maxFiles?: number;
  disabled?: boolean;
  /** Non-interactive but not dimmed — for view-permission display modes. */
  readOnly?: boolean;
}

/** Path value type FileUploadField can edit — matches the `as File[] | undefined` cast below. */
export type FileUploadFieldValue = File[] | null | undefined;

export function FileUploadField({
  label,
  description,
  fieldClassName,
  required,
  maxSize,
  maxFiles,
  disabled,
  readOnly
}: FileUploadFieldProps) {
  const field = useFieldContext();
  const value = useStore(field.store, (s) => s.value) as File[] | undefined;
  const labelId = `${field.controlId}-label`;

  const describedBy =
    [description ? field.formDescriptionId : null, field.isInvalid ? field.formMessageId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <FormFieldSet className={fieldClassName}>
      <FormField>
        {/* The dropzone is a region, not a labellable control — associate it
            via aria-labelledby on the FileUploader root instead of htmlFor. */}
        <FieldLabel id={labelId}>
          {label}
          {required && ' *'}
        </FieldLabel>
        <div onBlur={field.handleBlur}>
          <FileUploader
            value={value}
            onValueChange={(files) => {
              if (readOnly) return;
              field.handleChange(files);
            }}
            maxSize={maxSize}
            maxFiles={maxFiles}
            disabled={disabled}
            aria-labelledby={labelId}
            aria-invalid={field.isInvalid}
            aria-describedby={describedBy}
            aria-readonly={readOnly || undefined}
          />
        </div>
        {description && (
          <FieldDescription id={field.formDescriptionId}>{description}</FieldDescription>
        )}
        <FormFieldError />
      </FormField>
    </FormFieldSet>
  );
}

/** @deprecated Use useFormFields(form).FormFileUploadField — typed and instance-bound. Removed next release. */
export const FormFileUploadField = createFormField(FileUploadField);
