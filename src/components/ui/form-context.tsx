/**
 * form-context.tsx — Shared primitives for the TanStack Form + shadcn/ui integration.
 *
 * This file provides:
 *  - React contexts created by TanStack Form (fieldContext, formContext)
 *  - Enhanced useFieldContext with accessibility IDs and error state
 *  - Structural layout components (FormFieldSet, FormField, FormFieldError)
 *  - The typed composition core: AtomicFieldValues, StrictDeepKeysOfType,
 *    TypedFieldValidators/TypedFieldConfig, BoundFormField, fieldFor,
 *    FormLike, bindFieldComponent — see docs/forms.md
 *  - Deprecated legacy layer (createFormField, FieldConfig types, typedField)
 *
 * Consumed by:
 *  - fields/*.tsx  (import structural components)
 *  - tanstack-form.tsx (import contexts + core, re-export everything)
 *
 * This file must NOT import from tanstack-form.tsx or fields/*.tsx to avoid
 * circular dependencies.
 */

import { createFormHookContexts, revalidateLogic, useStore } from '@tanstack/react-form';
import type {
  AnyFieldApi,
  AnyFormApi,
  DeepKeys,
  DeepKeysOfType,
  DeepValue,
  FieldValidateOrFn,
  FieldAsyncValidateOrFn,
  FieldListeners
} from '@tanstack/form-core';
import * as React from 'react';
import { Field as DefaultField, FieldError } from '@/components/ui/field';
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
  const form = useFormContext();
  const errors = useStore(store, (state) => state.meta.errors);
  const isTouched = useStore(store, (state) => state.meta.isTouched);
  const isValid = useStore(store, (state) => state.meta.isValid);
  const hasSubmitted = useStore(form.store, (s) => s.submissionAttempts > 0);

  // The ONE invalid source for wrappers, controls and error display alike:
  // errors surface after user interaction OR a submit attempt — never on a
  // pristine form.
  const isInvalid = !isValid && (isTouched || hasSubmitted);

  // IDs namespace the field name under the FieldSet's React.useId, so two
  // forms with the same field name on one page never collide, while every
  // child of the same FieldSet resolves identical values from context.
  // Outside a FieldSet (no provider) they fall back to the bare name.
  const base = id ? `${id}-${name}` : name;

  return {
    id,
    name,
    controlId: base,
    formItemId: `${base}-form-item`,
    formDescriptionId: `${base}-form-item-description`,
    formMessageId: `${base}-form-item-message`,
    errors,
    isInvalid,
    store,
    ...rest
  };
};

// ---------------------------------------------------------------------------
// 3. Structural field components
// ---------------------------------------------------------------------------

function FieldSet({ className, children, ...props }: React.ComponentProps<'div'>) {
  // NEVER mint an id here: the scope is established ABOVE the field
  // component body (bindFieldComponent, withItemScope, createFormField), so
  // body-computed ids and child-computed ids always agree. Without a
  // provider both sides fall back to the bare field name — consistent, so
  // aria-describedby still resolves (at the cost of possible cross-form id
  // collisions, the pre-existing behavior for fully hand-rolled usage).
  //
  // Renders a DIV, not a <fieldset>: per the canonical Field anatomy,
  // <fieldset>/<legend> are reserved for semantic GROUPS (radio groups,
  // checkbox groups, array fields — those widgets render a real FieldSet
  // from ui/field themselves). A legendless per-field fieldset added no
  // semantics and carried min-content/nesting landmines.
  const inherited = React.useContext(FormItemContext);

  return (
    <FormItemContext.Provider value={inherited}>
      <div data-slot='form-field-set' className={cn('grid gap-1', className)} {...props}>
        {children}
      </div>
    </FormItemContext.Provider>
  );
}

