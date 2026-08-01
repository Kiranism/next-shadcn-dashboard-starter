'use client';

import { useStore } from '@tanstack/react-form';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend
} from '@/components/ui/field';
import {
  useFieldContext,
  FormFieldSet,
  FormFieldError,
  asArrayField
} from '@/components/ui/form-context';

type Option = { value: string; label: string; description?: string; disabled?: boolean };

interface CheckboxGroupFieldProps {
  label: string;
  description?: string;
  required?: boolean;
  options: Option[];
  disabled?: boolean;
  /** Lay options out in N columns (default: single column). */
  columns?: number;
  /** Layout class for the options grid — overrides `columns` (e.g.
   *  'grid grid-cols-2 gap-3 md:grid-cols-3' for responsive columns). */
  className?: string;
}

/** Path value type CheckboxGroupField can edit — a multi-select string array. */
export type CheckboxGroupFieldValue = string[] | null | undefined;

function CheckboxGroupBase({
  label,
  description,
  required,
  options,
  disabled,
  columns,
  className
}: CheckboxGroupFieldProps) {
  const field = useFieldContext();
  const values = (useStore(field.store, (s) => s.value) as string[] | undefined) ?? [];

  const describedBy =
    [description ? field.formDescriptionId : null, field.isInvalid ? field.formMessageId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  // Clamp to a sane integer grid (2-6); anything else = single column.
  const cols =
    columns && Number.isFinite(columns) && Math.floor(columns) > 1
      ? Math.min(Math.floor(columns), 6)
      : undefined;
  // Array field API — present at runtime under mode='array' (asArrayField);
  // the context's generic types can't express it, hence the local view.
  const arrayApi = field as unknown as {
    pushValue: (value: string) => void;
    removeValue: (index: number) => void;
  };

  const toggle = (optValue: string, checked: boolean) => {
    if (checked) {
      arrayApi.pushValue(optValue);
    } else {
      const idx = values.indexOf(optValue);
      if (idx > -1) arrayApi.removeValue(idx);
    }
    field.handleBlur();
  };

  return (
    <FormFieldSet data-invalid={field.isInvalid} aria-describedby={describedBy}>
      <FieldLegend variant='label'>
        {label}
        {required && ' *'}
      </FieldLegend>
      {description && (
        <FieldDescription id={field.formDescriptionId}>{description}</FieldDescription>
      )}
      <FieldGroup
        data-slot='checkbox-group'
        className={className ?? (cols ? 'grid gap-3' : undefined)}
        style={
          !className && cols
            ? { gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }
            : undefined
        }
      >
        {options.map((opt) => (
          <Field key={opt.value} orientation='horizontal' data-invalid={field.isInvalid}>
            <Checkbox
              id={`${field.controlId}-${opt.value}`}
              checked={values.includes(opt.value)}
              disabled={disabled || opt.disabled}
              onCheckedChange={(checked) => toggle(opt.value, checked === true)}
              aria-invalid={field.isInvalid}
            />
            {opt.description ? (
              <FieldContent>
                <FieldLabel
                  htmlFor={`${field.controlId}-${opt.value}`}
                  className='font-normal leading-none'
                >
                  {opt.label}
                </FieldLabel>
                <FieldDescription>{opt.description}</FieldDescription>
              </FieldContent>
            ) : (
              <FieldLabel htmlFor={`${field.controlId}-${opt.value}`} className='font-normal'>
                {opt.label}
              </FieldLabel>
            )}
          </Field>
        ))}
      </FieldGroup>
      <FormFieldError />
    </FormFieldSet>
  );
}

/** Multi-select checkbox group editing a string[] path (canonical shadcn
 *  anatomy: FieldSet + FieldLegend + checkbox-group FieldGroup). Mounts in
 *  array mode automatically — no config needed at the usage site. */
export const CheckboxGroupField = asArrayField(CheckboxGroupBase);
