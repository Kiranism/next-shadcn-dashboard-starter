'use client';

/**
 * R4: discriminated-union TFormData (the audit's validation-gauntlet shape).
 * Shared keys and branch-specific keys must both bind; typos must still error.
 */

import * as React from 'react';
import { z } from 'zod';
import { useAppForm } from '@/components/ui/tanstack-form';
import { useFormFields } from '@/components/ui/tanstack-form';
import { accountSchema, accountDefaultValues, type AccountFormValues } from './account-schema';

export function UnionAccountForm() {
  const form = useAppForm({
    defaultValues: accountDefaultValues,
    validators: { onSubmit: accountSchema },
    onSubmit: ({ value }) => void value
  });

  const { FormTextField, FormCheckboxField } = useFormFields(form);

  return (
    <form.AppForm>
      <form.Form>
        {/* shared keys */}
        <FormTextField
          name='username'
          label='Username'
          validators={{ onBlur: z.string().min(3, 'Username must be at least 3 characters') }}
        />
        <FormTextField name='password' label='Password' type='password' />
        <FormTextField name='amount' label='Amount' type='number' />
        <FormCheckboxField name='acceptTerms' label='I accept the terms' />

        {/* branch-specific keys (individual / company) */}
        <FormTextField
          name='ssn'
          label='SSN'
          validators={{
            onBlur: z.string().regex(/^\d{3}-\d{2}-\d{4}$/, 'SSN must match 123-45-6789')
          }}
        />
        <FormTextField name='companyName' label='Company Name' />
        <FormTextField name='vat' label='VAT' />

        {/* union typo still caught */}
        <FormTextField
          // @ts-expect-error R4 — 'compnyName' is not a path of the union
          name='compnyName'
          label='typo'
        />

        {/* discriminator is a string-literal-union path — widget filter must not drop it */}
        <FormTextField name='accountType' label='Account Type' />

        <form.SubmitButton>Create account</form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
}

// keep the imported type referenced so the shape stays honest
export type _Check = AccountFormValues['accountType'];
