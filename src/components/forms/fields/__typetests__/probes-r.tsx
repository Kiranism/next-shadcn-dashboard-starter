'use client';

/**
 * REGRESSION PROBES R2/R3/R5/R6/R7 + A8 positive half.
 * This file must compile CLEAN — any error here is a probe failure.
 */

import * as React from 'react';
import { z } from 'zod';
import { useAppForm } from '@/components/ui/tanstack-form';
import { Input } from '@/components/ui/input';
import { useFormFields, fieldFor } from '@/components/ui/tanstack-form';
import { DatePickerField } from './date-picker-field';

/** R8 support: a single-File custom widget — element paths TO a File must
 *  still bind even though paths THROUGH a File are excluded. */
function SingleFileBase({ label }: { label: string }) {
  return <span>{label}</span>;
}
const SingleFileField = fieldFor<File | null | undefined>()(SingleFileBase);

interface ProbeValues {
  title: string;
  password: string;
  severity: number;
  urgent: boolean;
  nickname?: string;
  tags: string[];
  attachments: File[];
  dueDate: Date | null;
  contact: {
    email: string;
    address: { city: string; zip: string };
  };
  items: { description: string; qty: number }[];
}

const probeDefaults: ProbeValues = {
  title: '',
  password: '',
  severity: 3,
  urgent: false,
  tags: [],
  attachments: [],
  dueDate: null,
  contact: { email: '', address: { city: '', zip: '' } },
  items: []
};

export function PositiveProbes() {
  const form = useAppForm({
    defaultValues: probeDefaults,
    onSubmit: ({ value }) => void value
  });

  const {
    FormTextField,
    FormSwitchField,
    FormSliderField,
    FormCheckboxField,
    FormFileUploadField,
    FormDatePickerField,
    FormSingleFileField
  } = useFormFields(form, {
    FormDatePickerField: DatePickerField,
    FormSingleFileField: SingleFileField
  });

  return (
    <>
      {/* R2: optional path (string | undefined) accepted by a text field */}
      <FormTextField name='nickname' label='Nickname' />

      {/* R3: nested path */}
      <FormTextField
        name='contact.address.city'
        label='City'
        validators={{ onBlur: z.string().min(1, 'City is required') }}
      />

      {/* R3: array element paths — literal and template-literal */}
      <FormTextField name='tags[0]' label='First tag' />
      {probeDefaults.items.map((_, i) => (
        <FormTextField
          key={i}
          name={`items[${i}].description`}
          label='Item description'
          validators={{ onChange: z.string().min(1) }}
        />
      ))}

      {/* R5: number path on TextField type='number' AND on SliderField */}
      <FormTextField name='severity' label='Severity' type='number' min={1} max={5} />
      <FormSliderField name='severity' label='Severity' min={1} max={5} step={1} />

      {/* Widget checks that must PASS: boolean paths on switch/checkbox, File[] on upload */}
      <FormSwitchField name='urgent' label='Urgent' description='Page the on-call' />
      <FormCheckboxField name='urgent' label='Urgent (checkbox)' />
      <FormFileUploadField name='attachments' label='Attachments' maxFiles={3} />

      {/* R8: the atomic-leaf filter must not break the PARENT of excluded
          sub-paths — Zod + fn validators and defaultValue still see File[]
          via DeepValue on 'attachments' */}
      <FormFileUploadField
        name='attachments'
        label='Attachments'
        maxFiles={3}
        defaultValue={[]}
        validators={{
          onChange: z.array(z.instanceof(File)).max(3, 'At most 3 files'),
          onSubmit: ({ value }) =>
            value && value.some((f) => f.size > 5_000_000)
              ? 'Each file must be under 5MB'
              : undefined
        }}
      />

      {/* R8b: element path TO an atomic File still binds a File-contracted widget */}
      <FormSingleFileField name='attachments[0]' label='First attachment' />

      {/* R6 positive: custom Date field binds Date-valued paths with full config typing */}
      <FormDatePickerField
        name='dueDate'
        label='Due Date'
        validators={{
          onChange: ({ value }) =>
            value && value.getTime() < Date.now() ? 'Must be in the future' : undefined
        }}
      />

      {/* A8 positive half: validator fn value is typed string — no cast */}
      <FormTextField
        name='title'
        label='Title'
        validators={{
          onChange: ({ value }) => (value.length < 5 ? 'At least 5 characters' : undefined),
          onBlur: z.string().min(5, 'At least 5 characters')
        }}
      />

      {/* Stricter-schema asymmetry (kept, same as TanStack upstream):
          z.string() on an optional string path compiles */}
      <FormTextField name='nickname' label='Nick' validators={{ onBlur: z.string().min(2) }} />

      {/* Typed listeners: value is boolean, cross-field setFieldValue path-checked */}
      <FormSwitchField
        name='urgent'
        label='Urgent'
        listeners={{
          onChange: ({ value, fieldApi }) => {
            if (value === true) {
              fieldApi.form.setFieldValue('contact.address.city', '');
            }
          }
        }}
      />

      {/* onChangeListenTo with a real path compiles */}
      <FormTextField
        name='password'
        label='Password'
        validators={{ onChange: z.string().min(8), onChangeListenTo: ['title'] }}
      />

      {/* defaultValue with the right type compiles */}
      <FormTextField name='title' label='Title' defaultValue='untitled' />
      <FormSliderField name='severity' label='Severity' defaultValue={3} />
    </>
  );
}

/**
 * R7: Pattern 2 (form.AppField render prop) is untouched and interoperable —
 * a hand-rolled AppField sits between bound flat fields on the same form.
 */
export function Pattern2Interop() {
  const form = useAppForm({
    defaultValues: probeDefaults,
    onSubmit: ({ value }) => void value
  });
  const { FormTextField } = useFormFields(form);

  return (
    <form.AppForm>
      <form.Form>
        <FormTextField name='title' label='Title' />
        <form.AppField name='contact.email' validators={{ onBlur: z.string().min(3) }}>
          {(field) => (
            <field.FieldSet>
              <field.Field>
                <field.FieldLabel htmlFor='contact-email'>Email</field.FieldLabel>
                <Input
                  id='contact-email'
                  type='email'
                  value={field.state.value}
                  onChange={(e) => field.handleChange(e.target.value)}
                  onBlur={field.handleBlur}
                />
              </field.Field>
              <field.FieldError />
            </field.FieldSet>
          )}
        </form.AppField>
        <form.SubmitButton>Save</form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
}
