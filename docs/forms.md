# Form System

Type-safe, composable form handling built on [TanStack Form](https://tanstack.com/form) + shadcn/ui. Supports simple CRUD forms, multi-step wizards, sheet/dialog forms, dynamic arrays, nested objects, async validation, linked fields, cross-field validation, and server-error mapping — with **instance-bound typing**: field names, validators, listeners and default values are all checked against your form's value type, and every widget only accepts paths whose value it can edit.

```tsx
const form = useAppForm({ defaultValues, validators: { onSubmit: schema }, onSubmit });
const { FormTextField, FormSwitchField } = useFormFields(form); // types inferred from `form`

<FormTextField name='title' label='Bug Title' placeholder='Concise summary'
  validators={{ onBlur: z.string().min(5, 'At least 5 characters') }} />
// name='urgent' (a boolean path) would be a COMPILE error on a text field
```

---

## Table of Contents

- [Architecture](#architecture)
- [File Structure (per feature)](#file-structure-per-feature)
- [Quick Start](#quick-start)
- [Usage Patterns](#usage-patterns)
- [Available Field Components](#available-field-components)
- [Type Safety](#type-safety)
- [Validation](#validation)
- [Listeners (Side Effects)](#listeners-side-effects)
- [Custom Fields](#custom-fields)
- [Form Recipes](#form-recipes)
- [Server Errors](#server-errors)
- [Production Utilities](#production-utilities)
- [Guard Rails (type tests + smoke)](#guard-rails)
- [Exports Reference](#exports-reference)
- [Deprecated APIs](#deprecated-apis)
- [Dashboard Examples](#dashboard-examples)

---

## Architecture

| File                                     | What it provides                                                                                                                                                                        |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/form-context.tsx`     | Shared primitives — contexts, `useFieldContext` (ids + `isInvalid`), structural components (`FormFieldSet`, `FormField`, `FormFieldError`, `FormErrors`), the typed composition core (`StrictDeepKeysOfType`, `TypedFieldConfig`, `BoundFormField`, `fieldFor`, `asArrayField`, `useArrayFieldApi`, `bindFieldComponent`, `withItemScope`), `scrollToFirstError`, `flattenFormErrors` |
| `src/components/ui/tanstack-form.tsx`    | Main entry point — `useAppForm`, `useFormFields(form, extras?)`, `Form`, `SubmitButton`, `StepButton`, `withForm`, `withFieldGroup`, re-exports of everything public                       |
| `src/components/forms/fields/*.tsx`      | 12 field components, each exporting a base component (`TextField`), its path value contract (`TextFieldValue`), and a deprecated legacy composed variant                                  |
| `src/lib/form-helpers.ts`                | `schemaFor` (derive field validators from the schema), `applyServerErrors` / `clearServerErrors`                                                                                          |
| `src/hooks/use-stepper.tsx`              | `useFormStepper(schemas, { fullSchema? })` — multi-step navigation with an async-aware validation gate                                                                                    |

**Dependency rule:** `fields/*.tsx` imports from `form-context.tsx`; `tanstack-form.tsx` imports from both. Nothing imports back into `form-context.tsx` — no cycles.

---

## File Structure (per feature)

Split every form feature into **schema**, **constants**, and **component**:

```
src/features/products/
├── schemas/product.ts          ← Zod schema + inferred FormValues type
├── constants/product-options.ts ← Select options, enums, static data
└── components/product-form.tsx  ← Form UI (imports schema + options)
```

The schema is reusable in API routes, server actions, tables and tests with zero duplication. Always prefer `z.infer<typeof schema>` as the form values type.

**Default values:** `satisfies` enforces completeness (`{} satisfies FormValues` is a compile error; `{} as FormValues` is not) — but under `satisfies`, TypeScript keeps each property's *narrow* inferred type, so widen non-string defaults per field or the inferred `TValues` won't match your widgets:

```ts
defaultValues: {
  name: '',                        // strings are fine as-is
  active: false as boolean,        // widen: bare `false` infers the literal type
  launchDate: null as Date | null, // widen: bare `null` collapses the path entirely
  price: undefined as number | undefined,
  tags: [] as string[]             // widen: bare [] infers never[]
} satisfies ProductFormValues
```

Rule of thumb: `satisfies` + per-field widening for object shapes; keep the `as FormValues` cast for discriminated-union defaults (and know it silently permits missing fields).

---

## Quick Start

```tsx
'use client';

import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import * as z from 'zod';

const schema = z.object({
  name: z.string().min(2, 'Name is required'),
  email: z.string().email('Invalid email')
});

type FormValues = z.infer<typeof schema>;

export default function MyForm() {
  const form = useAppForm({
    defaultValues: { name: '', email: '' } satisfies FormValues,
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => console.log(value)
  });

  const { FormTextField } = useFormFields(form);

  return (
    <form.AppForm>
      <form.Form>
        <FormTextField name='name' label='Name' required
          validators={{ onBlur: z.string().min(2, 'Name is required') }} />
        <FormTextField name='email' label='Email' required type='email'
          validators={{ onBlur: z.string().email('Invalid email') }} />
        <form.SubmitButton>Save</form.SubmitButton>
      </form.Form>
    </form.AppForm>
  );
}
```

> **Submit buttons must be explicit.** The `Button` component (Base UI) renders `type="button"` when `type` is omitted — a bare `<Button>Save</Button>` inside a form will NOT submit it. Use `form.SubmitButton` (children, not a `label` prop) or pass `type='submit'`.

---

## Usage Patterns

### Pattern 1: `useFormFields(form)` — instance-bound flat fields (recommended)

Pass the form instance — **all types are inferred from it**. The returned components are bound to that form at runtime too (they render *its* fields, even under another form's provider). Use for most forms.

```tsx
const form = useAppForm({ ... });
const { FormTextField, FormSelectField } = useFormFields(form);

<FormTextField name='email' label='Email' />   // ✅ string-valued paths only
<FormTextField name='urgent' label='Urgent' /> // ❌ boolean path — compile error
<FormTextField name='emial' label='Email' />   // ❌ typo — compile error with suggestion
```

**Props available on every bound `FormXxxField`:**

| Prop              | Type                                  | Notes                                                                    |
| ----------------- | ------------------------------------- | ------------------------------------------------------------------------ |
| `name`            | paths whose value the widget can edit | e.g. a switch only offers `boolean` paths                                |
| `validators`      | `TypedFieldValidators`                | Zod schemas and functions checked against the path's value type          |
| `listeners`       | TanStack `FieldListeners`             | `value` typed; cross-field `fieldApi.form.setFieldValue` is path-checked |
| `asyncDebounceMs` | `number`                              | Default debounce for async validators                                    |
| `defaultValue`    | the path's value type                 | For dynamically added fields                                             |
| …component props  | per widget                            | `label`, `required`, `disabled`, `readOnly`, `orientation`, …            |

### Pattern 2: `form.AppField` render prop — full control

Native TanStack typing, full field API. Use for one-off custom UI and object-row arrays.

```tsx
<form.AppField name='framework' validators={{ onBlur: z.string().min(1, 'Required') }}>
  {(field) => (
    <field.FieldSet>
      <field.Field>
        <field.FieldLabel htmlFor='framework'>Framework *</field.FieldLabel>
        <MyWidget id='framework' value={field.state.value}
          onChange={field.handleChange} onBlur={field.handleBlur} />
        <field.FieldError />
      </field.Field>
    </field.FieldSet>
  )}
</form.AppField>
```

Pre-built base widgets are available inside the render prop (`field.TextField`, `field.SelectField`, …) alongside structural pieces (`field.FieldSet`, `field.Field`, `field.FieldLabel`, `field.FieldError`, `field.FieldContent`, `field.FieldDescription`). Bound Pattern-1 components can be used *inside* Pattern-2 render props freely (e.g. composed fields inside array rows).

**When to use which:** Pattern 1 for everything the 12 widgets cover (including checkbox groups, string-list arrays, dates, comboboxes). Pattern 2 for object-row arrays and truly custom one-off UI.

---

## Available Field Components

Every widget exports a base component (for Pattern 2) and appears in `useFormFields(form)` as `FormXxxField` (Pattern 1). Each widget binds only to paths of its **value contract** (exported next to each component, e.g. `TextFieldValue`).

| Widget               | Binds to paths of type       | Highlights                                                                                                     |
| -------------------- | ---------------------------- | --------------------------------------------------------------------------------------------------------------- |
| `TextField`          | `string \| number \| null?`  | `type` text/email/password/tel/url/number, async-validation spinner, `orientation`, `labelSrOnly`, native props (`placeholder`, `autoComplete`, `readOnly`, …) |
| `TextareaField`      | `string \| null?`            | `maxLength` + character counter, `orientation`, `labelSrOnly`                                                    |
| `SelectField`        | `string \| null?`            | `options: {value, label, disabled?}`, `orientation`, `disabled`, `readOnly`, `labelSrOnly`                       |
| `ComboboxField`      | `string \| null?`            | Searchable dropdown (Command in Popover), `options`, `disabled`, `readOnly`, `labelSrOnly`                       |
| `DatePickerField`    | `Date \| null?`              | Calendar popover, `disabledDates`, `disabled`, `readOnly`, `labelSrOnly`. Stores a real `Date`                   |
| `CheckboxField`      | `boolean \| null?`           | `disabled`, `readOnly`                                                                                           |
| `SwitchField`        | `boolean \| null?`           | Renders errors (inside `FieldContent`), `disabled`, `readOnly`                                                   |
| `RadioGroupField`    | `string \| null?`            | Rich options `{value, label, description?, disabled?}`; auto **card variant** when descriptions present          |
| `SliderField`        | `number \| null?`            | min/max readout, error slot, `disabled`, `readOnly`, `labelSrOnly`                                               |
| `FileUploadField`    | `File[] \| null?`            | Drag-and-drop, `maxSize`/`maxFiles`, `disabled`                                                                  |
| `CheckboxGroupField` | `string[] \| null?`          | Multi-select group (canonical `checkbox-group` anatomy): `options: {value, label, description?, disabled?}[]`, `columns`/`className` layouts, `readOnly`. **Array mode automatic** |
| `ArrayTextField`     | `string[] \| null?`          | Dynamic string list — InputGroup rows, inline remove, `itemValidators: { onChange?, onBlur? }` (string schema or `({ value }) => …`), `maxItems`, `readOnly`. **Array mode automatic** |

`null?` = `| null | undefined` — optional and nullable schema paths bind everywhere. All widgets render the canonical shadcn Field anatomy: `data-invalid` on the wrapper, `aria-invalid`/`aria-describedby` on the control (always resolvable — ids are namespaced per instance, so two forms with the same field name never collide), errors gated on *touched or submitted*.

**`readOnly` vs `disabled`:** `disabled` dims and skips validation focus; `readOnly` keeps full-contrast display but ignores interaction — use it for view-permission modes. Every widget also takes **`fieldClassName`** for grid placement of the whole field (`col-span-2`, `max-w-sm`, …); `className` on Text/Textarea targets the control itself.

**Write-side guards** (the compiler also checks what widgets could *write*): option widgets' `options[].value` must belong to the path's literal union; free-text widgets (Text/Textarea) are not offered literal-union paths at all (use Select/Combobox/RadioGroup for discriminators); DatePicker only binds paths that admit `undefined` (clearing writes `undefined` — use `.nullish()`/optional date schemas).

**Number fields:** clearing a `type='number'` TextField writes `undefined` (not `''`) — optional number schemas pass, required ones report a missing value.

---

## Type Safety

What the compiler enforces on Pattern 1 (all of it regression-guarded by the type-test suite):

| Checked                                            | Example error                                                       |
| -------------------------------------------------- | ------------------------------------------------------------------- |
| Field name exists                                  | typo → error with did-you-mean suggestion                           |
| Name's value matches the widget                    | `FormSwitchField name='price'` (number path) → error                |
| Validator value type                               | `validators={{ onBlur: z.number() }}` on a string path → error      |
| Validator functions                                | `({ value }) => …` — `value` is the path's type, no cast            |
| `defaultValue` type                                | `defaultValue={42}` on a string path → error                        |
| `onChangeListenTo` targets                         | typo'd source field → error                                         |
| Listener cross-field writes                        | `fieldApi.form.setFieldValue('typo', …)` → error                    |
| Custom-field registry                              | unbranded components rejected; extras keys that shadow shipped widgets rejected |

**Reading a rejection:** when a correctly-spelled path is rejected, it simply *vanishes from the offered union* — the error lists only the paths the widget can edit. If a path you expect isn't offered, check its **value type** first.

**Known boundaries** (shared with raw TanStack — the composed layer adds none of its own):

- Literal-union paths (discriminators) reject broad `z.string()` — use `z.enum([...])` or a function validator.
- `satisfies` defaults keep NARROW property types: a bare `null` default collapses a `Date | null` path out of the widgets' offered names — widen per field (`null as Date | null`), see File Structure.
- `Record<string, T>` paths are open (any key compiles); recursive value types exceed TS instantiation depth — flatten them.
- Paths *into* atomic values (`File`, `Blob`, `FileList`, `Date`) are never offered. Register your own atomic types via declaration merge:

```ts
declare module '@/components/ui/form-context' {
  interface AtomicFieldValues { money: Money }
}
```

---

## Validation

### Recommended strategy

Field-level `onBlur` for instant feedback + form-level `onSubmit` schema as the safety net. Form-level schema issues are mapped onto the right fields automatically; pathless issues render in `<FormErrors />`.

### Deriving field validators from the schema

Don't restate schema rules per field — pick them out of the single source of truth:

```tsx
import { schemaFor } from '@/components/ui/tanstack-form';

<FormTextField name='contact.email' label='Email' required
  validators={{ onBlur: schemaFor(orgSchema, 'contact.email') }} />
```

`schemaFor` resolves dot paths and array-element paths, unwrapping `optional`/`nullable`/`default`. It returns `undefined` for paths it can't traverse (unions, refine-wrapped objects) — a no-op validator — so keep explicit validators there.

### Validator timing

| Validator       | When it runs                | Use for                            |
| --------------- | --------------------------- | ---------------------------------- |
| `onChange`      | Every keystroke             | Instant feedback (use sparingly)   |
| `onBlur`        | Focus leaves the field      | Required checks, format validation |
| `onChangeAsync` | Debounced on keystroke      | Server-side uniqueness checks      |
| `onBlurAsync`   | Debounced on blur           | Expensive server validation        |
| `onSubmit`      | On form submission          | Final catch-all                    |
| `onDynamic`     | Per `revalidateLogic()`     | Multi-step forms                   |

### Async validation

```tsx
<FormTextField name='username' label='Username'
  validators={{
    onBlur: z.string().min(3, 'Too short'),
    onChangeAsync: async ({ value, signal }) => {
      const res = await fetch(`/api/check?u=${value}`, { signal });
      return (await res.json()).taken ? 'Username is taken' : undefined;
    },
    onChangeAsyncDebounceMs: 500
  }} />
```

`TextField` shows a spinner while validating. Let aborts propagate — form-core discards aborted validation results.

### Linked / dependent fields

```tsx
<FormTextField name='confirmPassword' label='Confirm Password' type='password'
  validators={{
    onChangeListenTo: ['password'],
    onChange: ({ value, fieldApi }) =>
      value !== fieldApi.form.getFieldValue('password') ? 'Passwords do not match' : undefined
  }} />
```

### Cross-field (form-level) validation

```tsx
const schema = z.object({ start: z.date(), end: z.date() })
  .refine((v) => v.end > v.start, { message: 'End must be after start' }); // pathless

const form = useAppForm({ validators: { onSubmit: schema }, ... });

<form.Form>
  <FormErrors />   {/* renders pathless issues + function-validator strings, after a submit attempt */}
  ...
</form.Form>
```

Field-pathed issues from a form-level schema display at their fields; **pathless** `refine`/`superRefine` issues display in `<FormErrors />`. The box never paints a pristine form.

---

## Listeners (Side Effects)

```tsx
<FormSelectField name='country' label='Country' options={countries}
  listeners={{
    onChange: ({ value, fieldApi }) => {        // value: string — typed
      fieldApi.form.setFieldValue('state', ''); // path-checked
    }
  }} />
```

`onChange` / `onBlur` / `onMount` / `onSubmit`, each with an optional `*DebounceMs`.

---

## Custom Fields

Three steps — no template-owned files are edited:

```tsx
// 1. Base component: read useFieldContext, render the shared anatomy
function RatingBase({ label }: { label: string }) {
  const field = useFieldContext();     // controlId, isInvalid, formMessageId, handleChange, …
  const value = useStore(field.store, (s) => s.value) as number | undefined;
  return (
    <FormFieldSet>
      <FormField>
        <FieldLabel htmlFor={field.controlId}>{label}</FieldLabel>
        <Stars id={field.controlId} value={value ?? 0} onChange={field.handleChange}
          aria-invalid={field.isInvalid} />
      </FormField>
      <FormFieldError />
    </FormFieldSet>
  );
}

// 2. Brand it with the value type it edits (AFTER any wrapping: fieldFor<V>()(React.memo(Base)))
const RatingField = fieldFor<number | null | undefined>()(RatingBase);

// 3. Join the typed registry per form
const { FormRatingField } = useFormFields(form, { FormRatingField: RatingField });
<FormRatingField name='rating' label='Rating' />   // number paths only
```

Custom fields inherit error gating, resolvable aria ids, and `scrollToFirstError` for free. Extras must be **module-scope components** (an inline-defined map would remount fields), and extras keys may not shadow shipped widget names (compile error).

**Custom array fields:** mark the component with `asArrayField(Base)` so it mounts in array mode, and use the typed array API:

```tsx
const array = useArrayFieldApi<string>(field);  // pushValue/removeValue/insertValue/…
```

---

## Form Recipes

### Simple CRUD form

```tsx
const form = useAppForm({
  defaultValues: { name: '', email: '' } satisfies FormValues,
  validators: { onSubmit: schema },
  onSubmit: async ({ value }) => {
    await mutation.mutateAsync(value);
    toast.success('Saved!');
  }
});
const { FormTextField } = useFormFields(form);
```

### Form in a Sheet or Dialog

Connect an external submit button with the HTML `form` attribute:

```tsx
<form.Form id='sheet-form'>...</form.Form>
...
<SheetFooter>
  <Button type='submit' form='sheet-form'>Save</Button>
</SheetFooter>
```

### Multi-step wizard

```tsx
import { useFormStepper } from '@/hooks/use-stepper';

const stepSchemas = [
  fullSchema.pick({ name: true, category: true }),
  fullSchema.pick({ description: true }),
  z.object({})                                    // review step
];

const { currentValidator, currentStep, handleNextStepOrSubmit, handleCancelOrBack } =
  useFormStepper(stepSchemas, { fullSchema });    // fullSchema re-validates EVERYTHING on final submit

const form = useAppForm({
  defaultValues,
  validationLogic: revalidateLogic(),
  validators: { onDynamic: currentValidator as typeof fullSchema },
  onSubmit: ({ value }) => { ... }
});

// Route EVERY submit through the gate (Enter key included) — do not use
// form.Form here, it would submit the current step directly:
<form.AppForm>
  <form onSubmit={(e) => { e.preventDefault(); void handleNextStepOrSubmit(form); }} noValidate>
    ...step content via withFieldGroup...
  </form>
</form.AppForm>
```

The step gate awaits **async** field validators (uniqueness checks block Next), marks only the current step touched (later steps stay pristine), Back works from every step including review, and a failing final submit jumps to the first invalid step. See `src/features/forms/components/multi-step-product-form.tsx`.

### Nested objects

Dot paths just work, fully typed: `<FormTextField name='contact.address.city' … />`.

### Arrays

- **Multi-select from a list** → `FormCheckboxGroupField` (string[] paths).
- **Dynamic list of strings** (emails, tags) → `FormArrayTextField` with `itemValidators`.
- **Object rows** (invoice line items) → Pattern 2 array container; bound fields work inside rows:

```tsx
<form.AppField name='items' mode='array'>
  {(itemsField) => (
    <>
      {itemsField.state.value.map((_, i) => (
        <div key={i} className='flex gap-2'>
          <FormTextField name={`items[${i}].description`} label={`Item ${i + 1}`} labelSrOnly />
          <FormTextField name={`items[${i}].qty`} label='Qty' labelSrOnly type='number' />
          <Button variant='ghost' size='icon' onClick={() => itemsField.removeValue(i)}>
            <Icons.close />
          </Button>
        </div>
      ))}
      <Button variant='outline' size='sm'
        onClick={() => itemsField.pushValue({ description: '', qty: 1 })}>
        Add Item
      </Button>
      <itemsField.FieldError />   {/* array-level errors, e.g. z.array(...).min(1) */}
    </>
  )}
</form.AppField>
```

Array paths must be template literals (`` `items[${i}].qty` `` — string concatenation defeats the typing). Two-level nesting (`items[i].discounts[j]`) works the same way.

### Dependent dropdowns (country → state)

```tsx
const country = useStore(form.store, (s) => s.values.country);
<FormSelectField name='country' options={countries}
  listeners={{ onChange: ({ fieldApi }) => fieldApi.form.setFieldValue('state', '') }} />
<FormSelectField name='state' options={statesByCountry[country] ?? []} />
```

### Conditional sections

Render-gate the section, and gate its *requiredness inside the schema* — an unconditionally-required hidden field blocks submit invisibly:

```tsx
const schema = z.object({
  billing: z.object({ enabled: z.boolean(), plan: z.string(), vat: z.string() })
    .superRefine((v, ctx) => {
      if (!v.enabled) return;                    // hidden → nothing required
      if (!v.plan) ctx.addIssue({ path: ['plan'], code: 'custom', message: 'Select a plan' });
    })
});

{billingEnabled && <FormSelectField name='billing.plan' … />}
```

Don't clear hidden values in toggle listeners — that destroys user input on a round-trip toggle. Filter at submit instead (`onSubmit: ({ value }) => save(pickVisible(value))`).

### Edit forms (async defaults, dirty state, reset)

```tsx
// 1. Async defaults: fetch first, then mount the form with real values —
//    do NOT form.reset() in an effect (the form re-imposes defaults over
//    untouched fields every render).
const { data } = useSuspenseQuery(productQueryOptions(id));
const form = useAppForm({ defaultValues: toFormValues(data), ... });

// 2. Dirty state: isDefaultValue compares against defaults ('meta.isDirty'
//    means "ever changed", not "differs from default").
const isDirty = useStore(form.store, (s) => !s.isDefaultValue);

// 3. After save: align the query cache and the form baseline together.
onSuccess: (saved) => {
  queryClient.setQueryData(key, saved);
  form.reset(toFormValues(saved));
}
```

Caveat: a background refetch that feeds new `defaultValues` shifts the dirty baseline mid-edit — key the form component by record id/updatedAt if that matters.

---

## Server Errors

Map a failed mutation (e.g. 409 "email taken") back onto the form:

```tsx
import { applyServerErrors } from '@/components/ui/tanstack-form';

const mutation = useMutation({
  mutationFn: createUser,
  onError: (e) =>
    applyServerErrors(form, {
      fieldErrors: { email: 'This email is already registered' },  // renders AT the field
      formErrors: ['Account limit reached']                        // renders in <FormErrors />
    })
});
```

Server errors persist until the next `applyServerErrors`, `clearServerErrors(form)`, or `form.reset()` — clear on edit with a field listener if you want that behavior.

---

## Production Utilities

| Utility                        | Purpose                                                                                     |
| ------------------------------ | ------------------------------------------------------------------------------------------- |
| `<FormErrors />`               | Form-level error box — pathless schema issues + function-validator strings, submit-gated    |
| `scrollToFirstError()`         | Wire to `onSubmitInvalid` — scrolls to and focuses the first `[data-invalid]` field         |
| `schemaFor(schema, path)`      | Derive a field validator from the form schema                                               |
| `applyServerErrors(form, e)`   | Map server field/form errors onto the form                                                  |
| `flattenFormErrors(errors)`    | The display normalization `FormErrors` uses (exported for custom error UIs)                 |

---

## Guard Rails

Two self-verifying suites protect the system — run both before upgrading `@tanstack/react-form` or editing the core:

- **`bun run typecheck`** — includes `src/components/forms/fields/__typetests__/`: every must-fail probe sits under `@ts-expect-error`, so a type-safety regression fails the build as an unused directive (TS2578). See its README.
- **`bun run smoke:forms`** — renders the binding layer headlessly: prop forwarding, wrong-form isolation, id collision-freedom, resolvable `aria-describedby`, a real failed submit through `flattenFormErrors`, server-error round-trip.

---

## Exports Reference

From `@/components/ui/tanstack-form`:

| Export | Kind | Purpose |
| --- | --- | --- |
| `useAppForm` | hook | Create a form instance |
| `useFormFields(form, extras?)` | hook | Typed, instance-bound flat field components |
| `withForm` / `withFieldGroup` | HOC | Form context wrapper / multi-step field groups |
| `useFormContext` / `useFieldContext` | hook | Context access (fields get `controlId`, `isInvalid`, message ids) |
| `fieldFor<V>()` | util | Brand a custom base field with its value contract |
| `asArrayField` | util | Mark a custom base field as array-mode |
| `useArrayFieldApi<TItem>` | util | Typed array field API for custom array widgets |
| `schemaFor` / `applyServerErrors` / `clearServerErrors` | util | See above |
| `revalidateLogic` / `scrollToFirstError` / `flattenFormErrors` | util | — |
| `FormFieldSet` / `FormField` / `FormFieldError` / `FormErrors` | component | Structural anatomy (div wrapper / `data-invalid` anchor / gated errors / form-level box) |
| `TypedFormFields` / `TypedFieldConfig` / `TypedFieldValidators` / `BoundFormField` / `FieldComponentFor` / `FormLike` / `AtomicFieldValues` / `StrictDeepKeysOfType` | type | The typed core |

From `@/components/forms/fields`: the 12 base widgets + their `XxxFieldValue` contracts.

From `@/hooks/use-stepper`: `useFormStepper(schemas, { fullSchema? })`.

---

## Deprecated APIs

Kept working for **one release** with `@deprecated` markers, then removed:

| Deprecated | Use instead |
| --- | --- |
| `useFormFields<T>()` (zero-arg) | `useFormFields(form)` — inferred AND runtime-bound |
| `createFormField(Component)` | `fieldFor<V>()(Component)` + `useFormFields(form, extras)` |
| `typedField<T>()` | same as above (`typedField` never compiled against real fields) |
| Module-level `FormTextField` etc. imports | the components returned by `useFormFields(form)` |
| `FieldConfig` / `FieldValidatorConfig` / `FieldListenerConfig` / `WithTypedName` types | `TypedFieldConfig` / `TypedFieldValidators` |

---

## Dashboard Examples

| Page | Route | Demonstrates |
| --- | --- | --- |
| Basic Form | `/dashboard/forms/basic` | All widgets incl. combobox, date picker, checkbox group; validators; live preview |
| Multi-Step | `/dashboard/forms/multi-step` | `withFieldGroup`, per-step schemas, async-aware gate, full-schema final validation |
| Sheet & Dialog | `/dashboard/forms/sheet-form` | External submit button, close + reset on success |
| Advanced | `/dashboard/forms/advanced` | Async validation, linked fields, nested objects, object-row arrays, dependent dropdowns, `FormErrors`, `scrollToFirstError` |
| Product CRUD | `src/features/products/components/product-form.tsx` | Pattern 1, split schema files |
| Users Sheet | `src/features/users/components/user-form-sheet.tsx` | Edit-vs-create in a sheet |
