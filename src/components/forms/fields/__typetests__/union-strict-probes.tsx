'use client';

/**
 * ACCEPTANCE PROBES for LIMITATION 2 (union cross-branch paths), compiled
 * against the STRICT core. Self-verifying: every must-error sits under
 * @ts-expect-error (TS2578 fires if the rejection is lost), every must-bind
 * is plain code (any error is a probe failure).
 */

import * as React from 'react';
import { z } from 'zod';
import { useAppForm } from '@/components/ui/tanstack-form';
import { useFormFields } from '@/components/ui/tanstack-form';
import { accountDefaultValues } from './account-schema';

interface ConflictA {
  kind: 'a';
  threshold: number; // number in branch 'a'
  flag: boolean; // boolean in branch 'a'
  shared: string;
  onlyA: number; // branch-specific number
}
interface ConflictB {
  kind: 'b';
  threshold: string; // string in branch 'b'
  flag: string; // string in branch 'b'
  shared: string;
  onlyB: boolean; // branch-specific boolean
}
type Conflict = ConflictA | ConflictB;

const conflictDefaults = {
  kind: 'a',
  threshold: 0,
  flag: false,
  shared: '',
  onlyA: 0
} as Conflict;

export function StrictUnionProbes() {
  const form = useAppForm({
    defaultValues: conflictDefaults,
    onSubmit: ({ value }) => void value
  });

  const { FormSliderField, FormSelectField, FormSwitchField, FormTextField, FormTextareaField } =
    useFormFields(form);

  return (
    <>
      {/* U1: LIMITATION 2 RESOLVED — slider no longer offered a path that is
          string in branch 'b'. */}
      <FormSliderField
        // @ts-expect-error U1 — 'threshold' is number|string across branches, not number
        name='threshold'
        label='U1'
      />

      {/* U2: string-only widgets reject it from the other side too. */}
      <FormSelectField
        // @ts-expect-error U2 — 'threshold' is number|string, not string
        name='threshold'
        label='U2'
        options={[]}
      />

      {/* U3: boolean/string conflict rejected by switch. */}
      <FormSwitchField
        // @ts-expect-error U3 — 'flag' is boolean|string across branches
        name='flag'
        label='U3'
      />

      {/* U4: TextField still binds the number/string conflict — its contract
          (string|number|null|undefined) covers the whole merged union. */}
      <FormTextField name='threshold' label='U4' type='number' />

      {/* U5: but not the boolean/string conflict. */}
      <FormTextareaField
        // @ts-expect-error U5 — 'flag' merges to boolean|string
        name='flag'
        label='U5'
      />

      {/* U6: branch-specific fields keep their branch's value and still bind
          the matching widget. */}
      <FormSliderField name='onlyA' label='U6' min={0} max={10} />
      <FormSwitchField name='onlyB' label='U6b' />

      {/* U7: shared same-typed field binds; validators/defaultValue typed. */}
      <FormTextField
        name='shared'
        label='U7'
        defaultValue=''
        validators={{ onChange: z.string().min(1) }}
      />

      {/* U8: discriminator (literal union across branches) still binds
          string widgets. */}
      <FormTextField name='kind' label='U8' />
    </>
  );
}

/** R4 re-check on the REAL account union under strict — must all bind. */
export function StrictAccountUnion() {
  const form = useAppForm({
    defaultValues: accountDefaultValues,
    onSubmit: ({ value }) => void value
  });

  const { FormTextField, FormCheckboxField } = useFormFields(form);

  return (
    <>
      <FormTextField name='username' label='Username' />
      <FormTextField name='amount' label='Amount' type='number' />
      <FormCheckboxField name='acceptTerms' label='Terms' />
      <FormTextField name='ssn' label='SSN' />
      <FormTextField name='companyName' label='Company' />
      <FormTextField name='vat' label='VAT' />
      <FormTextField name='accountType' label='Type' />
      <FormTextField
        // @ts-expect-error typo still caught under strict
        name='compnyName'
        label='typo'
      />
    </>
  );
}
