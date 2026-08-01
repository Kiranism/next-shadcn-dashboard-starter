/**
 * tanstack-form.tsx — Main entry point for the form system.
 *
 * Provides useAppForm, useFormFields, Form, SubmitButton, StepButton,
 * withForm, and withFieldGroup. See docs/forms.md for full usage guide.
 */

import { createFormHook, useStore } from '@tanstack/react-form';
import type { VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Button, type buttonVariants } from '@/components/ui/button';
import { Spinner } from '@/components/ui/spinner';
import {
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldTitle
} from '@/components/ui/field';
import { InputGroup, InputGroupAddon, InputGroupInput } from '@/components/ui/input-group';

// Field primitives re-exported so custom-field recipes need only this
// entry point (the Custom Fields docs snippet imports them from here).
export { FieldContent, FieldDescription, FieldLabel, FieldTitle } from '@/components/ui/field';
import {
  TextField,
  TextareaField,
  SelectField,
  CheckboxField,
  SwitchField,
  RadioGroupField,
  SliderField,
  FileUploadField,
  CheckboxGroupField,
  ArrayTextField,
  DatePickerField,
  ComboboxField,
  FormTextField,
  FormTextareaField,
  FormSelectField,
  FormCheckboxField,
  FormSwitchField,
  FormRadioGroupField,
  FormSliderField,
  FormFileUploadField,
  type TextFieldValue,
  type TextareaFieldValue,
  type SelectFieldValue,
  type CheckboxFieldValue,
  type SwitchFieldValue,
  type RadioGroupFieldValue,
  type SliderFieldValue,
  type FileUploadFieldValue,
  type CheckboxGroupFieldValue,
  type ArrayTextFieldValue,
  type DatePickerFieldValue,
  type ComboboxFieldValue
} from '@/components/forms/fields';
import { cn } from '@/lib/utils';
import {
  fieldContext,
  formContext,
  useFormContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  bindFieldComponent,
  withItemScope,
  type FormLike,
  type BoundFormField,
  type BoundFreeTextField,
  type BoundClearableField,
  type BoundFreeTextArrayField,
  type BoundExtraFields,
  type FieldComponentFor,
  type WithTypedName
} from './form-context';

// ---------------------------------------------------------------------------
// Form-level components (used as form.ComponentName)
// ---------------------------------------------------------------------------

function Form({
  children,
  className,
  ...props
}: Omit<React.ComponentPropsWithoutRef<'form'>, 'onSubmit' | 'noValidate'> & {
  children?: React.ReactNode;
}) {
  const form = useFormContext();
  const isSubmitting = useStore(form.store, (s) => s.isSubmitting);
  const handleSubmit = React.useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form]
  );
  // className is destructured OUT of props: a caller's class merges with the
  // base layout (tailwind-merge resolves conflicts like p-*) instead of the
  // spread silently replacing it.
  return (
    <form
      onSubmit={handleSubmit}
      aria-busy={isSubmitting}
      className={cn('mx-auto flex w-full flex-col gap-2 p-2 md:p-5', className)}
      noValidate
      {...props}
    >
      {children}
    </form>
  );
}

function SubmitButton({
  children,
  className,
  size,
  disabled,
  ...props
}: React.ComponentProps<'button'> & VariantProps<typeof buttonVariants>) {
  const form = useFormContext();
  // Scalar subscriptions (not a fresh tuple selector): the button re-renders
  // only when canSubmit/isSubmitting actually flip, not on every keystroke.
  const canSubmit = useStore(form.store, (s) => s.canSubmit);
  const isSubmitting = useStore(form.store, (s) => s.isSubmitting);
  return (
    <Button
      className={className}
      size={size}
      {...props}
      // After the spread: a caller's `disabled` can force-disable but can
      // never override the canSubmit/isSubmitting safety gate; type stays
      // 'submit' regardless.
      type='submit'
      disabled={disabled || !canSubmit || isSubmitting}
    >
      {isSubmitting && <Spinner data-icon='inline-start' />}
      {children}
    </Button>
  );
}

