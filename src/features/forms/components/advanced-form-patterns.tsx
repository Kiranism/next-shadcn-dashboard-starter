'use client';

import * as React from 'react';
import { useForm, useStore } from '@tanstack/react-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { Spinner } from '@/components/ui/spinner';
import { toast } from 'sonner';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type AdvancedFormValues = {
  username: string;
  email: string;
  password: string;
  confirmPassword: string;
  team: {
    name: string;
    size: number;
  };
  members: Array<{ name: string; role: string }>;
  country: string;
  state: string;
};

// ---------------------------------------------------------------------------
// Country / State data
// ---------------------------------------------------------------------------

const countryStateMap: Record<string, { value: string; label: string }[]> = {
  us: [
    { value: 'ca', label: 'California' },
    { value: 'ny', label: 'New York' },
    { value: 'tx', label: 'Texas' }
  ],
  uk: [
    { value: 'ldn', label: 'London' },
    { value: 'mnc', label: 'Manchester' },
    { value: 'brm', label: 'Birmingham' }
  ],
  au: [
    { value: 'nsw', label: 'New South Wales' },
    { value: 'vic', label: 'Victoria' },
    { value: 'qld', label: 'Queensland' }
  ]
};

const countryOptions = [
  { value: 'us', label: 'United States' },
  { value: 'uk', label: 'United Kingdom' },
  { value: 'au', label: 'Australia' }
];

// ---------------------------------------------------------------------------
// Form-level Zod schema (cross-field validation on submit)
// ---------------------------------------------------------------------------

const advancedSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
  team: z.object({
    name: z.string().min(2, 'Team name must be at least 2 characters'),
    size: z.number().min(1, 'At least 1 member').max(100, 'Max 100 members')
  }),
  members: z
    .array(
      z.object({
        name: z.string().min(1, 'Member name is required'),
        role: z.string().min(1, 'Role is required')
      })
    )
    .min(1, 'Add at least one member'),
  country: z.string().min(1, 'Select a country'),
  state: z.string().min(1, 'Select a state')
});

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function AdvancedFormPatterns() {
  const form = useForm({
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      team: {
        name: '',
        size: 1
      },
      members: [{ name: '', role: '' }],
      country: '',
      state: ''
    } as AdvancedFormValues,
    validators: {
      onSubmit: advancedSchema
    },
    onSubmit: () => {
      toast.success('Team registered successfully!');
    }
  });

  // Read current country reactively for dependent state field
  const selectedCountry = useStore(form.store, (s) => s.values.country);
  const stateOptions = countryStateMap[selectedCountry] ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>Team Registration</CardTitle>
        <p className='text-muted-foreground'>
          Demonstrates async validation, linked fields, nested objects, dynamic arrays, and listener
          side effects.
        </p>
      </CardHeader>
      <CardContent>
        <form
          className='space-y-6'
          onSubmit={(e) => {
            e.preventDefault();
            form.handleSubmit();
          }}
        >
          {/* ─── Section 1: Account ─── */}
          <div className='space-y-1'>
            <h3 className='text-lg font-semibold'>Account</h3>
            <p className='text-muted-foreground text-sm'>Async validation, linked fields</p>
          </div>

          <FieldGroup className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {/* Username — async validation */}
            <form.Field
              name='username'
              asyncDebounceMs={500}
              validators={{
                onChangeAsync: async ({ value }) => {
                  if (!value || value.length < 3) return undefined;
                  await new Promise((r) => setTimeout(r, 500));
                  if (value === 'admin' || value === 'test') {
                    return { message: 'Username is taken' };
                  }
                  return undefined;
                }
              }}
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Username *</FieldLabel>
                    <div className='relative'>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder='Choose a username'
                        aria-invalid={isInvalid}
                      />
                      {field.state.meta.isValidating && (
                        <Spinner className='absolute top-1/2 right-3 h-4 w-4 -translate-y-1/2' />
                      )}
                    </div>
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            />

            {/* Email */}
            <form.Field
              name='email'
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
                      placeholder='you@example.com'
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            />

            {/* Password */}
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

            {/* Confirm Password — linked validation via onChangeListenTo */}
            <form.Field
              name='confirmPassword'
              validators={{
                onChangeListenTo: ['password'],
                onChange: ({ value, fieldApi }) => {
                  const password = fieldApi.form.getFieldValue('password');
                  if (value && value !== password) {
                    return { message: 'Passwords do not match' };
                  }
                  return undefined;
                }
              }}
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>Confirm Password *</FieldLabel>
                    <Input
                      id={field.name}
                      name={field.name}
                      type='password'
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder='Confirm password'
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            />
          </FieldGroup>

          <Separator />

          {/* ─── Section 2: Team Info (nested objects) ─── */}
          <div className='space-y-1'>
            <h3 className='text-lg font-semibold'>Team Info</h3>
            <p className='text-muted-foreground text-sm'>Nested objects with dot-notation paths</p>
          </div>

          <FieldGroup className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <form.Field
              name='team.name'
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor='team-name'>Team Name *</FieldLabel>
                    <Input
                      id='team-name'
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value)}
                      placeholder='e.g. Alpha Squad'
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            />
            <form.Field
              name='team.size'
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor='team-size'>Team Size *</FieldLabel>
                    <Input
                      id='team-size'
                      name={field.name}
                      type='number'
                      min={1}
                      max={100}
                      value={field.state.value ?? ''}
                      onBlur={field.handleBlur}
                      onChange={(e) =>
                        field.handleChange(
                          e.target.value === '' ? undefined! : Number(e.target.value)
                        )
                      }
                      placeholder='1-100'
                      aria-invalid={isInvalid}
                    />
                    {isInvalid && <FieldError errors={field.state.meta.errors} />}
                  </Field>
                );
              }}
            />
          </FieldGroup>

          <Separator />

          {/* ─── Section 3: Members (dynamic array rows) ─── */}
          <div className='space-y-1'>
            <h3 className='text-lg font-semibold'>Members</h3>
            <p className='text-muted-foreground text-sm'>Dynamic array rows with add / remove</p>
          </div>

          <form.Field
            name='members'
            mode='array'
            children={(field) => (
              <div className='space-y-3'>
                {field.state.value.map((_, i) => (
                  <div key={i} className='flex items-start gap-2'>
                    <form.Field
                      name={`members[${i}].name`}
                      children={(subField) => {
                        const isSubInvalid =
                          subField.state.meta.isTouched && !subField.state.meta.isValid;
                        return (
                          <Field className='flex-1' data-invalid={isSubInvalid}>
                            <Input
                              id={`member-name-${i}`}
                              name={subField.name}
                              placeholder='Member name'
                              value={subField.state.value}
                              onChange={(e) => subField.handleChange(e.target.value)}
                              onBlur={subField.handleBlur}
                              aria-label={`Member ${i + 1} name`}
                              aria-invalid={isSubInvalid}
                            />
                            {isSubInvalid && <FieldError errors={subField.state.meta.errors} />}
                          </Field>
                        );
                      }}
                    />
                    <form.Field
                      name={`members[${i}].role`}
                      children={(subField) => {
                        const isSubInvalid =
                          subField.state.meta.isTouched && !subField.state.meta.isValid;
                        return (
                          <Field className='flex-1' data-invalid={isSubInvalid}>
                            <Input
                              id={`member-role-${i}`}
                              name={subField.name}
                              placeholder='Role'
                              value={subField.state.value}
                              onChange={(e) => subField.handleChange(e.target.value)}
                              onBlur={subField.handleBlur}
                              aria-label={`Member ${i + 1} role`}
                              aria-invalid={isSubInvalid}
                            />
                            {isSubInvalid && <FieldError errors={subField.state.meta.errors} />}
                          </Field>
                        );
                      }}
                    />
                    <Button
                      type='button'
                      variant='ghost'
                      size='icon'
                      onClick={() => field.removeValue(i)}
                      aria-label={`Remove member ${i + 1}`}
                    >
                      <Icons.close className='h-4 w-4' />
                    </Button>
                  </div>
                ))}
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={() => field.pushValue({ name: '', role: '' })}
                >
                  <Icons.add className='mr-2 h-4 w-4' /> Add Member
                </Button>
                {field.state.value.length > 0 && (
                  <div className='flex flex-wrap gap-1'>
                    {field.state.value
                      .filter((m) => m.name)
                      .map((m, idx) => (
                        <Badge key={idx} variant='secondary'>
                          {m.name}
                          {m.role ? ` (${m.role})` : ''}
                        </Badge>
                      ))}
                  </div>
                )}
              </div>
            )}
          />

          <Separator />

          {/* ─── Section 4: Preferences (listeners / side effects) ─── */}
          <div className='space-y-1'>
            <h3 className='text-lg font-semibold'>Preferences</h3>
            <p className='text-muted-foreground text-sm'>
              Listener side effects — country resets state
            </p>
          </div>

          <FieldGroup className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <form.Field
              name='country'
              listeners={{
                onChange: ({ fieldApi }) => {
                  fieldApi.form.setFieldValue('state', '');
                }
              }}
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
                        <SelectValue placeholder='Select a country' />
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
              name='state'
              children={(field) => {
                const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor={field.name}>State / Region *</FieldLabel>
                    <Select
                      name={field.name}
                      value={field.state.value}
                      onValueChange={(value) => field.handleChange(value ?? '')}
                    >
                      <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                        <SelectValue
                          placeholder={selectedCountry ? 'Select state' : 'Select a country first'}
                        />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectGroup>
                          {stateOptions.map((opt) => (
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
          </FieldGroup>

          <Separator />

          {/* ─── Submit ─── */}
          <div className='flex gap-4 pt-2'>
            <Button type='button' variant='outline' onClick={() => form.reset()} className='flex-1'>
              Reset
            </Button>
            <form.Subscribe
              selector={(state) => state.isSubmitting}
              children={(isSubmitting) => (
                <Button type='submit' disabled={isSubmitting} className='flex-1'>
                  Register Team
                </Button>
              )}
            />
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
