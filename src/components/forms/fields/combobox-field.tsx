'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';
import { useFieldContext, useFieldInvalid, type BaseFieldProps } from '@/lib/form-context';

/** Searchable select — Popover + Command per the shadcn combobox pattern. */
export function ComboboxField({
  label,
  description,
  required,
  options,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.'
}: BaseFieldProps & {
  options: { value: string; label: string; disabled?: boolean }[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
}) {
  const field = useFieldContext<string>();
  const isInvalid = useFieldInvalid();
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === field.state.value);
  const listboxId = `${field.name}-listbox`;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>
        {label}
        {required && ' *'}
      </FieldLabel>
      <Popover
        open={open}
        onOpenChange={(next) => {
          setOpen(next);
          if (!next) field.handleBlur();
        }}
      >
        <PopoverTrigger
          render={
            <Button
              id={field.name}
              variant='outline'
              role='combobox'
              aria-controls={listboxId}
              aria-expanded={open}
              aria-invalid={isInvalid}
              aria-describedby={isInvalid ? `${field.name}-error` : undefined}
              className={cn(
                'w-full justify-between font-normal',
                !selected && 'text-muted-foreground'
              )}
            />
          }
        >
          {selected?.label ?? placeholder}
          <Icons.chevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </PopoverTrigger>
        <PopoverContent className='w-(--anchor-width) p-0'>
          <Command>
            <CommandInput placeholder={searchPlaceholder} />
            <CommandList id={listboxId}>
              <CommandEmpty>{emptyMessage}</CommandEmpty>
              <CommandGroup>
                {options.map((opt) => (
                  <CommandItem
                    key={opt.value}
                    value={opt.value}
                    disabled={opt.disabled}
                    keywords={[opt.label]}
                    onSelect={(next) => {
                      field.handleChange(next);
                      setOpen(false);
                    }}
                  >
                    <Icons.check
                      className={cn(
                        'mr-2 h-4 w-4',
                        field.state.value === opt.value ? 'opacity-100' : 'opacity-0'
                      )}
                    />
                    {opt.label}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {description && <FieldDescription>{description}</FieldDescription>}
      {isInvalid && <FieldError id={`${field.name}-error`} errors={field.state.meta.errors} />}
    </Field>
  );
}
