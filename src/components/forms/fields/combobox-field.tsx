'use client';

import * as React from 'react';
import { useStore } from '@tanstack/react-form';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
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

type Option = { value: string; label: string; disabled?: boolean };

interface ComboboxFieldProps {
  label: string;
  description?: string;
  /** Class for the outer field wrapper (grid placement, spans, …). */
  fieldClassName?: string;
  required?: boolean;
  options: Option[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  /** Non-interactive but not dimmed — for view-permission display modes. */
  readOnly?: boolean;
  /** Visually hide the label (kept for screen readers). */
  labelSrOnly?: boolean;
}

/** Path value type ComboboxField can edit — matches the `as string` cast below. */
export type ComboboxFieldValue = string | null | undefined;

export function ComboboxField({
  label,
  description,
  fieldClassName,
  required,
  options,
  placeholder = 'Select an option',
  searchPlaceholder = 'Search...',
  emptyMessage = 'No results found.',
  disabled,
  readOnly,
  labelSrOnly
}: ComboboxFieldProps) {
  const field = useFieldContext();
  const value = useStore(field.store, (s) => s.value) as string;
  const [open, setOpen] = React.useState(false);
  const selected = options.find((o) => o.value === value);

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
                role='combobox'
                aria-controls={`${field.controlId}-listbox`}
                aria-expanded={open}
                disabled={disabled}
                aria-readonly={readOnly || undefined}
                aria-invalid={field.isInvalid}
                aria-describedby={describedBy}
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
              <CommandList id={`${field.controlId}-listbox`}>
                <CommandEmpty>{emptyMessage}</CommandEmpty>
                <CommandGroup>
                  {options.map((opt) => (
                    <CommandItem
                      key={opt.value}
                      value={opt.value}
                      disabled={opt.disabled}
                      keywords={[opt.label]}
                      onSelect={(next) => {
                        // No toggle-to-'': re-selecting keeps the value, so
                        // the widget never writes a value outside the path's
                        // type (literal-union paths stay type-true).
                        field.handleChange(next);
                        setOpen(false);
                      }}
                    >
                      <Icons.check
                        className={cn(
                          'mr-2 h-4 w-4',
                          value === opt.value ? 'opacity-100' : 'opacity-0'
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
        {description && (
          <FieldDescription id={field.formDescriptionId}>{description}</FieldDescription>
        )}
        <FormFieldError />
      </FormField>
    </FormFieldSet>
  );
}
