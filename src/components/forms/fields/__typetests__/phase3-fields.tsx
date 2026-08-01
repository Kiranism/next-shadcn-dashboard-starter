'use client';

/**
 * PHASE 3 PROBES — FormCheckboxGroupField / FormArrayTextField (string[]
 * contracts) and the Phase 2 prop-surface additions (orientation, disabled,
 * rich radio options). Same oracle as the rest of the suite.
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
}

const defaults: Phase3Values = {
  title: '',
  urgent: false,
  severity: 3,
  interests: [],
  emails: [''],
  plan: ''
};

const interestOptions = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B', description: 'The B option', disabled: true }
];

export function Phase3Positive() {
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
      {/* Phase 2 prop-surface additions */}
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

export function Phase3Negative() {
  const form = useAppForm({ defaultValues: defaults, onSubmit: () => {} });
  const { FormCheckboxGroupField, FormArrayTextField, FormTextField } = useFormFields(form);
  return (
    <>
      {/* @ts-expect-error P3-N1: checkbox group on a scalar string path */}
      <FormCheckboxGroupField name='title' label='Nope' options={interestOptions} />
      {/* @ts-expect-error P3-N2: checkbox group on a boolean path */}
      <FormCheckboxGroupField name='urgent' label='Nope' options={interestOptions} />
      {/* @ts-expect-error P3-N3: array text field on a number path */}
      <FormArrayTextField name='severity' label='Nope' />
      {/* @ts-expect-error P3-N4: text field on a string[] path (unchanged from A4) */}
      <FormTextField name='interests' label='Nope' />
      {/* @ts-expect-error P3-N5: orientation is a closed union */}
      <FormTextField name='title' label='Nope' orientation='diagonal' />
      {/* review-fix: the itemValidators slot is typed to STRING validators */}
      {/* @ts-expect-error P3-N6: a number schema is rejected */}
      <FormArrayTextField name='emails' label='Nope' itemValidators={{ onBlur: z.number() }} />
    </>
  );
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
  // @ts-expect-error P3-N7: extras key collision with a shipped field
  const collision = useFormFields(form, shadowing);
  void collision;
  // Positive: non-colliding extras still bind.
  const { FormDatePickerField } = useFormFields(form, { FormDatePickerField: DatePickerField });
  void FormDatePickerField;
  return null;
}
