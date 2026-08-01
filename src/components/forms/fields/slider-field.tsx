'use client';

import { useStore } from '@tanstack/react-form';
import { Slider } from '@/components/ui/slider';
import { FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  createFormField
} from '@/components/ui/form-context';

interface SliderFieldProps {
  label: string;
  description?: string;
  /** Class for the outer field wrapper (grid placement, spans, …). */
  fieldClassName?: string;
  min?: number;
  max?: number;
  step?: number;
  disabled?: boolean;
  /** Non-interactive but not dimmed — for view-permission display modes. */
  readOnly?: boolean;
  /** Visually hide the label (kept for screen readers). */
  labelSrOnly?: boolean;
}

/** Path value type SliderField can edit — matches the `as number` cast below. */
export type SliderFieldValue = number | null | undefined;

export function SliderField({
  label,
  description,
  fieldClassName,
  min = 0,
  max = 100,
  step = 1,
  disabled,
  readOnly,
  labelSrOnly
}: SliderFieldProps) {
  const field = useFieldContext();
  const value = (useStore(field.store, (s) => s.value) as number) ?? min;
  const labelId = `${field.controlId}-label`;

  const describedBy =
    [description ? field.formDescriptionId : null, field.isInvalid ? field.formMessageId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <FormFieldSet className={fieldClassName}>
      <FormField>
        <FieldLabel id={labelId} className={labelSrOnly ? 'sr-only' : undefined}>
          {label}
        </FieldLabel>
        <div className='px-1'>
          <Slider
            min={min}
            max={max}
            step={step}
            value={[value]}
            disabled={disabled}
            onValueChange={(v) => {
              if (readOnly) return;
              field.handleChange(Array.isArray(v) ? v[0] : v);
            }}
            onBlur={field.handleBlur}
            aria-labelledby={labelId}
            aria-describedby={describedBy}
          />
          <div className='text-muted-foreground mt-1 flex justify-between text-xs tabular-nums'>
            <span>{min}</span>
            <span className='font-medium'>
              {value}/{max}
            </span>
            <span>{max}</span>
          </div>
        </div>
        {description && (
          <FieldDescription id={field.formDescriptionId}>{description}</FieldDescription>
        )}
        <FormFieldError />
      </FormField>
    </FormFieldSet>
  );
}

/** @deprecated Use useFormFields(form).FormSliderField — typed and instance-bound. Removed next release. */
export const FormSliderField = createFormField(SliderField);
