'use client';

import * as React from 'react';
import { useStore } from '@tanstack/react-form';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { FieldDescription, FieldLabel } from '@/components/ui/field';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  FormFieldError
} from '@/components/ui/form-context';

interface DatePickerFieldProps {
  label: string;
  description?: string;
  /** Class for the outer field wrapper (grid placement, spans, …). */
  fieldClassName?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  /** Non-interactive but not dimmed — for view-permission display modes. */
  readOnly?: boolean;
  /** Visually hide the label (kept for screen readers). */
  labelSrOnly?: boolean;
  /** Restrict selectable dates, e.g. (date) => date < new Date(). */
  disabledDates?: (date: Date) => boolean;
}

/** Path value type DatePickerField can edit — a Date (Date is atomic, so no
 *  Date sub-paths ever appear as fields). */
export type DatePickerFieldValue = Date | null | undefined;

export function DatePickerField({
  label,
  description,
  fieldClassName,
  required,
  placeholder = 'Pick a date',
  disabled,
  readOnly,
  labelSrOnly,
  disabledDates
}: DatePickerFieldProps) {
  const field = useFieldContext();
  const value = useStore(field.store, (s) => s.value) as Date | null | undefined;
  const [open, setOpen] = React.useState(false);

  const describedBy =
    [description ? field.formDescriptionId : null, field.isInvalid ? field.formMessageId : null]
      .filter(Boolean)
      .join(' ') || undefined;

  return (
    <FormFieldSet className={fieldClassName}>
      <FormField>
        <FieldLabel htmlFor={field.controlId} className={labelSrOnly ? 'sr-only' : undefined}>
          {label}
          {required && ' *'}
        </FieldLabel>
        <Popover
          open={open}
          onOpenChange={(next) => {
            if (readOnly) return;
            setOpen(next);
            if (!next) field.handleBlur();
          }}
        >
          <PopoverTrigger
            render={
              <Button
                id={field.controlId}
                variant='outline'
                disabled={disabled}
                aria-readonly={readOnly || undefined}
                aria-invalid={field.isInvalid}
                aria-describedby={describedBy}
                className={cn(
                  'w-full justify-start text-left font-normal',
                  !value && 'text-muted-foreground'
                )}
              />
            }
          >
            <Icons.calendar className='mr-2 h-4 w-4' />
            {value ? format(value, 'PPP') : <span>{placeholder}</span>}
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <Calendar
              mode='single'
              selected={value ?? undefined}
              onSelect={(date) => {
                // Write the Calendar value verbatim (undefined on clear) — an
                // optional Date path stays type-true; use .nullish() schemas
                // for nullable DB-backed dates.
                field.handleChange(date);
                setOpen(false);
              }}
              disabled={disabledDates}
              autoFocus
            />
          </PopoverContent>
        </Popover>
        {description && (
          <FieldDescription id={field.formDescriptionId}>{description}</FieldDescription>
        )}
        <FormFieldError />
      </FormField>
    </FormFieldSet>
  );
}
