'use client';

import * as React from 'react';
import { useStore } from '@tanstack/react-form';
import { z } from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Field, FieldError, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Icons } from '@/components/icons';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAppForm } from '@/lib/form';

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
            {/* Username — async validation (spinner built into TextField) */}
            <form.AppField
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
              children={(field) => (
                <field.TextField label='Username' required placeholder='Choose a username' />
              )}
            />

            <form.AppField
              name='email'
              children={(field) => (
                <field.TextField
                  label='Email'
                  required
                  type='email'
                  placeholder='you@example.com'
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

            {/* Confirm Password — linked validation via onChangeListenTo */}
            <form.AppField
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
              children={(field) => (
                <field.TextField
                  label='Confirm Password'
                  required
                  type='password'
                  placeholder='Confirm password'
                />
              )}
            />
          </FieldGroup>

          <Separator />

          {/* ─── Section 2: Team Info (nested objects) ─── */}
          <div className='space-y-1'>
            <h3 className='text-lg font-semibold'>Team Info</h3>
            <p className='text-muted-foreground text-sm'>Nested objects with dot-notation paths</p>
          </div>

          <FieldGroup className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            <form.AppField
              name='team.name'
              children={(field) => (
                <field.TextField label='Team Name' required placeholder='e.g. Alpha Squad' />
              )}
            />
            <form.AppField
              name='team.size'
              children={(field) => (
                <field.TextField
                  label='Team Size'
                  required
                  type='number'
                  min={1}
                  max={100}
                  placeholder='1-100'
                />
              )}
            />
          </FieldGroup>

          <Separator />

          {/* ─── Section 3: Members (dynamic array rows — raw form.Field) ─── */}
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
                              aria-describedby={isSubInvalid ? `member-name-${i}-error` : undefined}
                            />
                            {isSubInvalid && (
                              <FieldError
                                id={`member-name-${i}-error`}
                                errors={subField.state.meta.errors}
                              />
                            )}
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
                              aria-describedby={isSubInvalid ? `member-role-${i}-error` : undefined}
                            />
                            {isSubInvalid && (
                              <FieldError
                                id={`member-role-${i}-error`}
                                errors={subField.state.meta.errors}
                              />
                            )}
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
            <form.AppField
              name='country'
              listeners={{
                onChange: ({ fieldApi }) => {
                  fieldApi.form.setFieldValue('state', '');
                }
              }}
              children={(field) => (
                <field.SelectField
                  label='Country'
                  required
                  options={countryOptions}
                  placeholder='Select a country'
                />
              )}
            />
            <form.AppField
              name='state'
              children={(field) => (
                <field.SelectField
                  label='State / Region'
                  required
                  options={stateOptions}
                  placeholder={selectedCountry ? 'Select state' : 'Select a country first'}
                />
              )}
            />
          </FieldGroup>

          <Separator />

          {/* ─── Submit ─── */}
          <div className='flex gap-4 pt-2'>
            <Button type='button' variant='outline' onClick={() => form.reset()} className='flex-1'>
              Reset
            </Button>
            <form.AppForm>
              <form.SubmitButton className='flex-1'>Register Team</form.SubmitButton>
            </form.AppForm>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
