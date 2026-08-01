'use client';

/**
 * Extensibility probe: a fork user adds their own atomic leaf type via
 * declaration merging — no template files edited. Compiled in its own
 * program (tsconfig.augment.json) so the augmentation does not bleed into
 * the main probe suite.
 */

import * as React from 'react';
import { useAppForm } from '@/components/ui/tanstack-form';
import { useFormFields, fieldFor } from '@/components/ui/tanstack-form';

class Money {
  constructor(
    readonly amount: number,
    readonly currency: string
  ) {}
}

declare module '@/components/ui/form-context' {
  interface AtomicFieldValues {
    money: Money;
  }
}

interface InvoiceValues {
  label: string;
  price: Money;
}

function MoneyBase({ label }: { label: string }) {
  return <span>{label}</span>;
}
const MoneyField = fieldFor<Money | null | undefined>()(MoneyBase);

export function AugmentedForm() {
  const form = useAppForm({
    defaultValues: { label: '', price: new Money(0, 'USD') } as InvoiceValues,
    onSubmit: ({ value }) => void value
  });

  const { FormTextField, FormMoneyField } = useFormFields(form, {
    FormMoneyField: MoneyField
  });

  return (
    <>
      {/* real string path still binds */}
      <FormTextField name='label' label='Label' />

      {/* the augmented leaf's own props are no longer text paths… */}
      <FormTextField
        // @ts-expect-error — 'price.amount' tunnels into the user's atomic Money
        name='price.amount'
        label='bad'
      />
      <FormTextField
        // @ts-expect-error — 'price.currency' tunnels into the user's atomic Money
        name='price.currency'
        label='bad'
      />

      {/* …but the whole value still binds a Money-contracted widget */}
      <FormMoneyField name='price' label='Price' />
    </>
  );
}
