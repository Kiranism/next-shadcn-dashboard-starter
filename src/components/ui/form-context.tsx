/**
 * form-context.tsx — Shared primitives for the TanStack Form + shadcn/ui integration.
 *
 * This file provides:
 *  - React contexts created by TanStack Form (fieldContext, formContext)
 *  - Enhanced useFieldContext with accessibility IDs and error state
 *  - Structural layout components (FormFieldSet, FormField, FormFieldError)
 *  - createFormField() — wraps a base field into a flat, self-wiring component
 *  - FieldConfig types — validators, listeners, asyncDebounceMs
 *  - Type-safe name utilities (WithTypedName, typedField)
 *
 * Consumed by:
 *  - fields/*.tsx  (import structural components + createFormField)
 *  - tanstack-form.tsx (import contexts + re-export everything)
 *
 * This file must NOT import from tanstack-form.tsx or fields/*.tsx to avoid
 * circular dependencies.
 */

import { createFormHookContexts, revalidateLogic, useStore } from '@tanstack/react-form';
import type { AnyFieldApi, DeepKeys } from '@tanstack/form-core';
import type { VariantProps } from 'class-variance-authority';
import * as React from 'react';
import {
  Field as DefaultField,
  FieldError as DefaultFieldError,
  FieldSet as DefaultFieldSet,
  fieldVariants
} from '@/components/ui/field';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// 1. Contexts
// ---------------------------------------------------------------------------

const {
  fieldContext,
  formContext,
  useFieldContext: _useFieldContext,
  useFormContext
} = createFormHookContexts();

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>({} as FormItemContextValue);

// ---------------------------------------------------------------------------
// 2. Enhanced useFieldContext
// ---------------------------------------------------------------------------

const useFieldContext = () => {
  const { id } = React.useContext(FormItemContext);
  const fieldCtx = _useFieldContext();

  if (!fieldCtx) {
    throw new Error('useFieldContext should be used within <AppField>');
  }

  const { name, store, ...rest } = fieldCtx;
  const errors = useStore(store, (state) => state.meta.errors);

  return {
    id,
    name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    errors,
    store,
    ...rest
  };
};

// ---------------------------------------------------------------------------
// 3. Structural field components
// ---------------------------------------------------------------------------

function FieldSet({ className, children, ...props }: React.ComponentProps<'fieldset'>) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <DefaultFieldSet className={cn('grid gap-1', className)} {...props}>
        {children}
      </DefaultFieldSet>
    </FormItemContext.Provider>
  );
}

function Field({
  children,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof fieldVariants>) {
  const { errors, formItemId, formDescriptionId, formMessageId, store } = useFieldContext();
  const form = useFormContext();
  const isTouched = useStore(store, (state) => state.meta.isTouched);
  // Show errors after user interaction OR after first submit attempt
  const hasSubmitted = useStore(form.store, (s) => s.submissionAttempts > 0);
  const hasVisibleErrors = !!errors.length && (isTouched || hasSubmitted);

  return (
    <DefaultField
      data-invalid={hasVisibleErrors}
      id={formItemId}
      aria-describedby={
        !hasVisibleErrors ? `${formDescriptionId}` : `${formDescriptionId} ${formMessageId}`
      }
      aria-invalid={hasVisibleErrors}
      {...props}
    >
      {children}
    </DefaultField>
  );
}

function FieldError({ className, ...props }: React.ComponentProps<'p'>) {
  const { errors, formMessageId, store } = useFieldContext();
  const form = useFormContext();
  const isTouched = useStore(store, (state) => state.meta.isTouched);
  const hasSubmitted = useStore(form.store, (s) => s.submissionAttempts > 0);
  if (!errors.length || (!isTouched && !hasSubmitted)) return null;
  return (
    <DefaultFieldError
      data-slot='form-message'
      id={formMessageId}
      className={cn('text-destructive text-sm', className)}
      {...props}
      errors={errors}
    />
  );
}

/**
 * Renders form-level validation errors (cross-field errors).
 * Place inside form.AppForm to show errors from form-level validators.
 *
 * @example
 * ```tsx
 * <form.AppForm>
 *   <form.Form>
 *     <FormErrors />
 *     ...fields...
 *   </form.Form>
 * </form.AppForm>
 * ```
 */
function FormErrors({ className, ...props }: React.ComponentProps<'div'>) {
  const form = useFormContext();
  return (
    <form.Subscribe selector={(state) => state.errors}>
      {(errors) => {
        if (!errors.length) return null;
        return (
          <div
            role='alert'
            className={cn(
              'bg-destructive/10 text-destructive rounded-md border p-3 text-sm',
              className
            )}
            {...props}
          >
            <ul className='list-disc space-y-1 pl-4'>
              {errors.map((error, i) => (
                <li key={i}>{String(error)}</li>
              ))}
            </ul>
          </div>
        );
      }}
    </form.Subscribe>
  );
}

/**
 * Scrolls to the first field with a validation error.
 * Call after a failed form.handleSubmit() to guide the user to the problem.
 *
 * @example
 * ```tsx
 * onSubmit: ({ value }) => { ... },
 * onSubmitInvalid: () => scrollToFirstError(),
 * ```
 */
function scrollToFirstError() {
  // Fields with errors have data-invalid="true" set by the FormField component
  requestAnimationFrame(() => {
    const firstError = document.querySelector('[data-invalid="true"]');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // Focus the first focusable element within the error field
      const focusable = firstError.querySelector<HTMLElement>(
        'input, textarea, select, button, [tabindex]'
      );
      focusable?.focus({ preventScroll: true });
    }
  });
}

