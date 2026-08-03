'use client';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { useFieldContext, useFieldInvalid, type BaseFieldProps } from '@/lib/form-context';

/** Single date — Popover + Calendar per the shadcn date-picker pattern. */
export function DatePickerField({
  label,
  description,
  required,
  placeholder = 'Pick a date',
  disabledDates
}: BaseFieldProps & {
  placeholder?: string;
  disabledDates?: (date: Date) => boolean;
}) {
  const field = useFieldContext<Date | undefined>();
  const isInvalid = useFieldInvalid();

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && ' *'}
      </FieldLabel>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              id={field.name}
              variant='outline'
              aria-invalid={isInvalid}
              aria-describedby={isInvalid ? `${field.name}-error` : undefined}
              className={cn(
                'w-full justify-start text-left font-normal',
                !field.state.value && 'text-muted-foreground'
              )}
            />
          }
        >
          <Icons.calendar className='mr-2 h-4 w-4' />
          {field.state.value ? format(field.state.value, 'PPP') : <span>{placeholder}</span>}
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='single'
            selected={field.state.value}
            onSelect={(date) => field.handleChange(date)}
            disabled={disabledDates}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />}
    </Field>
  );
}

/** Date range — two-month Calendar in range mode. */
export function DateRangeField({
  label,
  description,
  required,
  placeholder = 'Pick a date range'
}: BaseFieldProps & { placeholder?: string }) {
  const field = useFieldContext<DateRange | undefined>();
  const isInvalid = useFieldInvalid();
  const range = field.state.value;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && ' *'}
      </FieldLabel>
      <Popover>
        <PopoverTrigger
          render={
            <Button
              id={field.name}
              variant='outline'
              aria-invalid={isInvalid}
              aria-describedby={isInvalid ? `${field.name}-error` : undefined}
              className={cn(
                'w-full justify-start text-left font-normal',
                !range?.from && 'text-muted-foreground'
              )}
            />
          }
        >
          <Icons.calendar className='mr-2 h-4 w-4' />
          {range?.from ? (
            range.to ? (
              <>
                {format(range.from, 'LLL dd, y')} - {format(range.to, 'LLL dd, y')}
              </>
            ) : (
              format(range.from, 'LLL dd, y')
            )
          ) : (
            <span>{placeholder}</span>
          )}
        </PopoverTrigger>
        <PopoverContent className='w-auto p-0' align='start'>
          <Calendar
            mode='range'
            selected={range}
            onSelect={field.handleChange}
            numberOfMonths={2}
            autoFocus
          />
        </PopoverContent>
      </Popover>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />}
    </Field>
  );
}
