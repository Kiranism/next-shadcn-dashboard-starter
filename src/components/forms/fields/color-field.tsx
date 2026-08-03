'use client';

import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { useFieldContext, type BaseFieldProps } from '@/lib/form-context';

/** Native color picker with a hex text input beside it. */
export function ColorField({ label, description }: Omit<BaseFieldProps, 'required'>) {
  const field = useFieldContext<string>();

  return (
    <Field>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <div className='flex items-center gap-3'>
        <input
          id={field.name}
          aria-label={label}
          type='color'
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          className='h-9 w-12 cursor-pointer rounded-md border p-1'
        />
        <Input
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
          className='w-28 font-mono'
          placeholder='#000000'
          aria-label={`${label} hex value`}
        />
      </div>
      {description && <FieldDescription>{description}</FieldDescription>}
    </Field>
  );
}