// ---------------------------------------------------------------------------
// 4. Field-level configuration types
//
//    These mirror TanStack Form's field options that get forwarded to
//    form.Field when using the flat FormXxxField pattern via createFormField.
//    Validator values accept Zod schemas (StandardSchemaV1) or plain functions.
// ---------------------------------------------------------------------------

/** Field-level validators forwarded to form.Field */
interface FieldValidatorConfig {
  /** Sync validator — runs on every value change. Accepts a function or Zod schema. */
  onChange?: unknown;
  /** Async validator — runs on value change (debounced). */
  onChangeAsync?: unknown;
  /** Debounce (ms) for onChangeAsync. */
  onChangeAsyncDebounceMs?: number;
  /** Re-run onChange/onChangeAsync when these other fields change (linked validation). */
  onChangeListenTo?: string[];
  /** Sync validator — runs when the field loses focus. Accepts a function or Zod schema. */
  onBlur?: unknown;
  /** Async validator — runs on blur. */
  onBlurAsync?: unknown;
  /** Debounce (ms) for onBlurAsync. */
  onBlurAsyncDebounceMs?: number;
  /** Re-run onBlur/onBlurAsync when these other fields blur. */
  onBlurListenTo?: string[];
  /** Sync validator — runs on form submission. */
  onSubmit?: unknown;
  /** Async validator — runs on form submission. */
  onSubmitAsync?: unknown;
  /** Sync validator — runs on field mount. */
  onMount?: unknown;
}

/** Field-level side-effect listeners forwarded to form.Field */
interface FieldListenerConfig {
  /** Fires after the field value changes. Use for side effects (e.g., resetting dependent fields). */
  onChange?: (props: { value: unknown; fieldApi: AnyFieldApi }) => void;
  /** Debounce (ms) for the onChange listener. */
  onChangeDebounceMs?: number;
  /** Fires when the field loses focus. */
  onBlur?: (props: { value: unknown; fieldApi: AnyFieldApi }) => void;
  /** Debounce (ms) for the onBlur listener. */
  onBlurDebounceMs?: number;
  /** Fires when the field mounts. */
  onMount?: (props: { value: unknown; fieldApi: AnyFieldApi }) => void;
  /** Fires on form submission. */
  onSubmit?: (props: { value: unknown; fieldApi: AnyFieldApi }) => void;
}

/**
 * Configuration forwarded to TanStack Form's form.Field component.
 * Use with createFormField composed components (FormTextField, etc.)
 * to enable field-level validation, async validation, and side-effect listeners.
 *
 * For type-safe field names, use form.AppField render-prop pattern instead.
 */
