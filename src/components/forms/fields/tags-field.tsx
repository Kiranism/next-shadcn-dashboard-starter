'use client';

import * as React from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Icons } from '@/components/icons';
import { useFieldContext, useFieldInvalid, type BaseFieldProps } from '@/lib/form-context';

/**
 * Free-text tag list over a `string[]` value. Use with `mode='array'` on the
 * `<form.AppField>` — Enter or the Add button pushes, badges remove.
 */
export function TagsField({
  label,
  description,
  required,
  placeholder = 'Type and press Enter...'
}: BaseFieldProps & { placeholder?: string }) {
  const field = useFieldContext<string[]>();
  const isInvalid = useFieldInvalid();
  const [tagInput, setTagInput] = React.useState('');
  const values = field.state.value || [];

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !values.includes(tag)) {
      field.pushValue(tag);
      setTagInput('');
    }
  };

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel>
        {label}
        {required && ' *'}
      </FieldLabel>
      <div className='flex gap-2'>
        <Input
          value={tagInput}
          onChange={(e) => setTagInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              addTag();
            }
          }}
          placeholder={placeholder}
          aria-label={`Add a ${label.toLowerCase().replace(/ \*$/, '')}`}
          aria-invalid={isInvalid}
          aria-describedby={isInvalid ? `${field.name}-error` : undefined}
        />
        <Button type='button' variant='secondary' onClick={addTag}>
          Add
        </Button>
      </div>
      {values.length > 0 && (
        <div className='flex flex-wrap gap-2'>
          {values.map((tag, idx) => (
            <Badge key={tag} variant='secondary' className='gap-1'>
              {tag}
              <button
                type='button'
                onClick={() => field.removeValue(idx)}
                aria-label={`Remove ${tag}`}
                className='hover:text-destructive ml-0.5'
              >
                <Icons.close className='h-3 w-3' />
              </button>
            </Badge>
          ))}
        </div>
      )}
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />}
    </Field>
  );
}
