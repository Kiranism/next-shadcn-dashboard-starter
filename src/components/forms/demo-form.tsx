'use client';

import * as React from 'react';
import { useStore } from '@tanstack/react-form';
import * as z from 'zod';
import { useAppForm } from '@/lib/form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FieldGroup } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ToggleGroupItem } from '@/components/ui/toggle-group';
import type { DateRange } from 'react-day-picker';
import { Icons } from '@/components/icons';

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
  const form = useAppForm({
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
  const isSubmitting = useStore(form.store, (s) => s.isSubmitting);

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
            aria-busy={isSubmitting}
            onSubmit={(e) => {
              e.preventDefault();
              form.handleSubmit();
            }}
          >
            {/* ─── TEXT INPUTS ─── */}
            <SectionTitle>Text Inputs</SectionTitle>

            <FieldGroup className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <form.AppField
                name='name'
                children={(field) => (
                  <field.TextField label='Full Name' required placeholder='John Doe' />
                )}
              />

              {/* Async validation: simulated server-side email check */}
              <form.AppField
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
                children={(field) => (
                  <field.TextField
                    label='Email'
                    required
                    type='email'
                    placeholder='john@example.com'
                  />
                )}
              />

              <form.AppField
                name='password'
                children={(field) => (
                  <field.TextField
                    label='Password'
                    required
                    type='password'
                    placeholder='Min 8 characters'
                  />
                )}
              />

              <form.AppField
                name='age'
                children={(field) => (
                  <field.TextField
                    label='Age'
                    required
                    type='number'
                    min={18}
                    max={100}
                    placeholder='18'
                  />
                )}
              />

              <form.AppField
                name='phone'
                children={(field) => (
                  <field.TextField
                    label='Phone'
                    required
                    type='tel'
                    placeholder='+1 (555) 000-0000'
                  />
                )}
              />

              <form.AppField
                name='website'
                children={(field) => (
                  <field.TextField label='Website' type='url' placeholder='https://example.com' />
                )}
              />
            </FieldGroup>

            {/* ─── TEXTAREA ─── */}
            <form.AppField
              name='bio'
              children={(field) => (
                <field.TextareaField
                  label='Bio'
                  required
                  placeholder='Tell us about yourself...'
                  maxLength={500}
                  rows={4}
                  showCount
                />
              )}
            />

            {/* ─── SELECT & COMBOBOX ─── */}
            <SectionTitle>Select & Combobox</SectionTitle>

            <FieldGroup className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <form.AppField
                name='country'
                children={(field) => (
                  <field.SelectField
                    label='Country'
                    required
                    options={countryOptions}
                    placeholder='Select your country'
                  />
                )}
              />

              <form.AppField
                name='framework'
                children={(field) => (
                  <field.ComboboxField
                    label='Framework'
                    required
                    description='Searchable dropdown'
                    options={frameworkOptions}
                    placeholder='Search frameworks...'
                  />
                )}
              />
            </FieldGroup>

            {/* ─── CHECKBOX & RADIO ─── */}
            <SectionTitle>Checkbox & Radio</SectionTitle>

            <form.AppField
              name='interests'
              mode='array'
              children={(field) => (
                <field.CheckboxGroupField
                  label='Interests'
                  required
                  description='Select all that apply'
                  options={interestOptions}
                  className='grid grid-cols-2 gap-3 md:grid-cols-3'
                />
              )}
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

            <form.AppField
              name='gender'
              children={(field) => (
                <field.RadioGroupField label='Gender' required options={genderOptions} />
              )}
            />

            {/* ─── TOGGLE & SWITCH ─── */}
            <SectionTitle>Toggle & Switch</SectionTitle>

            <form.AppField
              name='newsletter'
              children={(field) => (
                <field.SwitchField
                  label='Subscribe to Newsletter'
                  description='Receive updates about new features and products'
                />
              )}
            />

            <form.AppField
              name='formatting'
              mode='array'
              children={(field) => (
                <field.ToggleGroupField
                  label='Text Formatting'
                  description='Multi-select toggle group'
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
                </field.ToggleGroupField>
              )}
            />

            <form.AppField
              name='terms'
              children={(field) => (
                <field.CheckboxField label='I agree to the Terms and Conditions' required />
              )}
            />

            {/* ─── SLIDER ─── */}
            <SectionTitle>Slider</SectionTitle>

            <form.AppField
              name='rating'
              children={(field) => (
                <field.SliderField
                  label='Overall Rating'
                  description='Rate your experience (0-10)'
                  min={0}
                  max={10}
                  step={0.5}
                />
              )}
            />

            {/* ─── DATE & TIME ─── */}
            <SectionTitle>Date & Time</SectionTitle>

            <FieldGroup className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <form.AppField
                name='birthDate'
                children={(field) => (
                  <field.DatePickerField
                    label='Birth Date'
                    disabledDates={(date) => date > new Date()}
                  />
                )}
              />

              <form.AppField
                name='eventTime'
                children={(field) => <field.TextField label='Event Time' type='time' />}
              />
            </FieldGroup>

            <form.AppField
              name='dateRange'
              children={(field) => <field.DateRangeField label='Date Range' />}
            />

            {/* ─── SPECIAL INPUTS ─── */}
            <SectionTitle>Special Inputs</SectionTitle>

            <FieldGroup className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <form.AppField
                name='otp'
                children={(field) => (
                  <field.OtpField
                    label='Verification Code'
                    required
                    description='6-digit OTP input'
                  />
                )}
              />

              <form.AppField
                name='favoriteColor'
                children={(field) => (
                  <field.ColorField
                    label='Favorite Color'
                    description='Native color picker with hex'
                  />
                )}
              />
            </FieldGroup>

            <form.AppField
              name='tags'
              mode='array'
              children={(field) => (
                <field.TagsField
                  label='Tags'
                  required
                  description='Press Enter or click Add to create tags'
                />
              )}
            />

            {/* ─── FILE UPLOAD ─── */}
            <SectionTitle>File Upload</SectionTitle>

            <form.AppField
              name='avatar'
              children={(field) => (
                <field.FileUploadField
                  label='Profile Picture'
                  description='Drag & drop or click to upload (max 5MB)'
                  maxSize={5000000}
                  maxFiles={1}
                />
              )}
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
              <form.AppForm>
                <form.SubmitButton className='flex-1'>Submit Form</form.SubmitButton>
              </form.AppForm>
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
