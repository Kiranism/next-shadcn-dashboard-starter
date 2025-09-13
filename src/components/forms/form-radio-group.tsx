'use client';

import { FieldPath, FieldValues } from 'react-hook-form';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { BaseFormFieldProps, RadioGroupOption } from '@/types/base-form';

interface FormRadioGroupProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
> extends BaseFormFieldProps<TFieldValues, TName> {
  options: RadioGroupOption[];
  orientation?: 'horizontal' | 'vertical';
}

function FormRadioGroup<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>
>({
  control,
  name,
  label,
  description,
  required,
  options,
  orientation = 'vertical',
  disabled,
  className
}: FormRadioGroupProps<TFieldValues, TName>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && (
            <FormLabel>
              {label}
              {required && <span className='ml-1 text-red-500'>*</span>}
            </FormLabel>
          )}
          {description && <FormDescription>{description}</FormDescription>}
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              disabled={disabled}
              className={
                orientation === 'horizontal'
                  ? 'flex flex-row space-x-6'
                  : 'space-y-2'
              }
            >
              {options.map((option) => (
                <div key={option.value} className='flex items-center space-x-2'>
                  <RadioGroupItem
                    value={option.value}
                    id={`${name}-${option.value}`}
                    disabled={option.disabled}
                  />
                  <Label
                    htmlFor={`${name}-${option.value}`}
                    className='text-sm leading-none font-medium peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                  >
                    {option.label}
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export { FormRadioGroup, type RadioGroupOption };