function Field({ children, ...props }: React.ComponentProps<typeof DefaultField>) {
  const { formItemId, isInvalid } = useFieldContext();

  // aria-invalid/aria-describedby live on the CONTROL (canonical shadcn
  // anatomy), not this role='group' wrapper; data-invalid stays for styling
  // hooks and scrollToFirstError.
  return (
    <DefaultField data-invalid={isInvalid} id={formItemId} {...props}>
      {children}
    </DefaultField>
  );
}

function FormFieldError({ className, ...props }: React.ComponentProps<'p'>) {
  const { errors, formMessageId, isInvalid } = useFieldContext();
  if (!isInvalid || !errors.length) return null;
  // Function validators return plain strings; FieldError only renders
  // { message } objects, so normalize to keep both error shapes visible.
  const normalizedErrors = errors.map((error) =>
    typeof error === 'string' ? { message: error } : error
  );
  return (
    <FieldError
      data-slot='form-message'
      id={formMessageId}
      className={cn('text-destructive text-sm', className)}
      {...props}
      errors={normalizedErrors}
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
/**
 * Flattens form-level `state.errors` entries into displayable strings.
 *
 * Function validators contribute plain strings — kept as-is. Standard-schema
 * (Zod) form validators contribute PATH-KEYED objects like
 * `{ name: [issue...], '': [pathless issues] }` (shape verified against
 * form-core 1.32): field-pathed issues are already rendered at their fields
 * by FormFieldError, so only the pathless (`''`) issues — refine/superRefine
 * with no path, the primary cross-field use case — belong to the form-level
 * display. Anything unrecognized degrades to a JSON string, never
 * '[object Object]'.
 */
function flattenFormErrors(errors: unknown[]): string[] {
  const messages: string[] = [];
  for (const error of errors) {
    if (error == null) continue;
    if (typeof error === 'string') {
      messages.push(error);
      continue;
    }
    if (typeof error === 'object') {
      const record = error as Record<string, unknown>;
      if (typeof record.message === 'string') {
        messages.push(record.message);
        continue;
      }
      const pathless = record[''];
      if (Array.isArray(pathless)) {
        for (const issue of pathless) {
          const msg = (issue as { message?: unknown })?.message;
          if (typeof msg === 'string') messages.push(msg);
        }
        continue;
      }
      // Path-keyed map with only field-mapped issues — all rendered at their
      // fields; nothing to show at form level.
      if (Object.values(record).every((v) => Array.isArray(v))) continue;
      messages.push(JSON.stringify(error));
      continue;
    }
    messages.push(String(error));
  }
  return messages;
}

function FormErrors({ className, ...props }: React.ComponentProps<'div'>) {
  const form = useFormContext();
  // Gate on a submit attempt: form-level onChange/onMount validators must not
  // paint a pristine form red.
  const hasSubmitted = useStore(form.store, (s) => s.submissionAttempts > 0);
  return (
    <form.Subscribe selector={(state) => state.errors}>
      {(errors) => {
        if (!hasSubmitted) return null;
        const messages = flattenFormErrors(errors);
        if (!messages.length) return null;
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
              {messages.map((message, i) => (
                <li key={i}>{message}</li>
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
// 4. Typed composition core
//
//    The instance-bound flat-field system: useFormFields(form) returns
//    components whose `name` is constrained to paths the widget can edit and
//    whose validators/listeners/defaultValue are typed per path. See
//    docs/forms.md. All type machinery is compiler-verified by the probe
//    suite in src/components/forms/fields/__typetests__/.
// ---------------------------------------------------------------------------

/**
 * Registry of types treated as ATOMIC form values: a path to one of these
 * binds as a whole value ('attachments' works), but paths that tunnel into
 * its own properties ('attachments[0].name') are not offered as fields.
 * Extensible via declaration merging:
 *
 * @example
 * ```ts
 * declare module '@/components/ui/form-context' {
 *   interface AtomicFieldValues { money: Money }
 * }
 * ```
 */
export interface AtomicFieldValues {
  file: File;
  blob: Blob;
  fileList: FileList;
  /** Already atomic upstream (form-core special-cases Date); kept so the
   *  guarantee survives if upstream changes. */
  date: Date;
}

type AtomicValue = AtomicFieldValues[keyof AtomicFieldValues];

/** Paths whose value is an atomic leaf — the roots of excluded subtrees. */
type AtomicRoots<TValues> = DeepKeysOfType<TValues, AtomicValue | null | undefined>;

/** Every path that tunnels INTO an atomic leaf ('avatar.name', 'files[0].size', …). */
type AtomicSubPaths<TValues> =
  | `${AtomicRoots<TValues>}.${string}`
  | `${AtomicRoots<TValues>}[${string}`;

/** DeepKeys<TValues> minus paths that tunnel into atomic leaves. */
export type AtomicDeepKeys<TValues> = Exclude<DeepKeys<TValues>, AtomicSubPaths<TValues>>;

/** DeepKeysOfType<TValues, TAllowed> minus paths that tunnel into atomic leaves. */
export type AtomicDeepKeysOfType<TValues, TAllowed> = Exclude<
  DeepKeysOfType<TValues, TAllowed>,
  AtomicSubPaths<TValues>
>;

/**
 * Strict union-aware widget path filter.
 *
 * TanStack's DeepKeysOfType<A | B, V> accepts a path when ANY union branch's
 * value matches V. This variant re-checks each candidate against the MERGED
 * value across branches (DeepValue<A | B, K> unions colliding keys) — a path
 * that is number in one branch and string in another is offered only to
 * widgets whose contract covers both, never to single-type widgets.
 * Branch-specific keys keep their one branch's value, so discriminated-union
 * forms are unaffected; non-union TValues is unaffected (per-branch and
 * merged values coincide). Atomic-leaf sub-paths are excluded (see
 * AtomicFieldValues).
 */
export type StrictDeepKeysOfType<TData, TValue> =
  AtomicDeepKeysOfType<TData, TValue> extends infer TKey
    ? TKey extends AtomicDeepKeysOfType<TData, TValue>
      ? [DeepValue<TData, TKey>] extends [TValue]
        ? TKey
        : never
      : never
    : never;

/** Field-level validators, typed per (form values, field path). */
export interface TypedFieldValidators<TValues, TName extends DeepKeys<TValues>> {
  /** Sync validator — runs on field mount. Function or Zod schema. */
  onMount?: FieldValidateOrFn<TValues, TName>;
  /** Sync validator — runs on every value change. Function or Zod schema. */
  onChange?: FieldValidateOrFn<TValues, TName>;
  /** Async validator — runs on value change (debounced). */
  onChangeAsync?: FieldAsyncValidateOrFn<TValues, TName>;
  /** Debounce (ms) for onChangeAsync. */
  onChangeAsyncDebounceMs?: number;
  /** Re-run onChange/onChangeAsync when these other fields change. Path-checked. */
  onChangeListenTo?: AtomicDeepKeys<TValues>[];
  /** Sync validator — runs when the field loses focus. */
  onBlur?: FieldValidateOrFn<TValues, TName>;
  /** Async validator — runs on blur. */
  onBlurAsync?: FieldAsyncValidateOrFn<TValues, TName>;
  /** Debounce (ms) for onBlurAsync. */
  onBlurAsyncDebounceMs?: number;
  /** Re-run onBlur/onBlurAsync when these other fields blur. Path-checked. */
  onBlurListenTo?: AtomicDeepKeys<TValues>[];
  /** Sync validator — runs on form submission. */
  onSubmit?: FieldValidateOrFn<TValues, TName>;
  /** Async validator — runs on form submission. */
  onSubmitAsync?: FieldAsyncValidateOrFn<TValues, TName>;
  /** Dynamic validator — pairs with revalidateLogic() (multi-step forms). */
  onDynamic?: FieldValidateOrFn<TValues, TName>;
  /** Async dynamic validator. */
  onDynamicAsync?: FieldAsyncValidateOrFn<TValues, TName>;
  /** Debounce (ms) for onDynamicAsync. */
  onDynamicAsyncDebounceMs?: number;
}

/** Everything a bound flat field forwards to form.Field, fully typed. */
export interface TypedFieldConfig<TValues, TName extends DeepKeys<TValues>> {
  name: TName;
  validators?: TypedFieldValidators<TValues, TName>;
  /** TanStack's own type: `value` and `fieldApi.form.setFieldValue` are path-checked. */
  listeners?: FieldListeners<TValues, TName>;
  /** Default debounce (ms) for all async validators on this field. */
  asyncDebounceMs?: number;
  /** Default value for this field — typed as the path's value. */
  defaultValue?: NoInfer<DeepValue<TValues, TName>>;
}

/**
 * A flat field component bound to one form. TAllowed filters which paths the
 * widget may bind to (a switch only binds to boolean paths); TName is
 * inferred per JSX site from the `name` literal, which pins the types of
 * validators, listeners and defaultValue.
 */
export interface BoundFormField<TValues, TAllowed, TProps extends object> {
  <const TName extends StrictDeepKeysOfType<TValues, TAllowed>>(
    props: Omit<TProps, keyof TypedFieldConfig<TValues, TName>> & TypedFieldConfig<TValues, TName>
  ): React.ReactNode;
  displayName?: string;
}

declare const FIELD_VALUE: unique symbol;

/** A base field component branded with the value type it edits. */
export type FieldComponentFor<V, P extends object> = React.ComponentType<P> & {
  readonly [FIELD_VALUE]: V;
};

/**
 * Brand a base field component with the value type it edits, so it can join
 * useFormFields(form, { ... }) with correct path filtering. Brand AFTER any
 * wrapping HOC: fieldFor<V>()(React.memo(Base)).
 *
 * @example
 * ```tsx
 * const DatePickerField = fieldFor<Date | null | undefined>()(DatePickerBase);
 * const { FormDatePickerField } = useFormFields(form, { FormDatePickerField: DatePickerField });
 * <FormDatePickerField name='dueDate' label='Due Date' />  // Date-valued paths only
 * ```
 */
export function fieldFor<V>() {
  return <P extends object>(component: React.ComponentType<P>) =>
    component as FieldComponentFor<V, P>;
}

/** Maps a registry of branded base fields to bound, typed flat components. */
export type BoundExtraFields<TValues, TExtra> = {
  [K in keyof TExtra]: TExtra[K] extends FieldComponentFor<infer V, infer P extends object>
    ? BoundFormField<TValues, V, P>
    : never;
};

/* oxlint-disable typescript/no-explicit-any --
   Centralized runtime cast: React 19's ComponentType contravariance rejects
   every narrower type for these slots (compiler-verified in the design
   spike). The public surface (BoundFormField / TypedFieldConfig) is fully
   typed; the __typetests__ suite and scripts/smoke-form-binding.tsx guard
   this internal contract. */

/**
 * Structural view of a TanStack form instance — TValues is inferred from
 * state.values. Deliberately does NOT name ReactFormExtendedApi's generics.
 */
export interface FormLike<TValues> {
  /** The form's own render-prop Field component — the real runtime binding.
   *  (React 19 components may return Promise<ReactNode>, hence the union.) */
  Field: (props: any) => React.ReactNode | Promise<React.ReactNode>;
  state: { values: TValues };
}

/** Untyped internal view of form.Field — the single centralized cast. */
interface FieldSlotProps {
  name: string;
  validators?: unknown;
  listeners?: unknown;
  asyncDebounceMs?: number;
  mode?: 'value' | 'array';
  defaultValue?: unknown;
  children: (fieldApi: AnyFieldApi) => React.ReactNode;
}

/**
 * Typed view of the array-mode field API for authors of custom array field
 * components. The generic context can't express the array methods (they
 * exist only under mode='array', i.e. asArrayField), so this is the single
 * sanctioned cast — custom fields no longer hand-roll their own.
 *
 * @example
 * ```tsx
 * const field = useFieldContext();
 * const array = useArrayFieldApi<string>(field);
 * array.pushValue('');
 * ```
 */
export interface ArrayFieldApi<TItem> {
  pushValue: (value: TItem) => void;
  removeValue: (index: number) => void;
  insertValue: (index: number, value: TItem) => void;
  replaceValue: (index: number, value: TItem) => void;
  swapValues: (indexA: number, indexB: number) => void;
  moveValue: (from: number, to: number) => void;
}

export function useArrayFieldApi<TItem>(field: ReturnType<typeof useFieldContext>) {
  return field as unknown as ArrayFieldApi<TItem>;
}

/**
 * Wraps a base field component so a per-instance accessibility-id scope
 * exists ABOVE its body — the body's useFieldContext and the children of the
 * FormFieldSet it renders then resolve identical, collision-free ids. Used
 * for the fieldComponents registry (Pattern 2 render props) and the legacy
 * createFormField path; bindFieldComponent establishes the same scope
 * itself.
 */
export function withItemScope<P extends object>(
  Base: React.ComponentType<P>
): React.ComponentType<P> {
  // HOC factory: ItemScoped closes over Base; hoisting it would break that.
  // oxlint-disable-next-line unicorn/consistent-function-scoping
  function ItemScoped(props: P) {
    const id = React.useId();
    return (
      <FormItemContext.Provider value={{ id }}>
        <Base {...props} />
      </FormItemContext.Provider>
    );
  }
  ItemScoped.displayName = `ItemScope(${Base.displayName || Base.name || 'Field'})`;
  // Preserve the array-mode marker across wrapping.
  (ItemScoped as { fieldMode?: 'array' }).fieldMode = (Base as { fieldMode?: 'array' }).fieldMode;
  return ItemScoped;
}

/**
 * Marks a base field component as editing an ARRAY value: the binder mounts
 * its form.Field with mode='array' so the field API gains pushValue/
 * removeValue/etc. Declared by the COMPONENT (not passed by callers), so the
 * typed prop surface and the runtime cannot disagree.
 *
 * @example
 * ```tsx
 * export const CheckboxGroupField = asArrayField(CheckboxGroupBase);
 * ```
 */
export function asArrayField<C extends React.ComponentType<any>>(component: C): C {
  (component as C & { fieldMode?: 'array' }).fieldMode = 'array';
  return component;
}

/**
 * Binds a base field component to a specific form instance: the bound
 * component renders THAT form's Field (not whatever form context happens to
 * be above it) and re-provides form/field context for useFieldContext.
 *
 * Internal — prefer fieldFor<V>() + useFormFields(form, extras), which add
 * the value-contract typing this raw binder does not have. Only the keys of
 * TypedFieldConfig are diverted to form.Field; every other prop (including a
 * base component's own `mode`, if it has one) reaches the base component.
 * Array-mode field slots are a Phase 3 binder extension — do NOT resurrect a
 * `mode` divert here without re-adding it to TypedFieldConfig.
 */
export function bindFieldComponent(
  form: FormLike<unknown>,
  Base: React.ComponentType<any>
): React.ComponentType<any> {
  function Bound({ name, validators, listeners, asyncDebounceMs, defaultValue, ...rest }: any) {
    const FieldSlot = form.Field as unknown as React.ComponentType<FieldSlotProps>;
    // Establish the accessibility-id scope ABOVE the base component, so its
    // body and the FormFieldSet children it renders resolve identical,
    // per-instance-unique ids (two forms — or two usages — with the same
    // field name never collide).
    const boundId = React.useId();
    return (
      <FieldSlot
        name={name}
        validators={validators}
        listeners={listeners}
        asyncDebounceMs={asyncDebounceMs}
        mode={(Base as { fieldMode?: 'array' }).fieldMode}
        defaultValue={defaultValue}
      >
        {(fieldApi) => (
          <FormItemContext.Provider value={{ id: boundId }}>
            <formContext.Provider value={form as unknown as AnyFormApi}>
              <fieldContext.Provider value={fieldApi}>
                <Base {...rest} />
              </fieldContext.Provider>
            </formContext.Provider>
          </FormItemContext.Provider>
        )}
      </FieldSlot>
    );
  }
  Bound.displayName = `Bound(${Base.displayName || Base.name || 'Field'})`;
  return Bound;
}
/* oxlint-enable typescript/no-explicit-any */

// ---------------------------------------------------------------------------
// 5. Legacy field-level configuration types (deprecated)
//
//    These mirror TanStack Form's field options that get forwarded to
//    form.Field when using the flat FormXxxField pattern via createFormField.
//    Validator values accept Zod schemas (StandardSchemaV1) or plain functions.
// ---------------------------------------------------------------------------

/**
 * Field-level validators forwarded to form.Field.
 * @deprecated Use useFormFields(form) — validators are then typed per path
 * (TypedFieldValidators). Removed in the next release.
 */
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

/**
 * Field-level side-effect listeners forwarded to form.Field.
 * @deprecated Use useFormFields(form) — listeners are then TanStack's own
 * FieldListeners with typed value and path-checked setFieldValue. Removed in
 * the next release.
 */
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
 * @deprecated Use useFormFields(form) — the bound components take
 * TypedFieldConfig, which checks all of this per path. Removed in the next
 * release.
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
// 6. createFormField — legacy module-level flat components (deprecated)
//
//    Forwards TanStack Form's field-level config (validators, listeners)
//    to form.Field while keeping the ergonomic flat API.
//
//    Deprecated: components created this way bind to whatever form context
//    is above them and their config slots are untyped. useFormFields(form)
//    provides the same ergonomics with real typing and instance binding.
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

/**
 * @deprecated Use useFormFields(form) for shipped widgets, or brand a base
 * component with fieldFor<V>() and pass it via useFormFields(form, extras).
 * Removed in the next release.
 */
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
    const scopeId = React.useId();
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
          <FormItemContext.Provider value={{ id: scopeId }}>
            <fieldContext.Provider value={fieldApi}>
              <FieldComponent {...(props as unknown as P)} />
            </fieldContext.Provider>
          </FormItemContext.Provider>
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
 * Used internally by the deprecated zero-arg useFormFields overload.
 * @deprecated Superseded by BoundFormField via useFormFields(form). Removed
 * in the next release.
 */
type WithTypedName<C, TValues> =
  C extends React.ComponentType<infer P>
    ? P extends { name: string }
      ? React.ComponentType<Omit<P, 'name'> & { name: DeepKeys<TValues> & string }>
      : C
    : C;

/**
 * Narrows any single composed field component's `name` prop to type-safe field paths.
 *
 * @deprecated This utility's constraint rejects every real field component
 * (components with required props like `label` fail contravariance) — it has
 * never compiled against the shipped fields. Brand your base component with
 * fieldFor<V>() and pass it via useFormFields(form, extras) instead. Removed
 * in the next release.
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

// Typed-composition core types/functions are exported inline at their
// declarations above (AtomicFieldValues, AtomicDeepKeys[OfType],
// StrictDeepKeysOfType, TypedFieldValidators, TypedFieldConfig,
// BoundFormField, FieldComponentFor, fieldFor, BoundExtraFields, FormLike,
// bindFieldComponent).

export type {
  // Deprecated legacy types (removed next release)
  FieldConfig,
  FieldValidatorConfig,
  FieldListenerConfig,
  WithTypedName
};

export {
  fieldContext,
  formContext,
  useFieldContext,
  useFormContext,
  createFormField,
  typedField,
  revalidateLogic,
  scrollToFirstError,
  flattenFormErrors,
  FieldSet as FormFieldSet,
  Field as FormField,
  FormFieldError,
  FormErrors
};
