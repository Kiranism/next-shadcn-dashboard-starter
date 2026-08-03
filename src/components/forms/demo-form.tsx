'use client';

import * as React from 'react';
import { useForm, useStore, type AnyFieldApi } from '@tanstack/react-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { FileUploader } from '@/components/file-uploader';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator
} from '@/components/ui/input-otp';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

// Schema — validated on submit, errors display next to each field
const demoFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Invalid email address'),
  age: z.number({ error: 'Age is required' }).min(18, 'Must be at least 18 years old'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  website: z.string().url('Invalid URL').or(z.literal('')),
  bio: z.string().min(10, 'Bio must be at least 10 characters'),
  country: z.string().min(1, 'Please select a country'),
  framework: z.string().min(1, 'Please select a framework'),
  interests: z.array(z.string()).min(1, 'Select at least one interest'),
  gender: z.string().min(1, 'Please select gender'),
  newsletter: z.boolean(),
  rating: z.number().min(0).max(10),
  birthDate: z.date().optional(),
  dateRange: z.any().optional(),
  eventTime: z.string().optional(),
  favoriteColor: z.string().optional(),
  otp: z.string().min(6, 'Please enter 6 digits'),
  formatting: z.array(z.string()).optional(),
  tags: z.array(z.string()).min(1, 'Add at least one tag'),
  terms: z.boolean().refine((val) => val === true, 'You must accept the terms'),
  avatar: z.array(z.any()).optional()
});

const countryOptions = [
  { value: 'us', label: 'United States' },
  { value: 'ca', label: 'Canada' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'au', label: 'Australia' },
  { value: 'de', label: 'Germany' },
  { value: 'fr', label: 'France' }
];

const frameworkOptions = [
  { value: 'next', label: 'Next.js' },
  { value: 'remix', label: 'Remix' },
  { value: 'astro', label: 'Astro' },
  { value: 'nuxt', label: 'Nuxt' },
  { value: 'svelte', label: 'SvelteKit' },
  { value: 'angular', label: 'Angular' }
];

const interestOptions = [
  { value: 'technology', label: 'Technology' },
  { value: 'sports', label: 'Sports' },
  { value: 'music', label: 'Music' },
  { value: 'travel', label: 'Travel' },
  { value: 'cooking', label: 'Cooking' },
  { value: 'reading', label: 'Reading' }
];

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer-not-to-say', label: 'Prefer not to say' }
];

// ─── Page-local controls (plain UI state, wired to the field in the JSX) ───

function FrameworkCombobox({ field, isInvalid }: { field: AnyFieldApi; isInvalid: boolean }) {
  const [open, setOpen] = React.useState(false);
  const value = field.state.value as string;
  const selected = frameworkOptions.find((o) => o.value === value);

  return (
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
            aria-controls='framework-listbox'
            aria-expanded={open}
            aria-invalid={isInvalid}
            className={cn(
              'w-full justify-between font-normal',
              !selected && 'text-muted-foreground'
            )}
          />
        }
      >
        {selected?.label ?? 'Search frameworks...'}
        <Icons.chevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
      </PopoverTrigger>
      <PopoverContent className='w-(--anchor-width) p-0'>
        <Command>
          <CommandInput placeholder='Search frameworks...' />
          <CommandList id='framework-listbox'>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {frameworkOptions.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  keywords={[opt.label]}
                  onSelect={(next) => {
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
  );
}

function TagsInput({
  values,
  onPush,
  onRemove
}: {
  values: string[];
  onPush: (val: string) => void;
  onRemove: (idx: number) => void;
}) {
  const [tagInput, setTagInput] = React.useState('');

  const addTag = () => {
    const tag = tagInput.trim();
    if (tag && !values.includes(tag)) {
      onPush(tag);
      setTagInput('');
    }
  };

  return (
    <>
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
          placeholder='Type and press Enter...'
          aria-label='Add a tag'
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
                onClick={() => onRemove(idx)}
                aria-label={`Remove ${tag}`}
                className='hover:text-destructive ml-0.5'
              >
                <Icons.close className='h-3 w-3' />
              </button>
            </Badge>
          ))}
        </div>
      )}
    </>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className='space-y-1'>
      <Separator />
      <h3 className='text-muted-foreground pt-2 text-sm font-medium tracking-wide uppercase'>
        {children}
      </h3>
    </div>
  );
}

// ─── Form ───

type DemoFormValues = {
  name: string;
  email: string;
  age?: number;
  password: string;
  phone: string;
  website: string;
  bio: string;
  country: string;
  framework: string;
  interests: string[];
  gender: string;
  newsletter: boolean;
  rating: number;
  birthDate?: Date;
  dateRange?: DateRange;
  eventTime?: string;
  favoriteColor?: string;
  otp: string;
  formatting?: string[];
  tags: string[];
  terms: boolean;
  avatar?: File[];
};