function StepButton({
  label,
  handleMovement,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    label: React.ReactNode | string;
    handleMovement: () => void;
  }) {
  return (
    <Button size='sm' variant='ghost' type='button' onClick={handleMovement} {...props}>
      {label}
    </Button>
  );
}

// ---------------------------------------------------------------------------
// Hook creation
// ---------------------------------------------------------------------------

const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    // Structural (for custom fields via AppField escape hatch)
    Field: FormField,
    FieldError: FormFieldError,
    FieldSet: FormFieldSet,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldTitle,
    InputGroup,
    InputGroupAddon,
    InputGroupInput,
    // Base field components (for AppField render-prop pattern), each wrapped
    // in a per-instance accessibility-id scope so body- and child-computed
    // ids agree (see withItemScope).
    TextField: withItemScope(TextField),
    TextareaField: withItemScope(TextareaField),
    SelectField: withItemScope(SelectField),
    CheckboxField: withItemScope(CheckboxField),
    SwitchField: withItemScope(SwitchField),
    RadioGroupField: withItemScope(RadioGroupField),
    SliderField: withItemScope(SliderField),
    FileUploadField: withItemScope(FileUploadField),
    CheckboxGroupField: withItemScope(CheckboxGroupField),
    ArrayTextField: withItemScope(ArrayTextField),
    DatePickerField: withItemScope(DatePickerField),
    ComboboxField: withItemScope(ComboboxField)
  },
  formComponents: {
    // Layout & actions
    Form,
    SubmitButton,
    StepButton,
    FieldLegend,
    FieldDescription,
    FieldSeparator
    // The untyped form.TextField/form.SelectField/… flat variants were
    // removed: they bypassed every name/value check. Use the components
    // returned by useFormFields(form) instead.
  }
});

// ---------------------------------------------------------------------------
// Instance-bound typed flat fields — useFormFields(form)
// ---------------------------------------------------------------------------

/**
 * The 8 shipped widgets, bound to a form's value type. Each widget's `name`
 * only accepts paths whose value it can edit (its XxxFieldValue contract).
 */
export interface TypedFormFields<TValues> {
  FormTextField: BoundFreeTextField<
    TValues,
    TextFieldValue,
    React.ComponentProps<typeof TextField>
  >;
  FormTextareaField: BoundFreeTextField<
    TValues,
    TextareaFieldValue,
    React.ComponentProps<typeof TextareaField>
  >;
  FormSelectField: BoundFormField<
    TValues,
    SelectFieldValue,
    React.ComponentProps<typeof SelectField>
  >;
  FormCheckboxField: BoundFormField<
    TValues,
    CheckboxFieldValue,
    React.ComponentProps<typeof CheckboxField>
  >;
  FormSwitchField: BoundFormField<
    TValues,
    SwitchFieldValue,
    React.ComponentProps<typeof SwitchField>
  >;
  FormRadioGroupField: BoundFormField<
    TValues,
    RadioGroupFieldValue,
    React.ComponentProps<typeof RadioGroupField>
  >;
  FormSliderField: BoundFormField<
    TValues,
    SliderFieldValue,
    React.ComponentProps<typeof SliderField>
  >;
  FormFileUploadField: BoundFormField<
    TValues,
    FileUploadFieldValue,
    React.ComponentProps<typeof FileUploadField>
  >;
  FormCheckboxGroupField: BoundFormField<
    TValues,
    CheckboxGroupFieldValue,
    React.ComponentProps<typeof CheckboxGroupField>
  >;
  FormArrayTextField: BoundFreeTextArrayField<
    TValues,
    ArrayTextFieldValue,
    React.ComponentProps<typeof ArrayTextField>
  >;
  FormDatePickerField: BoundClearableField<
    TValues,
    DatePickerFieldValue,
    React.ComponentProps<typeof DatePickerField>
  >;
  FormComboboxField: BoundFormField<
    TValues,
    ComboboxFieldValue,
    React.ComponentProps<typeof ComboboxField>
  >;
}