interface FieldConfig {
  /** Field-level validators (onBlur, onChange, onSubmit + async variants). */
  validators?: FieldValidatorConfig;
  /** Default debounce (ms) for all async validators on this field. */
  asyncDebounceMs?: number;
  /** Side-effect listeners (onChange, onBlur, onMount, onSubmit). */
  listeners?: FieldListenerConfig;
  /** Set to 'array' for array fields (enables pushValue, removeValue, etc.). */
  mode?: 'value' | 'array';
  /** Default value for this field (useful for dynamically added fields). */
  defaultValue?: unknown;
}

// ---------------------------------------------------------------------------
// 5. createFormField — lifts a field component into a flat form-level component
//
//    Forwards TanStack Form's field-level config (validators, listeners)
//    to form.Field while keeping the ergonomic flat API.
//
//    For type-safe field names, use form.AppField render-prop pattern.
//    The flat FormXxxField pattern trades name type-safety for ergonomics.
// ---------------------------------------------------------------------------

type FormFieldSlot = React.ComponentType<{
  name: string;
  validators?: FieldValidatorConfig;
  asyncDebounceMs?: number;
  listeners?: FieldListenerConfig;
  mode?: 'value' | 'array';
  defaultValue?: unknown;
  children: (fieldApi: AnyFieldApi) => React.ReactNode;
}>;

function createFormField<P extends object>(FieldComponent: React.ComponentType<P>) {
  function ComposedFormField({
    name,
    validators,
    asyncDebounceMs,
    listeners,
    mode,
    defaultValue,
    ...props
  }: { name: string } & FieldConfig &
    Omit<P, 'name' | 'validators' | 'asyncDebounceMs' | 'listeners' | 'mode' | 'defaultValue'>) {
    const form = useFormContext();
    const FieldSlot = form.Field as unknown as FormFieldSlot;
    return (
      <FieldSlot
        name={name}
        validators={validators}
        asyncDebounceMs={asyncDebounceMs}
        listeners={listeners}
        mode={mode}
        defaultValue={defaultValue}
      >
        {(fieldApi) => (
          <fieldContext.Provider value={fieldApi}>
            <FieldComponent {...(props as unknown as P)} />
          </fieldContext.Provider>
        )}
      </FieldSlot>
    );
  }
  ComposedFormField.displayName = `FormField(${FieldComponent.displayName || FieldComponent.name})`;
  return ComposedFormField;
}

// ---------------------------------------------------------------------------
// 6. Type-safe field name utilities
//
//    Standalone FormXxxField components have `name: string` by default because
//    they don't know which form they'll be used in at definition time.
//
//    These utilities narrow `name` to the form's actual field paths using
//    TanStack Form's DeepKeys<TValues>, giving full autocomplete + type errors.
// ---------------------------------------------------------------------------

/**
 * Narrows a composed field component's `name` prop to `DeepKeys<TValues>`.
 * Used internally by useFormFields and typedField.
 */
type WithTypedName<C, TValues> =
  C extends React.ComponentType<infer P>
    ? P extends { name: string }
      ? React.ComponentType<Omit<P, 'name'> & { name: DeepKeys<TValues> & string }>
      : C
    : C;

/**
 * Narrows any single composed field component's `name` prop to type-safe field paths.
 * Use for custom fields not included in useFormFields.
 *
 * @example
 * ```tsx
 * const narrow = typedField<MyFormValues>();
 * const TypedDatePicker = narrow(FormDatePickerField);
 * <TypedDatePicker name="birthDate" />  // ✅ type-safe
 * ```
 */
function typedField<TValues extends Record<string, unknown>>() {
  return function <C extends React.ComponentType<{ name: string }>>(
    Component: C
  ): WithTypedName<C, TValues> {
    return Component as WithTypedName<C, TValues>;
  };
}

// ---------------------------------------------------------------------------
// 7. Exports
// ---------------------------------------------------------------------------

export type { FieldConfig, FieldValidatorConfig, FieldListenerConfig, WithTypedName };

export {
  fieldContext,
  formContext,
  useFieldContext,
  useFormContext,
  createFormField,
  typedField,
  revalidateLogic,
  scrollToFirstError,
  FieldSet as FormFieldSet,
  Field as FormField,
  FieldError as FormFieldError,
  FormErrors
};
