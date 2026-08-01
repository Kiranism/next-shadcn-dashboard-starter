'use client';

/**
 * Composed-field probes — FormCheckboxGroupField / FormArrayTextField
 * (string[] contracts), the shared prop surface (orientation, disabled,
 * rich radio options), write guards and the schema/server helpers. Same
 * oracle as the rest of the suite.
 */

import * as React from 'react';
import { z } from 'zod';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { DatePickerField } from './date-picker-field';

interface Phase3Values {
  title: string;
  urgent: boolean;
  severity: number;
  interests: string[];
  emails: string[];
  plan: string;
  due?: Date | null;
}

const defaults: Phase3Values = {
  title: '',
  urgent: false,
  severity: 3,
  interests: [],
  emails: [''],
  plan: '',
  due: null
};

const interestOptions = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B', description: 'The B option', disabled: true }
];

export function ComposedPositive() {
  const form = useAppForm({ defaultValues: defaults, onSubmit: () => {} });
  const {
    FormTextField,
    FormSelectField,
    FormRadioGroupField,
    FormCheckboxGroupField,
    FormArrayTextField
  } = useFormFields(form);
  return (
    <>
      {/* string[] paths bind to the array widgets */}
      <FormCheckboxGroupField
        name='interests'
        label='Interests'
        required
        options={interestOptions}
        columns={2}
        validators={{ onChange: z.array(z.string()).min(1, 'Pick one') }}
      />
      <FormArrayTextField
        name='emails'
        label='Emails'
        itemType='email'
        itemPlaceholder='name@example.com'
        itemValidators={{ onBlur: z.string().email('Invalid email') }}
        maxItems={5}
        addLabel='Add Email'
      />
      {/* Shared prop surface */}
      <FormTextField name='title' label='Title' orientation='responsive' disabled />
      <FormSelectField
        name='plan'
        label='Plan'
        orientation='horizontal'
        disabled
        options={[{ value: 'x', label: 'X', disabled: true }]}
      />
      <FormRadioGroupField
        name='plan'
        label='Plan'
        variant='card'
        options={interestOptions}
        disabled
      />
    </>
  );
}

export function ComposedNegative() {
  const form = useAppForm({ defaultValues: defaults, onSubmit: () => {} });
  const {
    FormCheckboxGroupField,
    FormArrayTextField,
    FormTextField,
    FormDatePickerField,
    FormComboboxField
  } = useFormFields(form);
  return (
    <>
      {/* shipped DatePicker/Combobox obey their value contracts */}
      <FormDatePickerField name='due' label='Due' />
      {/* @ts-expect-error CF-N8: date picker on a string path */}
      <FormDatePickerField name='title' label='Nope' />
      {/* @ts-expect-error CF-N9: combobox on a Date path */}
      <FormComboboxField name='due' label='Nope' options={interestOptions} />
      {/* @ts-expect-error CF-N1: checkbox group on a scalar string path */}
      <FormCheckboxGroupField name='title' label='Nope' options={interestOptions} />
      {/* @ts-expect-error CF-N2: checkbox group on a boolean path */}
      <FormCheckboxGroupField name='urgent' label='Nope' options={interestOptions} />
      {/* @ts-expect-error CF-N3: array text field on a number path */}
      <FormArrayTextField name='severity' label='Nope' />
      {/* @ts-expect-error CF-N4: text field on a string[] path (unchanged from A4) */}
      <FormTextField name='interests' label='Nope' />
      {/* @ts-expect-error CF-N5: orientation is a closed union */}
      <FormTextField name='title' label='Nope' orientation='diagonal' />
      {/* The itemValidators slot is typed to STRING validators */}
      {/* @ts-expect-error CF-N6: a number schema is rejected */}
      <FormArrayTextField name='emails' label='Nope' itemValidators={{ onBlur: z.number() }} />
    </>
  );
}

interface WriteGuardValues {
  role: 'admin' | 'viewer';
  bio: string;
  colors: ('red' | 'blue')[];
  notes: string[];
}

export function WriteGuardProbes() {
  const form = useAppForm({
    defaultValues: { role: 'viewer', bio: '', colors: [], notes: [] } as WriteGuardValues,
    onSubmit: () => {}
  });
  const { FormSelectField, FormTextField, FormArrayTextField } = useFormFields(form);
  return (
    <>
      {/* Positive: literal-union path binds a select with union-valid options */}
      <FormSelectField
        name='role'
        label='Role'
        options={[
          { value: 'admin', label: 'Admin' },
          { value: 'viewer', label: 'Viewer' }
        ]}
      />
      <FormSelectField
        name='role'
        label='Role'
        options={[
          // @ts-expect-error W3: option value outside the path's union
          { value: 'superadmin', label: 'Nope' }
        ]}
      />
      {/* @ts-expect-error W4: free-text widget not offered a literal-union path */}
      <FormTextField name='role' label='Nope' />
      {/* Positive: plain string paths keep fully-open options and free text */}
      <FormTextField name='bio' label='Bio' />
      {/* @ts-expect-error W8: free-text ROWS not offered literal-element arrays */}
      <FormArrayTextField name='colors' label='Nope' />
      {/* Positive: plain string[] paths still bind free-text rows */}
      <FormArrayTextField name='notes' label='Notes' />
    </>
  );
}

import { schemaFor, applyServerErrors } from '@/components/ui/tanstack-form';

export function HelperProbes() {
  const form = useAppForm({ defaultValues: defaults, onSubmit: () => {} });
  const { FormTextField } = useFormFields(form);
  const mounted = (
    // Positive: schemaFor's result mounts on a TYPED validator slot.
    <FormTextField
      name='title'
      label='Title'
      validators={{ onBlur: schemaFor(z.object({ title: z.string().min(2) }), 'title') }}
    />
  );
  void mounted;
  applyServerErrors(form, { fieldErrors: { title: 'Taken' } });
  // @ts-expect-error W5: typo'd server-error field key rejected
  applyServerErrors(form, { fieldErrors: { titel: 'Taken' } });
  const helperSchema = z.object({ title: z.string().min(2), count: z.number() });
  // @ts-expect-error W6: schemaFor path typos are compile errors
  const typoed = schemaFor(helperSchema, 'titel');
  void typoed;
  const wrongTyped = (
    <FormTextField
      name='title'
      label='Nope'
      // @ts-expect-error W7: number-path schema rejected on a string field
      validators={{ onBlur: schemaFor(helperSchema, 'count') }}
    />
  );
  void wrongTyped;
  return null;
}

export function ReviewFixProbes() {
  const form = useAppForm({ defaultValues: defaults, onSubmit: () => {} });
  // Positive: typed itemValidators function receives the row string.
  const { FormArrayTextField } = useFormFields(form);
  const okFn = (
    <FormArrayTextField
      name='emails'
      label='Emails'
      itemValidators={{ onChange: ({ value }) => (value.length > 3 ? undefined : 'too short') }}
    />
  );
  void okFn;
  // Negative: an extras key that shadows a shipped widget is rejected
  // (silently replacing FormTextField would crash at runtime).
  const shadowing = { FormTextField: DatePickerField };
  // @ts-expect-error CF-N7: extras key collision with a shipped field
  const collision = useFormFields(form, shadowing);
  void collision;
  // Positive: non-colliding extras still bind.
  const { FormCustomDateField } = useFormFields(form, { FormCustomDateField: DatePickerField });
  void FormCustomDateField;
  return null;
}
