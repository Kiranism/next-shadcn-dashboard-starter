'use client';

import * as React from 'react';
import {
  useAppForm,
  useFormFields,
  FormErrors,
  scrollToFirstError
} from '@/components/ui/tanstack-form';
import { useStore } from '@tanstack/react-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
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
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(1),
  team: z.object({
    name: z.string().min(2),
    size: z.number().min(1).max(100)
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
  const form = useAppForm({
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
    onSubmit: ({ value }) => {
      console.log('Team registered:', value);
      toast.success('Team registered successfully!');
    },
    onSubmitInvalid: () => {
      scrollToFirstError();
    }
  });

  const { FormTextField, FormSelectField } =
    useFormFields<AdvancedFormValues>();

  // Read current country reactively for dependent state field
  const selectedCountry = useStore(form.store, (s) => s.values.country);
  const stateOptions = countryStateMap[selectedCountry] ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-2xl font-bold'>Team Registration</CardTitle>
        <p className='text-muted-foreground'>
          Demonstrates async validation, linked fields, nested objects, dynamic
          arrays, listeners, form-level errors, and scroll-to-first-error.
        </p>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-6'>
            {/* Form-level error display */}
            <FormErrors />

            {/* ─── Section 1: Account ─── */}
            <div className='space-y-1'>
              <h3 className='text-lg font-semibold'>Account</h3>
              <p className='text-muted-foreground text-sm'>
                Async validation, linked fields
              </p>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              {/* Username — async validation (spinner built into FormTextField) */}
              <FormTextField
                name='username'
                label='Username'
                required
                placeholder='Choose a username'
                validators={{
                  onBlur: z
                    .string()
                    .min(3, 'Username must be at least 3 characters'),
                  onChangeAsync: async ({ value }: { value: string }) => {
                    if (!value || value.length < 3) return undefined;
                    await new Promise((r) => setTimeout(r, 500));
                    if (value === 'admin' || value === 'test') {
                      return 'Username is taken';
                    }
                    return undefined;
                  },
                  onChangeAsyncDebounceMs: 500
                }}
              />

              {/* Email */}
              <FormTextField
                name='email'
                label='Email'
                required
                type='email'
                placeholder='you@example.com'
                validators={{
                  onBlur: z.string().email('Invalid email')
                }}
              />

              {/* Password */}
              <FormTextField
                name='password'
                label='Password'
                required
                type='password'
                placeholder='Min 8 characters'
                validators={{
                  onBlur: z.string().min(8, 'Must be at least 8 characters')
                }}
              />

              {/* Confirm Password — linked validation via AppField render prop */}
              <form.AppField
                name='confirmPassword'
                validators={{
                  onChangeListenTo: ['password'],
                  onChange: ({ value, fieldApi }) => {
                    const password = fieldApi.form.getFieldValue('password');
                    if (value !== password) return 'Passwords do not match';
                    return undefined;
                  },
                  onBlur: z.string().min(1, 'Please confirm your password')
                }}
              >
                {(field) => (
                  <field.TextField
                    label='Confirm Password'
                    required
                    type='password'
                    placeholder='Confirm password'
                  />
                )}
              </form.AppField>
            </div>

            <Separator />

            {/* ─── Section 2: Team Info (nested objects) ─── */}
            <div className='space-y-1'>
              <h3 className='text-lg font-semibold'>Team Info</h3>
              <p className='text-muted-foreground text-sm'>
                Nested objects with dot-notation paths
              </p>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormTextField
                name='team.name'
                label='Team Name'
                required
                placeholder='e.g. Alpha Squad'
                validators={{
                  onBlur: z
                    .string()
                    .min(2, 'Team name must be at least 2 characters')
                }}
              />
              <FormTextField
                name='team.size'
                label='Team Size'
                required
                type='number'
                min={1}
                max={100}
                placeholder='1-100'
                validators={{
                  onBlur: z
                    .number()
                    .min(1, 'At least 1 member')
                    .max(100, 'Max 100 members')
                }}
              />
            </div>

            <Separator />

            {/* ─── Section 3: Members (dynamic array rows) ─── */}
            <div className='space-y-1'>
              <h3 className='text-lg font-semibold'>Members</h3>
              <p className='text-muted-foreground text-sm'>
                Dynamic array rows with add / remove
              </p>
            </div>

            <form.AppField name='members' mode='array'>
              {(field) => (
                <div className='space-y-3'>
                  {field.state.value.map((_, i) => (
                    <div key={i} className='flex items-start gap-2'>
                      <form.AppField
                        name={`members[${i}].name`}
                        validators={{
                          onBlur: z.string().min(1, 'Member name is required')
                        }}
                      >
                        {(subField) => (
                          <subField.FieldSet className='flex-1'>
                            <subField.Field>
                              <Input
                                placeholder='Member name'
                                value={subField.state.value}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value)
                                }
                                onBlur={subField.handleBlur}
                              />
                            </subField.Field>
                            <subField.FieldError />
                          </subField.FieldSet>
                        )}
                      </form.AppField>
                      <form.AppField
                        name={`members[${i}].role`}
                        validators={{
                          onBlur: z.string().min(1, 'Role is required')
                        }}
                      >
                        {(subField) => (
                          <subField.FieldSet className='flex-1'>
                            <subField.Field>
                              <Input
                                placeholder='Role'
                                value={subField.state.value}
                                onChange={(e) =>
                                  subField.handleChange(e.target.value)
                                }
                                onBlur={subField.handleBlur}
                              />
                            </subField.Field>
                            <subField.FieldError />
                          </subField.FieldSet>
                        )}
                      </form.AppField>
                      <Button
                        type='button'
                        variant='ghost'
                        size='icon'
                        onClick={() => field.removeValue(i)}
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
            </form.AppField>

            <Separator />

            {/* ─── Section 4: Preferences (listeners / side effects) ─── */}
            <div className='space-y-1'>
              <h3 className='text-lg font-semibold'>Preferences</h3>
              <p className='text-muted-foreground text-sm'>
                Listener side effects — country resets state
              </p>
            </div>

            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormSelectField
                name='country'
                label='Country'
                required
                options={countryOptions}
                placeholder='Select a country'
                validators={{
                  onBlur: z.string().min(1, 'Select a country')
                }}
                listeners={{
                  onChange: ({ fieldApi }) => {
                    fieldApi.form.setFieldValue('state', '');
                  }
                }}
              />
              <FormSelectField
                name='state'
                label='State / Region'
                required
                options={stateOptions}
                placeholder={
                  selectedCountry ? 'Select state' : 'Select a country first'
                }
                validators={{
                  onBlur: z.string().min(1, 'Please select a state')
                }}
              />
            </div>

            <Separator />

            {/* ─── Submit ─── */}
            <div className='flex gap-4 pt-2'>
              <Button
                type='button'
                variant='outline'
                onClick={() => form.reset()}
                className='flex-1'
              >
                Reset
              </Button>
              <form.SubmitButton label='Register Team' className='flex-1' />
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
