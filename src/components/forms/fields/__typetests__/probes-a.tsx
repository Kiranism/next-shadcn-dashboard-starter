'use client';

/**
 * ACCEPTANCE PROBES A1-A8 (+ R1 typo, R6 negative, listener-path negative).
 * Every probe that must be a COMPILE ERROR sits under a @ts-expect-error —
 * if the design fails to reject it, tsc reports "Unused '@ts-expect-error'
 * directive" and the probe FAILS.
 */

import * as React from 'react';
import { z } from 'zod';
import { useAppForm } from '@/components/ui/tanstack-form';
import { useFormFields } from '@/components/ui/tanstack-form';
import { DatePickerField, UnbrandedDatePickerField } from './date-picker-field';

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

export function NegativeProbes() {
  const form = useAppForm({
    defaultValues: probeDefaults,
    onSubmit: ({ value }) => void value
  });

  const { FormTextField, FormSwitchField, FormCustomDateField } = useFormFields(form, {
    FormCustomDateField: DatePickerField
  });

  return (
    <>
      {/* A1: text field on a boolean path */}
      <FormTextField
        // @ts-expect-error A1 — 'urgent' is boolean, not a text value
        name='urgent'
        label='A1'
      />

      {/* A2: switch on a number path */}
      <FormSwitchField
        // @ts-expect-error A2 — 'severity' is number, not boolean
        name='severity'
        label='A2'
      />

      {/* A3: parent OBJECT node as a field name */}
      <FormTextField
        // @ts-expect-error A3 — 'contact.address' is an object node, not a leaf
        name='contact.address'
        label='A3'
      />

      {/* A4: text field on a string[] path */}
      <FormTextField
        // @ts-expect-error A4 — 'tags' is string[], not a text value
        name='tags'
        label='A4'
      />

      {/* A5: wrong-typed Zod validator on a string path */}
      <FormTextField
        name='title'
        label='A5'
        // @ts-expect-error A5 — z.number() cannot validate a string path
        validators={{ onBlur: z.number() }}
      />

      {/* A6: wrong-typed defaultValue on a string path */}
      <FormTextField
        name='title'
        label='A6'
        // @ts-expect-error A6 — 42 is not assignable to string
        defaultValue={42}
      />

      {/* A7: onChangeListenTo pointing at a nonexistent source field */}
      <FormTextField
        name='title'
        label='A7'
        // @ts-expect-error A7 — 'pasword' is not a path of ProbeValues
        validators={{ onChange: z.string(), onChangeListenTo: ['pasword'] }}
      />

      {/* A8 (negative half): validator fn value is TYPED — string has no .foo */}
      <FormTextField
        name='title'
        label='A8'
        // @ts-expect-error A8 — value is string; property 'foo' does not exist
        validators={{ onChange: ({ value }) => value.foo }}
      />

      {/* R1: plain name typo still caught */}
      <FormTextField
        // @ts-expect-error R1 — typo 'titel'
        name='titel'
        label='R1'
      />

      {/* R6 negative: custom Date field rejects a string path */}
      <FormCustomDateField
        // @ts-expect-error R6 — 'title' is string, not a Date path
        name='title'
        label='R6-neg'
      />

      {/* A9: File sub-paths are NOT text fields — File is an atomic leaf */}
      <FormTextField
        // @ts-expect-error A9 — 'attachments[0].name' tunnels into a File
        name='attachments[0].name'
        label='A9'
      />

      {/* A9b: computed-index File sub-path rejected too */}
      {probeDefaults.attachments.map((_, i) => (
        <FormTextField
          key={i}
          // @ts-expect-error A9b — `attachments[${number}].size` tunnels into a File
          name={`attachments[${i}].size`}
          label='A9b'
        />
      ))}

      {/* A9c: File sub-path is not a listenable source path either */}
      <FormTextField
        name='title'
        label='A9c'
        validators={{
          onChange: z.string(),
          // @ts-expect-error A9c — cannot listen to a path inside an atomic File
          onChangeListenTo: ['attachments[0].name']
        }}
      />

      {/* Bonus (design's A8 note): cross-field setFieldValue path is checked */}
      <FormSwitchField
        name='urgent'
        label='listener-neg'
        listeners={{
          onChange: ({ fieldApi }) => {
            // @ts-expect-error — 'contact.address.cty' is not a path
            fieldApi.form.setFieldValue('contact.address.cty', '');
          }
        }}
      />
    </>
  );
}

/** Bonus: an UNBRANDED component may not join the registry. */
export function UnbrandedRejection() {
  const form = useAppForm({
    defaultValues: probeDefaults,
    onSubmit: ({ value }) => void value
  });
  const fields = useFormFields(form, {
    // @ts-expect-error unbranded base components are rejected (no fieldFor brand)
    FormCustomDateField: UnbrandedDatePickerField
  });
  return <>{Object.keys(fields).length}</>;
}