/** @deprecated Return shape of the zero-arg overload. Removed next release. */
type LegacyFormFields<TValues> = {
  FormTextField: WithTypedName<typeof FormTextField, TValues>;
  FormTextareaField: WithTypedName<typeof FormTextareaField, TValues>;
  FormSelectField: WithTypedName<typeof FormSelectField, TValues>;
  FormCheckboxField: WithTypedName<typeof FormCheckboxField, TValues>;
  FormSwitchField: WithTypedName<typeof FormSwitchField, TValues>;
  FormRadioGroupField: WithTypedName<typeof FormRadioGroupField, TValues>;
  FormSliderField: WithTypedName<typeof FormSliderField, TValues>;
  FormFileUploadField: WithTypedName<typeof FormFileUploadField, TValues>;
};

interface BoundCache {
  form: FormLike<unknown>;
  extraKeys: string[];
  extraValues: React.ComponentType<unknown>[];
  bound: Record<string, React.ComponentType<unknown>>;
}

const LEGACY_FIELDS = {
  FormTextField,
  FormTextareaField,
  FormSelectField,
  FormCheckboxField,
  FormSwitchField,
  FormRadioGroupField,
  FormSliderField,
  FormFileUploadField
};

/**
 * Returns the flat field components bound to `form` — both at runtime (they
 * render this form's Field, not whatever form context happens to be above)
 * and in types (name/validators/listeners/defaultValue are checked against
 * this form's value type, and each widget only accepts paths whose value it
 * can edit).
 *
 * Custom fields join the same typed namespace via a value brand:
 *
 * @example
 * ```tsx
 * const form = useAppForm({ defaultValues: {...} as FormValues, ... });
 * const { FormTextField, FormSelectField } = useFormFields(form);
 *
 * <FormTextField name='email' />   // ✅ string-valued paths only
 * <FormTextField name='urgent' />  // ❌ boolean path — compile error
 *
 * const DatePickerField = fieldFor<Date | null>()(DatePickerBase);
 * const { FormDatePickerField } = useFormFields(form, { FormDatePickerField: DatePickerField });
 * ```
 */
/* oxlint-disable typescript/no-explicit-any --
   Same centralized-cast contract as bindFieldComponent (see form-context.tsx):
   the overload signatures are fully typed; the impl erases to any once. */
function useFormFields<
  TValues,
  TExtra extends Record<string, FieldComponentFor<any, any>> = Record<never, never>
>(
  form: FormLike<TValues>,
  // The intersection rejects extras whose key shadows a shipped widget
  // (the shadowed key's type collapses to never → compile error at the key),
  // which would otherwise silently replace it in the returned record.
  extra?: TExtra & {
    [K in Extract<keyof TExtra, keyof TypedFormFields<Record<string, unknown>>>]: never;
  }
): TypedFormFields<TValues> & BoundExtraFields<TValues, TExtra>;
/**
 * @deprecated Pass the form instance instead: `useFormFields(form)`. This
 * zero-arg overload is an unlinked cast — nothing ties TValues to the form
 * in context, and validators/listeners/defaultValue are untyped. Removed in
 * the next release.
 */
