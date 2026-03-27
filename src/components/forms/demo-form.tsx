'use client';

import * as React from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { useStore } from '@tanstack/react-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldDescription } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from '@/components/ui/command';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import { Icons } from '@/components/icons';
import { cn } from '@/lib/utils';

// Schema (form-level safety net — onSubmit catches anything field-level missed)
const demoFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.email('Invalid email address'),
  age: z.number().min(18, 'Must be at least 18 years old'),
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

// ─── Custom field components (no pre-built field component exists) ───

function ComboboxField({
  value,
  onChange,
  onBlur,
  isTouched,
  isValid
}: {
  value: string;
  onChange: (val: string) => void;
  onBlur: () => void;
  isTouched: boolean;
  isValid: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const selected = frameworkOptions.find((o) => o.value === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant='outline'
          role='combobox'
          aria-controls='framework-listbox'
          aria-expanded={open}
          className='w-full justify-between font-normal'
          aria-invalid={isTouched && !isValid}
          onBlur={onBlur}
        >
          {selected?.label ?? 'Search frameworks...'}
          <Icons.chevronsUpDown className='ml-2 h-4 w-4 shrink-0 opacity-50' />
        </Button>
      </PopoverTrigger>
      <PopoverContent className='w-[--radix-popover-trigger-width] p-0'>
        <Command>
          <CommandInput placeholder='Search...' />
          <CommandList>
            <CommandEmpty>No framework found.</CommandEmpty>
            <CommandGroup>
              {frameworkOptions.map((opt) => (
                <CommandItem
                  key={opt.value}
                  value={opt.value}
                  onSelect={(val) => {
                    onChange(val);
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

function TagsField({
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
  age: number;
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
  const form = useAppForm({
    defaultValues: {
      name: '',
      email: '',
      age: 18,
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
      // Form-level safety net — catches anything field-level validators missed
      onSubmit: demoFormSchema
    },
    onSubmit: () => {
      alert('Form submitted successfully!');
    }
  });

  const {
    FormTextField,
    FormTextareaField,
    FormSelectField,
    FormSwitchField,
    FormRadioGroupField,
    FormSliderField,
    FormFileUploadField
  } = useFormFields<DemoFormValues>();

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
          <form.AppForm>
            <form.Form className='space-y-6'>
              {/* ─── TEXT INPUTS (flat pattern + field-level onBlur validation) ─── */}
              <SectionTitle>Text Inputs</SectionTitle>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                <FormTextField
                  name='name'
                  label='Full Name'
                  required
                  placeholder='John Doe'
                  validators={{
                    onBlur: z.string().min(2, 'Name must be at least 2 characters')
                  }}
                />
                {/* Async validation: simulated server-side email check */}
                <FormTextField
                  name='email'
                  label='Email'
                  required
                  type='email'
                  placeholder='john@example.com'
                  validators={{
                    onBlur: z.string().email('Invalid email address'),
                    onChangeAsync: async ({ value }: { value: string }) => {
                      if (!value || value.length < 3) return undefined;
                      // Simulated server check — replace with real API call
                      await new Promise((r) => setTimeout(r, 500));
                      if (value === 'taken@example.com') {
                        return 'This email is already registered';
                      }
                      return undefined;
                    },
                    onChangeAsyncDebounceMs: 500
                  }}
                />
                <FormTextField
                  name='password'
                  label='Password'
                  required
                  type='password'
                  placeholder='Min 8 characters'
                  validators={{
                    onBlur: z.string().min(8, 'Password must be at least 8 characters')
                  }}
                />
                <FormTextField
                  name='age'
                  label='Age'
                  required
                  type='number'
                  min={18}
                  max={100}
                  placeholder='18'
                  validators={{
                    onBlur: z.number().min(18, 'Must be at least 18 years old')
                  }}
                />
                <FormTextField
                  name='phone'
                  label='Phone'
                  required
                  type='tel'
                  placeholder='+1 (555) 000-0000'
                  validators={{
                    onBlur: z.string().min(10, 'Phone must be at least 10 digits')
                  }}
                />
                <FormTextField
                  name='website'
                  label='Website'
                  type='url'
                  placeholder='https://example.com'
                />
              </div>

              {/* ─── TEXTAREA (flat pattern + onBlur validation) ─── */}
              <FormTextareaField
                name='bio'
                label='Bio'
                required
                placeholder='Tell us about yourself...'
                maxLength={500}
                rows={4}
                validators={{
                  onBlur: z.string().min(10, 'Bio must be at least 10 characters')
                }}
              />

              {/* ─── SELECT & COMBOBOX ─── */}
              <SectionTitle>Select & Combobox</SectionTitle>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {/* Listener: logs country changes (replace with dependent field reset) */}
                <FormSelectField
                  name='country'
                  label='Country'
                  required
                  options={countryOptions}
                  placeholder='Select your country'
                  validators={{
                    onBlur: z.string().min(1, 'Please select a country')
                  }}
                  listeners={{
                    onChange: ({ value }) => {
                      // Side effect example: reset dependent fields when country changes.
                      // In a real form with state/city fields:
                      //   fieldApi.form.setFieldValue('state', '');
                      //   fieldApi.form.setFieldValue('city', '');
                      void value;
                    }
                  }}
                />

                {/* Combobox — custom, needs AppField (type-safe name) */}
                <form.AppField
                  name='framework'
                  children={(field) => (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel>Framework *</field.FieldLabel>
                        <ComboboxField
                          value={field.state.value}
                          onChange={field.handleChange}
                          onBlur={field.handleBlur}
                          isTouched={field.state.meta.isTouched}
                          isValid={field.state.meta.isValid}
                        />
                        <FieldDescription>Searchable dropdown</FieldDescription>
                      </field.Field>
                      <field.FieldError />
                    </field.FieldSet>
                  )}
                />
              </div>

              {/* ─── CHECKBOX & RADIO ─── */}
              <SectionTitle>Checkbox & Radio</SectionTitle>

              {/* Checkbox Group — array mode, needs AppField */}
              <form.AppField
                name='interests'
                mode='array'
                children={(field) => {
                  const values: string[] = field.state.value || [];
                  return (
                    <field.FieldSet>
                      <field.FieldLabel>Interests *</field.FieldLabel>
                      <FieldDescription>Select all that apply</FieldDescription>
                      <div className='grid grid-cols-2 gap-3 md:grid-cols-3'>
                        {interestOptions.map((opt) => (
                          <div key={opt.value} className='flex items-center space-x-2'>
                            <Checkbox
                              id={`interests-${opt.value}`}
                              checked={values.includes(opt.value)}
                              onCheckedChange={(checked) => {
                                if (checked) {
                                  field.pushValue(opt.value);
                                } else {
                                  const idx = values.indexOf(opt.value);
                                  if (idx > -1) field.removeValue(idx);
                                }
                              }}
                            />
                            <Label htmlFor={`interests-${opt.value}`}>{opt.label}</Label>
                          </div>
                        ))}
                      </div>
                      {values.length > 0 && (
                        <div className='flex flex-wrap gap-2'>
                          {values.map((v) => (
                            <Badge key={v} variant='secondary'>
                              {interestOptions.find((o) => o.value === v)?.label || v}
                            </Badge>
                          ))}
                        </div>
                      )}
                      <field.FieldError />
                    </field.FieldSet>
                  );
                }}
              />

              {/* Radio Group (flat pattern + onBlur validation) */}
              <FormRadioGroupField
                name='gender'
                label='Gender'
                required
                options={genderOptions}
                validators={{
                  onBlur: z.string().min(1, 'Please select gender')
                }}
              />

              {/* ─── TOGGLE & SWITCH ─── */}
              <SectionTitle>Toggle & Switch</SectionTitle>

              {/* Switch (flat pattern) */}
              <FormSwitchField
                name='newsletter'
                label='Subscribe to Newsletter'
                description='Receive updates about new features and products'
              />

              {/* Toggle Group — array mode, needs AppField */}
              <form.AppField
                name='formatting'
                mode='array'
                children={(field) => {
                  const values: string[] = field.state.value || [];
                  return (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel>Text Formatting</field.FieldLabel>
                        <ToggleGroup
                          type='multiple'
                          variant='outline'
                          value={values}
                          onValueChange={(val) => field.form.setFieldValue('formatting', val)}
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
                      </field.Field>
                    </field.FieldSet>
                  );
                }}
              />

              {/* Terms checkbox — custom horizontal layout, needs AppField */}
              <form.AppField
                name='terms'
                children={(field) => (
                  <field.FieldSet>
                    <field.Field orientation='horizontal'>
                      <Checkbox
                        checked={field.state.value}
                        onCheckedChange={(checked) => field.handleChange(checked as boolean)}
                        aria-invalid={field.state.meta.isTouched && !field.state.meta.isValid}
                      />
                      <field.FieldContent>
                        <field.FieldLabel className='space-y-1 leading-none'>
                          I agree to the Terms and Conditions *
                        </field.FieldLabel>
                        <field.FieldError />
                      </field.FieldContent>
                    </field.Field>
                  </field.FieldSet>
                )}
              />

              {/* ─── SLIDER (flat pattern) ─── */}
              <SectionTitle>Slider</SectionTitle>

              <FormSliderField
                name='rating'
                label='Overall Rating'
                description='Rate your experience (0-10)'
                min={0}
                max={10}
                step={0.5}
              />

              {/* ─── DATE & TIME (custom, need AppField) ─── */}
              <SectionTitle>Date & Time</SectionTitle>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {/* Date Picker */}
                <form.AppField
                  name='birthDate'
                  children={(field) => (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel>Birth Date</field.FieldLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant='outline'
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !field.state.value && 'text-muted-foreground'
                              )}
                            >
                              <Icons.calendar className='mr-2 h-4 w-4' />
                              {field.state.value ? (
                                format(field.state.value, 'PPP')
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='single'
                              selected={field.state.value}
                              onSelect={field.handleChange}
                              disabled={(date) => date > new Date()}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </field.Field>
                    </field.FieldSet>
                  )}
                />

                {/* Time Input */}
                <form.AppField
                  name='eventTime'
                  children={(field) => (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel htmlFor={field.name}>Event Time</field.FieldLabel>
                        <Input
                          id={field.name}
                          type='time'
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                        />
                      </field.Field>
                    </field.FieldSet>
                  )}
                />
              </div>

              {/* Date Range Picker */}
              <form.AppField
                name='dateRange'
                children={(field) => {
                  const range = field.state.value as DateRange | undefined;
                  return (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel>Date Range</field.FieldLabel>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant='outline'
                              className={cn(
                                'w-full justify-start text-left font-normal',
                                !range?.from && 'text-muted-foreground'
                              )}
                            >
                              <Icons.calendar className='mr-2 h-4 w-4' />
                              {range?.from ? (
                                range.to ? (
                                  <>
                                    {format(range.from, 'LLL dd, y')} -{' '}
                                    {format(range.to, 'LLL dd, y')}
                                  </>
                                ) : (
                                  format(range.from, 'LLL dd, y')
                                )
                              ) : (
                                <span>Pick a date range</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className='w-auto p-0' align='start'>
                            <Calendar
                              mode='range'
                              selected={range}
                              onSelect={field.handleChange}
                              numberOfMonths={2}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </field.Field>
                    </field.FieldSet>
                  );
                }}
              />

              {/* ─── SPECIAL INPUTS (custom, need AppField) ─── */}
              <SectionTitle>Special Inputs</SectionTitle>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {/* OTP Input */}
                <form.AppField
                  name='otp'
                  children={(field) => (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel>Verification Code *</field.FieldLabel>
                        <InputOTP
                          maxLength={6}
                          value={field.state.value}
                          onChange={field.handleChange}
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
                      </field.Field>
                      <field.FieldError />
                    </field.FieldSet>
                  )}
                />

                {/* Color Picker */}
                <form.AppField
                  name='favoriteColor'
                  children={(field) => (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel htmlFor={field.name}>Favorite Color</field.FieldLabel>
                        <div className='flex items-center gap-3'>
                          <input
                            id={field.name}
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
                          />
                        </div>
                        <FieldDescription>Native color picker with hex</FieldDescription>
                      </field.Field>
                    </field.FieldSet>
                  )}
                />
              </div>

              {/* Tags Input — array mode, needs AppField */}
              <form.AppField
                name='tags'
                mode='array'
                children={(field) => {
                  const values: string[] = field.state.value || [];
                  return (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel>Tags *</field.FieldLabel>
                        <TagsField
                          values={values}
                          onPush={(val) => field.pushValue(val)}
                          onRemove={(idx) => field.removeValue(idx)}
                        />
                        <FieldDescription>Press Enter or click Add to create tags</FieldDescription>
                      </field.Field>
                      <field.FieldError />
                    </field.FieldSet>
                  );
                }}
              />

              {/* ─── FILE UPLOAD (flat pattern) ─── */}
              <SectionTitle>File Upload</SectionTitle>

              <FormFileUploadField
                name='avatar'
                label='Profile Picture'
                description='Drag & drop or click to upload (max 5MB)'
                maxSize={5000000}
                maxFiles={1}
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
                <form.SubmitButton className='flex-1'>Submit Form</form.SubmitButton>
              </div>
            </form.Form>
          </form.AppForm>
        </CardContent>
      </Card>

      {/* Form Data Preview - sticky sidebar */}
      <div className='xl:sticky xl:top-4 xl:self-start'>
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
