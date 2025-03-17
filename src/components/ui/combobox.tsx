'use client';
import React, { useState } from 'react';
import { Popover, PopoverTrigger } from './popover';
import { Button } from './button';
import Icons from './icons';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from './command';
import { cn } from '@/lib/utils';
import * as PopoverPrimitive from '@radix-ui/react-popover';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  placeholder?: string;
  label?: string;
  items: string[];
  onValueChange?: (value: string) => void;
  contentClassName?: string;
}

const ComboBox = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    const { label, placeholder, items, onValueChange, contentClassName } =
      props;
    const [selectedValue, setSelectedValue] = useState<string>(
      ((props.defaultValue as string) ?? '').trim()
    );
    const [open, setOpen] = useState<boolean>(false);

    return (
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger disabled={props.disabled || props.readOnly} asChild>
          <Button
            variant={'outline'}
            role='combobox'
            className={cn(className, 'justify-between')}
          >
            <input
              tabIndex={-1}
              readOnly
              type={type}
              value={selectedValue}
              placeholder={
                selectedValue.length > 0
                  ? selectedValue
                  : (label ?? 'Select an option')
              }
              className='flex-grow cursor-pointer border-none bg-transparent caret-transparent hover:bg-transparent focus:outline-none enabled:placeholder:text-foreground'
              ref={ref}
              {...props}
            />
            {/* {selectedValue.length > 0
                ? selectedValue
                : label ?? "Select an option"} */}
            <Icons.chevronsUpDown className='size-4 text-muted-foreground' />
          </Button>
        </PopoverTrigger>
        <PopoverPrimitive.Content
          align={'center'}
          sideOffset={4}
          className={cn(
            'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
            contentClassName
          )}
        >
          <Command className='max-h-72'>
            <CommandInput placeholder={placeholder ?? 'Search...'} />
            <CommandList>
              <CommandEmpty>No results.</CommandEmpty>
              <CommandGroup>
                {items.map((item, index) => (
                  <CommandItem
                    onSelect={() => {
                      setSelectedValue(item);
                      setOpen(false);

                      if (onValueChange) onValueChange(item);
                    }}
                    key={`${item}-#${index}`}
                    value={item}
                  >
                    {selectedValue === item && (
                      <Icons.check className='mr-2 size-4' />
                    )}
                    {item}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverPrimitive.Content>
      </Popover>
    );
  }
);
ComboBox.displayName = 'Combobox';

interface LabelledInputProps extends Omit<InputProps, 'items'> {
  items: {
    label: string;
    value: string;
  }[];
}

const LabelledComboBox = React.forwardRef<HTMLInputElement, LabelledInputProps>(
  ({ className, type, ...props }, ref) => {
    const { label, placeholder, items, onValueChange, contentClassName } =
      props;
    const [selectedValue, setSelectedValue] = useState<string>(
      ((props.defaultValue as string) ?? '').trim()
    );
    const [open, setOpen] = useState<boolean>(false);

    return (
      <>
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger disabled={props.disabled || props.readOnly} asChild>
            <Button
              variant={'outline'}
              role='combobox'
              className={cn(className, 'justify-between')}
            >
              <input
                readOnly
                className='flex-grow cursor-pointer border-none bg-transparent caret-transparent hover:bg-transparent focus:outline-none enabled:placeholder:text-foreground'
                required={props.required}
                tabIndex={-1}
                value={
                  items.find((item) => item.value === selectedValue)?.label ??
                  undefined
                }
                placeholder={
                  selectedValue.length > 0
                    ? (items.find((item) => item.value === selectedValue)
                        ?.label ?? label)
                    : (label ?? 'Select an option')
                }
              />
              <input
                tabIndex={-1}
                readOnly
                type={type}
                value={selectedValue}
                placeholder={
                  selectedValue.length > 0
                    ? (items.find((item) => item.value === selectedValue)
                        ?.label ?? label)
                    : (label ?? 'Select an option')
                }
                className='sr-only flex-grow cursor-pointer border-none bg-transparent caret-transparent hover:bg-transparent focus:outline-none'
                ref={ref}
                {...props}
              />
              {/* {selectedValue.length > 0
                ? selectedValue
                : label ?? "Select an option"} */}
              <Icons.chevronsUpDown className='size-4 text-muted-foreground' />
            </Button>
          </PopoverTrigger>
          <PopoverPrimitive.Content
            align={'center'}
            sideOffset={4}
            className={cn(
              'z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2',
              contentClassName
            )}
          >
            <Command className='max-h-72'>
              <CommandInput placeholder={placeholder ?? 'Search...'} />
              <CommandList>
                <CommandEmpty>No results.</CommandEmpty>
                <CommandGroup>
                  {items.map((item, index) => (
                    <CommandItem
                      onSelect={() => {
                        setSelectedValue(item.value);
                        setOpen(false);

                        if (onValueChange) onValueChange(item.value);
                      }}
                      key={`${item}-#${index}`}
                      value={item.value}
                    >
                      {selectedValue === item.value && (
                        <Icons.check className='mr-2 size-4' />
                      )}
                      {item.label}
                    </CommandItem>
                  ))}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverPrimitive.Content>
        </Popover>
      </>
    );
  }
);
LabelledComboBox.displayName = 'LabelledCombobox';

export { ComboBox, LabelledComboBox };
