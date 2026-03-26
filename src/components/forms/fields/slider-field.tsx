'use client';

import { useStore } from '@tanstack/react-form';
import { Slider } from '@/components/ui/slider';
import { FieldDescription, FieldLabel } from '@/components/ui/field';
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  createFormField
} from '@/components/ui/form-context';

interface SliderFieldProps {
  label: string;
  description?: string;
  min?: number;
  max?: number;
  step?: number;
}

export function SliderField({
  label,
  description,
  min = 0,
  max = 100,
  step = 1
}: SliderFieldProps) {
  const field = useFieldContext();
  const value = (useStore(field.store, (s) => s.value) as number) ?? min;

  return (
    <FormFieldSet>
      <FormField>
        <FieldLabel>{label}</FieldLabel>
        <div className='px-1'>
          <Slider
            min={min}
            max={max}
            step={step}
            value={[value]}
            onValueChange={(v) => field.handleChange(v[0])}
            onBlur={field.handleBlur}
          />
          <div className='text-muted-foreground mt-1 flex justify-between text-xs tabular-nums'>
            <span>{min}</span>
            <span className='font-medium'>
              {value}/{max}
            </span>
            <span>{max}</span>
          </div>
        </div>
        {description && <FieldDescription>{description}</FieldDescription>}
      </FormField>
    </FormFieldSet>
  );
}

export const FormSliderField = createFormField(SliderField);