export default function DemoForm() {
  const form = useForm({
    defaultValues: {
      name: '',
      email: '',
      age: undefined,
      password: '',
      phone: '',
      website: '',
      bio: '',
      country: '',
      framework: '',
      interests: [],
      gender: '',
      newsletter: false,
      rating: 5,
      birthDate: undefined,
      dateRange: undefined,
      eventTime: '',
      favoriteColor: '#6366f1',
      otp: '',
      formatting: [],
      tags: [],
      terms: false,
      avatar: []
    } as DemoFormValues,
    validators: {
      onSubmit: demoFormSchema
    },
    onSubmit: () => {
      alert('Form submitted successfully!');
    }
  });

  const formValues = useStore(form.store, (s) => s.values);

  return (
    <div className='grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]'>
      <Card>
        <CardHeader>
          <CardTitle className='text-2xl font-bold'>All Form Inputs Demo</CardTitle>
          <p className='text-muted-foreground'>
            Every possible form input — built with TanStack Form + shadcn/ui
          </p>
        </CardHeader>
        <CardContent>
          <form
            className='space-y-6'
            noValidate
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            {/* ─── TEXT INPUTS ─── */}
            <SectionTitle>Text Inputs</SectionTitle>

            <FieldGroup className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <form.Field
                name='name'
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Full Name *</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='John Doe'
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />

              {/* Async validation: simulated server-side email check */}
              <form.Field
                name='email'
                asyncDebounceMs={500}
                validators={{
                  onChangeAsync: async ({ value }) => {
                    if (!value || value.length < 3) return undefined;
                    await new Promise((r) => setTimeout(r, 500));
                    if (value === 'taken@example.com') {
                      return { message: 'This email is already registered' };
                    }
                    return undefined;
                  }
                }}
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email *</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type='email'
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='john@example.com'
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />

              <form.Field
                name='password'
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Password *</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type='password'
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='Min 8 characters'
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />

              <form.Field
                name='age'
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Age *</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type='number'
                        min={18}
                        max={100}
                        value={field.state.value ?? ''}
                        onBlur={field.handleBlur}
                        onChange={(e) =>
                          field.handleChange(
                            e.target.value === '' ? undefined : Number(e.target.value)
                          )
                        }
                        placeholder='18'
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />

              <form.Field
                name='phone'
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Phone *</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type='tel'
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='+1 (555) 000-0000'
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />

              <form.Field
                name='website'
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Website</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type='url'
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='https://example.com'
                        aria-invalid={isInvalid}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />
            </FieldGroup>

            {/* ─── TEXTAREA ─── */}
            <form.Field
              name='bio'
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Bio *</FieldLabel>
                    <Textarea
                      id={field.name}
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder='Tell us about yourself...'
                      maxLength={500}
                      rows={4}
                      aria-invalid={isInvalid}
                    />
                    <FieldDescription>{field.state.value.length} / 500 characters</FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            />

            {/* ─── SELECT & COMBOBOX ─── */}
            <SectionTitle>Select & Combobox</SectionTitle>

            <FieldGroup className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <form.Field
                name='country'
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Country *</FieldLabel>
                      <Select
                        name={field.name}
                        value={field.state.value}
                        onValueChange={(value) => field.handleChange(value ?? '')}
                      >
                        <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                          <SelectValue placeholder='Select your country' />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectGroup>
                            {countryOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectGroup>
                        </SelectContent>
                      </Select>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />

              <form.Field
                name='framework'
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Framework *</FieldLabel>
                      <FrameworkCombobox field={field} isInvalid={isInvalid} />
                      <FieldDescription>Searchable dropdown</FieldDescription>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />
            </FieldGroup>

            {/* ─── CHECKBOX & RADIO ─── */}
            <SectionTitle>Checkbox & Radio</SectionTitle>

            {/* Checkbox group — array field with pushValue/removeValue */}
            <form.Field
              name='interests'
              mode='array'
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <FieldSet>
                    <FieldLegend variant='label'>Interests *</FieldLegend>
                    <FieldDescription>Select all that apply</FieldDescription>
                    <FieldGroup
                      data-slot='checkbox-group'
                      className='grid grid-cols-2 gap-3 md:grid-cols-3'
                    >
                      {interestOptions.map((opt) => (
                        <Field key={opt.value} orientation='horizontal' data-invalid={isInvalid}>
                          <Checkbox
                            id={`interests-${opt.value}`}
                            name={field.name}
                            aria-invalid={isInvalid}
                            checked={field.state.value.includes(opt.value)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                field.pushValue(opt.value);
                              } else {
                                const index = field.state.value.indexOf(opt.value);
                                if (index > -1) {
                                  field.removeValue(index);
                                }
                              }
                            }}
                          />
                          <FieldLabel htmlFor={`interests-${opt.value}`} className='font-normal'>
                            {opt.label}
                          </FieldLabel>
                        </Field>
                      ))}
                    </FieldGroup>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </FieldSet>
                );
              }}
            />
            {formValues.interests.length > 0 && (
              <div className='flex flex-wrap gap-2'>
                {formValues.interests.map((v) => (
                  <Badge key={v} variant='secondary'>
                    {interestOptions.find((o) => o.value === v)?.label || v}
                  </Badge>
                ))}
              </div>
            )}

            {/* Radio group */}
            <form.Field
              name='gender'
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <FieldSet>
                    <FieldLegend variant='label'>Gender *</FieldLegend>
                    <RadioGroup
                      name={field.name}
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      onBlur={field.handleBlur}
                      className='flex flex-wrap gap-x-6 gap-y-2'
                    >
                      {genderOptions.map((opt) => (
                        <Field
                          key={opt.value}
                          orientation='horizontal'
                          data-invalid={isInvalid}
                          className='w-auto'
                        >
                          <RadioGroupItem
                            value={opt.value}
                            id={`gender-${opt.value}`}
                            aria-invalid={isInvalid}
                          />
                          <FieldLabel htmlFor={`gender-${opt.value}`} className='font-normal'>
                            {opt.label}
                          </FieldLabel>
                        </Field>
                      ))}
                    </RadioGroup>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </FieldSet>
                );
              }}
            />

            {/* ─── TOGGLE & SWITCH ─── */}
            <SectionTitle>Toggle & Switch</SectionTitle>

            {/* Switch */}
            <form.Field
              name='newsletter'
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field orientation='horizontal' data-invalid={isInvalid}>
                    <FieldContent>
                      <FieldLabel htmlFor={field.name}>Subscribe to Newsletter</FieldLabel>
                      <FieldDescription>
                        Receive updates about new features and products
                      </FieldDescription>
                    </FieldContent>
                    <Switch
                      id={field.name}
                      name={field.name}
                      checked={field.state.value}
                      onCheckedChange={field.handleChange}
                      aria-invalid={isInvalid}
                    />
                  </Field>
                );
              }}
            />

            {/* Toggle group — multi-select */}
            <form.Field
              name='formatting'
              mode='array'
              children={(field) => (
                <Field>
                  <FieldLabel id='formatting-label'>Text Formatting</FieldLabel>
                  <ToggleGroup
                    multiple
                    variant='outline'
                    aria-labelledby='formatting-label'
                    value={field.state.value || []}
                    onValueChange={(val) => field.handleChange(val)}
                  >
                    <ToggleGroupItem value='bold' aria-label='Bold'>
                      <Icons.bold className='h-4 w-4' />
                    </ToggleGroupItem>
                    <ToggleGroupItem value='italic' aria-label='Italic'>
                      <Icons.italic className='h-4 w-4' />
                    </ToggleGroupItem>
                    <ToggleGroupItem value='underline' aria-label='Underline'>
                      <Icons.underline className='h-4 w-4' />
                    </ToggleGroupItem>
                  </ToggleGroup>
                  <FieldDescription>Multi-select toggle group</FieldDescription>
                </Field>
              )}
            />

            {/* Terms checkbox */}
            <form.Field
              name='terms'
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field orientation='horizontal' data-invalid={isInvalid}>
                    <Checkbox
                      id={field.name}
                      name={field.name}
                      checked={field.state.value}
                      onCheckedChange={(checked) => field.handleChange(checked === true)}
                      aria-invalid={isInvalid}
                    />
                    <FieldContent>
                      <FieldLabel htmlFor={field.name} className='font-normal'>
                        I agree to the Terms and Conditions *
                      </FieldLabel>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </FieldContent>
                  </Field>
                );
              }}
            />

            {/* ─── SLIDER ─── */}
            <SectionTitle>Slider</SectionTitle>

            <form.Field
              name='rating'
              children={(field) => (
                <Field>
                  <FieldLabel id='rating-label'>Overall Rating</FieldLabel>
                  <div className='px-1'>
                    <Slider
                      min={0}
                      max={10}
                      step={0.5}
                      value={[field.state.value]}
                      onValueChange={(v) => field.handleChange(Array.isArray(v) ? v[0] : v)}
                      onBlur={field.handleBlur}
                      aria-labelledby='rating-label'
                    />
                    <div className='text-muted-foreground mt-1 flex justify-between text-xs tabular-nums'>
                      <span>0</span>
                      <span className='text-foreground font-medium'>{field.state.value}</span>
                      <span>10</span>
                    </div>
                  </div>
                  <FieldDescription>Rate your experience (0-10)</FieldDescription>
                </Field>
              )}
            />

            {/* ─── DATE & TIME ─── */}
            <SectionTitle>Date & Time</SectionTitle>

            <FieldGroup className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {/* Date picker — Popover + Calendar */}
              <form.Field
                name='birthDate'
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Birth Date</FieldLabel>
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button
                              id={field.name}
                              variant='outline'
                              aria-invalid={isInvalid}
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !field.state.value && 'text-muted-foreground'
                              )}
                            />
                          }
                        >
                          <Icons.calendar className='mr-2 h-4 w-4' />
                          {field.state.value ? (
                            format(field.state.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </PopoverTrigger>
                        <PopoverContent className='w-auto p-0' align='start'>
                          <Calendar
                            mode='single'
                            selected={field.state.value}
                            onSelect={(date) => field.handleChange(date)}
                            disabled={(date) => date > new Date()}
                            autoFocus
                          />
                        </PopoverContent>
                      </Popover>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />

              {/* Time input */}
              <form.Field
                name='eventTime'
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Event Time</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type='time'
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                    />
                  </Field>
                )}
              />
            </FieldGroup>

            {/* Date range picker */}
            <form.Field
              name='dateRange'
              children={(field) => {
                const range = field.state.value;
                return (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Date Range</FieldLabel>
                    <Popover>
                      <PopoverTrigger
                        render={
                          <Button
                            id={field.name}
                            variant='outline'
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
                          <span>Pick a date range</span>
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
                  </Field>
                );
              }}
            />

            {/* ─── SPECIAL INPUTS ─── */}
            <SectionTitle>Special Inputs</SectionTitle>

            <FieldGroup className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {/* OTP input */}
              <form.Field
                name='otp'
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel>Verification Code *</FieldLabel>
                      <InputOTP
                        maxLength={6}
                        value={field.state.value}
                        onChange={field.handleChange}
                        aria-label='Verification code'
                      >
                        <InputOTPGroup>
                          <InputOTPSlot index={0} />
                          <InputOTPSlot index={1} />
                          <InputOTPSlot index={2} />
                        </InputOTPGroup>
                        <InputOTPSeparator />
                        <InputOTPGroup>
                          <InputOTPSlot index={3} />
                          <InputOTPSlot index={4} />
                          <InputOTPSlot index={5} />
                        </InputOTPGroup>
                      </InputOTP>
                      <FieldDescription>6-digit OTP input</FieldDescription>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  );
                }}
              />

              {/* Color picker */}
              <form.Field
                name='favoriteColor'
                children={(field) => (
                  <Field>
                    <FieldLabel htmlFor={field.name}>Favorite Color</FieldLabel>
                    <div className='flex items-center gap-3'>
                      <input
                        id={field.name}
                        aria-label='Favorite color'
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
                        aria-label='Favorite color hex value'
                      />
                    </div>
                    <FieldDescription>Native color picker with hex</FieldDescription>
                  </Field>
                )}
              />
            </FieldGroup>

            {/* Tags input — array field */}
            <form.Field
              name='tags'
              mode='array'
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel>Tags *</FieldLabel>
                    <TagsInput
                      values={field.state.value || []}
                      onPush={(val) => field.pushValue(val)}
                      onRemove={(idx) => field.removeValue(idx)}
                    />
                    <FieldDescription>Press Enter or click Add to create tags</FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            />

            {/* ─── FILE UPLOAD ─── */}
            <SectionTitle>File Upload</SectionTitle>

            <form.Field
              name='avatar'
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Profile Picture</FieldLabel>
                    <FileUploader
                      value={field.state.value}
                      onValueChange={(files) =>
                        field.handleChange(
                          typeof files === 'function' ? files(field.state.value ?? []) : files
                        )
                      }
                      maxSize={5000000}
                      maxFiles={1}
                    />
                    <FieldDescription>
                      Drag &amp; drop or click to upload (max 5MB)
                    </FieldDescription>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            />

            {/* ─── SUBMIT ─── */}
            <Separator />
            <div className='flex gap-4 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => form.reset()}
                className='flex-1'
              >
                Reset
              </Button>
              <form.Subscribe
                selector={(state) => state.isSubmitting}
                children={(isSubmitting) => (
                  <Button type='submit' disabled={isSubmitting} className='flex-1'>
                    Submit Form
                  </Button>
                )}
              />
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Form Data Preview - sticky sidebar */}
      <div className='xl:sticky xl:top-16 xl:self-start'>
        <Card>
          <CardHeader>
            <CardTitle>Form Data Preview</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className='bg-muted max-h-[calc(100vh-8rem)] overflow-auto rounded-lg p-4 text-xs'>
              {JSON.stringify(formValues, null, 2)}
            </pre>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
