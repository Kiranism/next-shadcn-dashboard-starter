'use client';

/**
 * EDGE-LIMIT PROBES — documented boundaries of the typed composition layer.
 * L1: Record<string, string> dynamic keys are OPEN (any key compiles) while
 *     static-path typos are still caught.
 * L2: recursive value types hit TS2589 — inherited from DeepKeys itself
 *     (raw form.AppField fails identically); don't model recursion in forms.
 * L3: `as FormValues` erases defaults completeness; `satisfies` catches it.
 */

import * as React from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';

// --- L1: dynamic keys -------------------------------------------------------
interface DynValues {
  title: string;
  meta: Record<string, string>;
}

export function DynForm() {
  const form = useAppForm({
    defaultValues: { title: '', meta: {} } as DynValues,
    onSubmit: () => {}
  });
  const { FormTextField } = useFormFields(form);
  return (
    <>
      {/* L1a: arbitrary key under a Record path — compiles (open by design) */}
      <FormTextField name='meta.anything-goes' label='Dyn' />
      {/* @ts-expect-error L1b: static-path typo must still be caught */}
      <FormTextField name='titel' label='Typo' />
    </>
  );
}

// --- L2: recursive type (documented, not probed) -----------------------------
// Recursive value shapes (interface Category { children: Category[] }) exceed
// TypeScript's instantiation depth (TS2589) as soon as fields bind to them.
// This is inherited from TanStack's DeepKeys — raw form.AppField fails
// identically on the same shape — so it cannot be probed with a stable
// expect-error location (the error surfaces at the useFormFields call,
// not the name usage). Don't model recursion in form values: flatten, or
// type explicit depth. Compiler evidence: plans/003-assets (edge-limits).

// --- L3: defaults completeness ----------------------------------------------
interface StrictValues {
  a: string;
  b: number;
}

export function CastForm() {
  // `as` erases completeness checking — this compiles with missing fields.
  const castHole = {} as StrictValues;
  // `satisfies` catches it — prefer it for non-union value shapes.
  // @ts-expect-error L3: satisfies enforces completeness
  const caught = {} satisfies StrictValues;
  void caught;
  const form = useAppForm({ defaultValues: castHole, onSubmit: () => {} });
  const { FormTextField } = useFormFields(form);
  return <FormTextField name='a' label='A' />;
}
