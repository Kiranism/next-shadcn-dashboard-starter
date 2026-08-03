'use client';

import { createFormHookContexts } from '@tanstack/react-form';

export const { fieldContext, formContext, useFieldContext, useFormContext } =
  createFormHookContexts();

/**
 * The doc's "touched + invalid" check, shared by every field component:
 * errors surface after the user interacts with a field or a submit paints it.
 */
export function useFieldInvalid() {
  const field = useFieldContext();
  return field.state.meta.isTouched && !field.state.meta.isValid;
}

/** Props every field component shares. */
export type BaseFieldProps = {
  label: string;
  description?: string;
  /** Appends ' *' to the label. Purely visual — rules live in the schema. */
  required?: boolean;
};