function useFormFields<TValues extends Record<string, unknown>>(): LegacyFormFields<TValues>;
// The impl signature is private (the overloads above govern all call sites);
// its `any` return is the one place the typed surface is erased.
function useFormFields(
  form?: FormLike<unknown>,
  extra?: Record<string, React.ComponentType<any>>
): any {
  /* oxlint-disable react-hooks/rules-of-hooks --
     The deprecated zero-arg overload must stay hook-free for its one-release
     compat window (the old implementation was a pure cast, so legacy call
     sites after early returns / at module scope worked). This early return
     is safe: the overload split is compile-enforced, so a given call site
     either ALWAYS or NEVER passes `form` — hook order per call site is
     stable. Remove together with the overload next release. */
  if (!form) return LEGACY_FIELDS;

  // A ref-based cache instead of useMemo: React compares useMemo deps only
  // up to the shorter length, so a spread of Object.values(extra) in a deps
  // array returns a STALE map when the extras cardinality changes (verified
  // against react-dom 19 source). The ref compares keys AND values exactly,
  // rebuilding when the map really changed — and NOT rebuilding for a fresh
  // inline `extra` literal with the same (module-scope) components, so
  // fields are never remounted per render.
  const cacheRef = React.useRef<BoundCache | null>(null);
  /* oxlint-enable react-hooks/rules-of-hooks */

  const extraKeys = extra ? Object.keys(extra) : [];
  const extraValues = extraKeys.map((k) => (extra as Record<string, React.ComponentType<any>>)[k]);

  const c = cacheRef.current;
  const cacheHit =
    c !== null &&
    c.form === form &&
    c.extraKeys.length === extraKeys.length &&
    c.extraKeys.every((k, i) => k === extraKeys[i]) &&
    c.extraValues.every((v, i) => v === extraValues[i]);

  if (!cacheHit) {
    const bound: Record<string, React.ComponentType<any>> = {
      FormTextField: bindFieldComponent(form, TextField),
      FormTextareaField: bindFieldComponent(form, TextareaField),
      FormSelectField: bindFieldComponent(form, SelectField),
      FormCheckboxField: bindFieldComponent(form, CheckboxField),
      FormSwitchField: bindFieldComponent(form, SwitchField),
      FormRadioGroupField: bindFieldComponent(form, RadioGroupField),
      FormSliderField: bindFieldComponent(form, SliderField),
      FormFileUploadField: bindFieldComponent(form, FileUploadField),
      FormCheckboxGroupField: bindFieldComponent(form, CheckboxGroupField),
      FormArrayTextField: bindFieldComponent(form, ArrayTextField),
      FormDatePickerField: bindFieldComponent(form, DatePickerField),
      FormComboboxField: bindFieldComponent(form, ComboboxField)
    };
    extraKeys.forEach((key, i) => {
      bound[key] = bindFieldComponent(form, extraValues[i]);
    });
    cacheRef.current = { form, extraKeys, extraValues, bound };
  }

  return cacheRef.current!.bound;
}
/* oxlint-enable typescript/no-explicit-any */

// ---------------------------------------------------------------------------
// Exports
// ---------------------------------------------------------------------------

export { useAppForm, withForm, withFieldGroup, useFormFields };

// Typed composition core
// (bindFieldComponent is deliberately NOT re-exported here: it is the raw
// untyped binder — custom fields go through fieldFor + useFormFields(form,
// extras), which add the value-contract typing.)
export {
  fieldFor,
  asArrayField,
  revalidateLogic,
  scrollToFirstError,
  flattenFormErrors,
  useFieldContext,
  useFormContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  FormErrors
} from './form-context';

export type {
  AtomicFieldValues,
  AtomicDeepKeys,
  AtomicDeepKeysOfType,
  StrictDeepKeysOfType,
  FreeTextKeys,
  ClearableKeys,
  TypedFieldValidators,
  TypedFieldConfig,
  BoundFormField,
  BoundFreeTextField,
  BoundClearableField,
  BoundExtraFields,
  FieldComponentFor,
  FormLike
} from './form-context';

// Schema/server helpers
export { schemaFor, applyServerErrors, clearServerErrors } from '@/lib/form-helpers';
export type { ServerErrors, FormValuesOf } from '@/lib/form-helpers';

// Deprecated legacy surface (removed next release)
export { createFormField, typedField } from './form-context';
export type {
  FieldConfig,
  FieldValidatorConfig,
  FieldListenerConfig,
  WithTypedName
} from './form-context';
