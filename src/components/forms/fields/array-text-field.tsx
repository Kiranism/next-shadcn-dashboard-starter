'use client';

import * as React from 'react';
import { useStore } from '@tanstack/react-form';
import type { StandardSchemaV1 } from '@tanstack/form-core';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLegend,
  FieldSet
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput
} from '@/components/ui/input-group';
import { Icons } from '@/components/icons';
import {
  useFieldContext,
  useFormContext,
  useArrayFieldApi,
  FormFieldError,
  asArrayField
} from '@/components/ui/form-context';

/** A per-row validator: a Zod/standard schema for a string, or a validate
 *  function receiving the row value — same contract as field validators. */
type ItemValidator =
  | StandardSchemaV1<string, unknown>
  | ((ctx: { value: string }) => string | null | undefined);

interface ArrayTextFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  itemPlaceholder?: string;
  itemType?: 'text' | 'email' | 'url' | 'tel';
  /** Validators for each row, e.g. `{ onBlur: z.string().email() }`. */
  itemValidators?: { onChange?: ItemValidator; onBlur?: ItemValidator };
  maxItems?: number;
  addLabel?: string;
  disabled?: boolean;
  /** Non-interactive but not dimmed — for view-permission display modes. */
  readOnly?: boolean;
  /** Class for the outer field wrapper (grid placement, spans, …). */
  fieldClassName?: string;
}

/** Path value type ArrayTextField can edit — a dynamic list of strings. */
export type ArrayTextFieldValue = string[] | null | undefined;

/** Untyped view of the react form's Field render-prop (see bindFieldComponent). */
interface RowFieldSlotProps {
  name: string;
  validators?: unknown;
  children: (fieldApi: {
    state: { value: unknown; meta: { isTouched: boolean; isValid: boolean; errors: unknown[] } };
    handleChange: (value: unknown) => void;
    handleBlur: () => void;
  }) => React.ReactNode;
}

function ArrayTextBase({
  label,
  description,
  required,
  itemPlaceholder,
  itemType = 'text',
  itemValidators,
  maxItems,
  addLabel = 'Add',
  disabled,
  readOnly,
  fieldClassName
}: ArrayTextFieldProps) {
  const field = useFieldContext();
  const form = useFormContext();
  const values = (useStore(field.store, (s) => s.value) as string[] | undefined) ?? [];
  const hasSubmitted = useStore(form.store, (s) => s.submissionAttempts > 0);
  // Rows are real sub-fields of the SAME form: the row slot is the form's own
  // Field render-prop (bound fields re-provide the live form in context), so
  // per-row validation and error state are native TanStack field state.
  const RowField = (form as unknown as { Field: React.ComponentType<RowFieldSlotProps> }).Field;
  const arrayApi = useArrayFieldApi<string>(field);

  return (
    // data-invalid anchors group-level (array) errors for scrollToFirstError.
    <FieldSet
      data-invalid={field.isInvalid}
      aria-readonly={readOnly || undefined}
      className={fieldClassName}
    >
      <FieldLegend variant='label'>
        {label}
        {required && ' *'}
      </FieldLegend>
      {description && (
        <FieldDescription id={field.formDescriptionId}>{description}</FieldDescription>
      )}
      <FieldGroup className='gap-2'>
        {values.map((_, index) => (
          <RowField key={index} name={`${field.name}[${index}]`} validators={itemValidators}>
            {(sub) => {
              const rowInvalid =
                !sub.state.meta.isValid && (sub.state.meta.isTouched || hasSubmitted);
              const rowErrors = sub.state.meta.errors.map((error) =>
                typeof error === 'string' ? { message: error } : error
              );
              const rowMessageId = `${field.controlId}-${index}-message`;
              return (
                <Field orientation='horizontal' data-invalid={rowInvalid}>
                  <FieldContent>
                    <InputGroup>
                      <InputGroupInput
                        id={`${field.controlId}-${index}`}
                        type={itemType}
                        value={(sub.state.value as string) ?? ''}
                        onChange={(e) => {
                          if (readOnly) return;
                          sub.handleChange(e.target.value);
                        }}
                        onBlur={sub.handleBlur}
                        aria-label={`${label} ${index + 1}`}
                        aria-invalid={rowInvalid}
                        aria-describedby={rowInvalid ? rowMessageId : undefined}
                        placeholder={itemPlaceholder}
                        disabled={disabled}
                      />
                      {values.length > 1 && (
                        <InputGroupAddon align='inline-end'>
                          <InputGroupButton
                            type='button'
                            variant='ghost'
                            size='icon-xs'
                            onClick={() => {
                              if (readOnly) return;
                              arrayApi.removeValue(index);
                            }}
                            aria-label={`Remove ${label} ${index + 1}`}
                            disabled={disabled}
                          >
                            <Icons.close />
                          </InputGroupButton>
                        </InputGroupAddon>
                      )}
                    </InputGroup>
                    {rowInvalid && (
                      <FieldError
                        id={rowMessageId}
                        className='text-destructive text-sm'
                        errors={rowErrors as { message?: string }[]}
                      />
                    )}
                  </FieldContent>
                </Field>
              );
            }}
          </RowField>
        ))}
      </FieldGroup>
      <div>
        <Button
          type='button'
          variant='outline'
          size='sm'
          onClick={() => {
            if (readOnly) return;
            arrayApi.pushValue('');
          }}
          disabled={disabled || (maxItems !== undefined && values.length >= maxItems)}
        >
          {addLabel}
        </Button>
      </div>
      <FormFieldError />
    </FieldSet>
  );
}

/** Dynamic list of text inputs editing a string[] path (canonical shadcn
 *  anatomy: InputGroup rows with inline remove, per-row validation, add
 *  button that disables at maxItems). Mounts in array mode automatically. */
export const ArrayTextField = asArrayField(ArrayTextBase);
