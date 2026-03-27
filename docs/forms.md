# Form System

Type-safe, composable form handling built on [TanStack Form](https://tanstack.com/form) + shadcn/ui. Supports simple CRUD forms, multi-step wizards, sheet/dialog forms, dynamic arrays, nested objects, async validation, linked fields, and cross-field validation.

---

## Table of Contents

- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Usage Patterns](#usage-patterns)
  - [Pattern 1: useFormFields (recommended)](#pattern-1-useformfields--type-safe-flat-fields-recommended)
  - [Pattern 2: form.AppField render prop](#pattern-2-formappfield-render-prop--full-control)
  - [Pattern 3: Direct import](#pattern-3-direct-import--no-type-safety-zero-boilerplate)
  - [When to use which](#when-to-use-which)
- [Available Field Components](#available-field-components)
- [Validation](#validation)
  - [Recommended strategy](#recommended-strategy-field-level--form-level)
  - [Validator timing](#validator-timing)
  - [Zod schemas vs functions](#zod-schemas-vs-functions)
  - [Async validation](#async-validation)
  - [Linked / dependent field validation](#linked--dependent-field-validation)
  - [Cross-field (form-level) validation](#cross-field-form-level-validation)
  - [Error visibility](#error-visibility)
- [Listeners (Side Effects)](#listeners-side-effects)
- [Form Recipes](#form-recipes)
  - [Simple CRUD form](#simple-crud-form)
  - [Form in a Sheet or Dialog](#form-in-a-sheet-or-dialog)
  - [Multi-step wizard](#multi-step-wizard)
  - [Nested object fields](#nested-object-fields)
  - [Dynamic array rows](#dynamic-array-rows)
  - [Dependent dropdowns (country → state)](#dependent-dropdowns-country--state)
  - [Password confirmation (linked fields)](#password-confirmation-linked-fields)
- [Production Utilities](#production-utilities)
  - [FormErrors — form-level error display](#formerrors--form-level-error-display)
  - [scrollToFirstError — auto-scroll on failed submit](#scrolltofirsterror--auto-scroll-on-failed-submit)
- [Adding a New Field Type](#adding-a-new-field-type)
- [Type Safety Reference](#type-safety-reference)
- [Exports Reference](#exports-reference)
- [Dashboard Examples](#dashboard-examples)

---

## Architecture

```
form-context.tsx             fields/*.tsx
(contexts, structural        (TextField, FormTextField,
 components, createFormField, SelectField, FormSelectField,
 FieldConfig types,           ... base + composed exports)
 typedField, FormErrors,            │
 scrollToFirstError)                │
      ▲                             │
      │                             │
      └─────── tanstack-form.tsx ───┘
               (useAppForm, useFormFields,
                Form, SubmitButton, StepButton,
                withForm, withFieldGroup)
```

**Dependency rule:** `fields/*.tsx` imports from `form-context.tsx`. `tanstack-form.tsx` imports from both. Neither `form-context.tsx` nor `fields/*.tsx` imports from `tanstack-form.tsx` — no circular dependencies.

**Key files:**

| File                                    | What it provides                                                                                                                                                                                                 |
| --------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/ui/form-context.tsx`    | Shared primitives — contexts, `useFieldContext`, structural components (`FormFieldSet`, `FormField`, `FormFieldError`), `createFormField`, `FieldConfig` types, `typedField`, `FormErrors`, `scrollToFirstError` |
| `src/components/ui/tanstack-form.tsx`   | Main entry point — `useAppForm`, `useFormFields`, `Form`, `SubmitButton`, `StepButton`, `withForm`, `withFieldGroup`                                                                                             |
| `src/components/forms/fields/*.tsx`     | 8 field components, each exporting a base (`TextField`) and composed (`FormTextField`) variant                                                                                                                   |
| `src/components/forms/fields/index.tsx` | Barrel re-exports for all fields                                                                                                                                                                                 |

---

## File Structure (per feature)

Every form feature should split into **schema**, **constants**, and **component**:

```
src/features/products/
├── schemas/
│   └── product.ts              ← Zod schema + inferred FormValues type
├── constants/
│   └── product-options.ts      ← Select options, enums, static data
├── components/
│   ├── product-form.tsx         ← Form UI (imports schema + options)
│   └── product-form-fields.tsx  ← Optional: sections for large forms
```

**Why split?**

| Concern     | File                           | Benefit                                                                         |
| ----------- | ------------------------------ | ------------------------------------------------------------------------------- |
| **Schema**  | `schemas/product.ts`           | Reusable in API routes, server actions, data tables, tests — no `'use client'`  |
| **Type**    | `schemas/product.ts`           | `ProductFormValues` used in form, API, list components — single source of truth |
| **Options** | `constants/product-options.ts` | Shared between form selects, table filters, search facets                       |
| **Form UI** | `components/product-form.tsx`  | Pure UI — opens clean, no validation logic clutter                              |

**Schema file example:**

```ts
// src/features/products/schemas/product.ts
import * as z from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters.'),
  category: z.string().min(1, 'Please select a category'),
  price: z.number({ message: 'Price is required' }),
  description: z.string().min(10, 'Description must be at least 10 characters.')
});

// Always prefer z.infer — guarantees the type matches the schema exactly.
// Manual types drift when the schema has unions, optionals, or refinements.
export type ProductFormValues = z.infer<typeof productSchema>;
```

> **Rule of thumb:** Use `z.infer<typeof schema>` as the form values type. Only override individual fields (via `Omit & { ... }`) when the form's runtime value shape genuinely differs from the schema output (e.g., a `File[]` field stored as `string` after upload).

**Form component imports the schema:**

```tsx
// src/features/products/components/product-form.tsx
import { productSchema, type ProductFormValues } from '@/features/products/schemas/product';
import { categoryOptions } from '@/features/products/constants/product-options';

const form = useAppForm({
  defaultValues: { ... } as ProductFormValues,
  validators: { onSubmit: productSchema },
  ...
});

const { FormTextField, FormSelectField } = useFormFields<ProductFormValues>();
```

**Same schema reused in API route:**

```ts
// src/app/api/products/route.ts
import { productSchema } from '@/features/products/schemas/product';

export async function POST(req: Request) {
  const body = await req.json();
  const data = productSchema.parse(body);  // same validation, zero duplication
  ...
}
```

### When a form grows large

For forms with 15+ fields, split the UI into section components:

```
components/
├── product-form.tsx              ← Main form (useAppForm, layout, submit)
├── product-basic-fields.tsx      ← Section: name, category, price
├── product-media-fields.tsx      ← Section: image upload
└── product-detail-fields.tsx     ← Section: description, tags, metadata
```

Each section receives the typed fields from `useFormFields` via props or calls `useFormFields` itself.

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
    defaultValues: { name: '', email: '' } as FormValues,
    validators: { onSubmit: schema },
    onSubmit: ({ value }) => console.log(value)
  });

  const { FormTextField } = useFormFields<FormValues>();

  return (
    <form.AppForm>
      <form.Form>
        <FormTextField
          name='name'
          label='Name'
          required
          validators={{ onBlur: z.string().min(2, 'Name is required') }}
        />
        <FormTextField
          name='email'
          label='Email'
          required
          type='email'
          validators={{ onBlur: z.string().email('Invalid email') }}
        />
        <form.SubmitButton label='Save' />
      </form.Form>
    </form.AppForm>
  );
}
```

---

## Usage Patterns

### Pattern 1: `useFormFields` — Type-safe flat fields (recommended)

Type-safe field names with autocomplete. Concise. Supports validators, listeners, `mode`, `defaultValue`. **Use for most forms.**

```tsx
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';

type FormValues = { name: string; email: string; category: string };

const form = useAppForm({
  defaultValues: { name: '', email: '', category: '' } as FormValues,
  validators: { onSubmit: schema },
  onSubmit: ({ value }) => { ... },
});

const { FormTextField, FormSelectField } = useFormFields<FormValues>();

<FormTextField name="email" label="Email" required />     // ✅ autocomplete
<FormTextField name="typo" label="Oops" />                // ❌ TypeScript error
```

**Props available on every `FormXxxField`:**

| Prop               | Type                                            | Description                                                                 |
| ------------------ | ----------------------------------------------- | --------------------------------------------------------------------------- |
| `name`             | `DeepKeys<T>` (via `useFormFields`) or `string` | Field path                                                                  |
| `validators`       | `FieldValidatorConfig`                          | `onBlur`, `onChange`, `onChangeAsync`, `onSubmit`, `onChangeListenTo`, etc. |
| `asyncDebounceMs`  | `number`                                        | Default debounce for all async validators                                   |
| `listeners`        | `FieldListenerConfig`                           | `onChange`, `onBlur`, `onMount`, `onSubmit` + debounce options              |
| `mode`             | `'value' \| 'array'`                            | Set to `'array'` for array fields                                           |
| `defaultValue`     | `unknown`                                       | Initial value (for dynamically added fields)                                |
| ...component props | varies                                          | `label`, `required`, `placeholder`, `options`, etc.                         |

### Pattern 2: `form.AppField` render prop — Full control

Type-safe names (native TanStack Form). Full field API access. **Use for custom fields, array fields, and any UI that doesn't fit a pre-built component.**

```tsx
<form.AppField
  name='framework' // ✅ type-safe
  validators={{ onBlur: z.string().min(1, 'Required') }}
>
  {(field) => (
    <field.FieldSet>
      <field.Field>
        <field.FieldLabel>Framework *</field.FieldLabel>
        <MyCombobox
          value={field.state.value}
          onChange={field.handleChange}
          onBlur={field.handleBlur}
        />
      </field.Field>
      <field.FieldError />
    </field.FieldSet>
  )}
</form.AppField>
```

**Components available inside the render prop (`field.XxxField`):**

| Component                | Purpose                                                     |
| ------------------------ | ----------------------------------------------------------- |
| `field.FieldSet`         | Wrapper — generates unique accessibility IDs                |
| `field.Field`            | Container — wires `aria-invalid`, `aria-describedby`        |
| `field.FieldLabel`       | `<label>` connected to the field                            |
| `field.FieldError`       | Renders validation errors (shows after touch or submit)     |
| `field.FieldContent`     | Flex container for label + description (horizontal layouts) |
| `field.FieldDescription` | Helper text below the field                                 |
| `field.TextField`        | Pre-built text input                                        |
| `field.TextareaField`    | Pre-built textarea                                          |
| `field.SelectField`      | Pre-built select                                            |
| `field.CheckboxField`    | Pre-built checkbox                                          |
| `field.SwitchField`      | Pre-built switch                                            |
| `field.RadioGroupField`  | Pre-built radio group                                       |
| `field.SliderField`      | Pre-built slider                                            |
| `field.FileUploadField`  | Pre-built file uploader                                     |

**Field API (`field.state`, `field.handleChange`, etc.):**

| Property/Method                       | Description                                 |
| ------------------------------------- | ------------------------------------------- |
| `field.state.value`                   | Current field value                         |
| `field.state.meta.isTouched`          | User has interacted                         |
| `field.state.meta.isDirty`            | Value differs from default                  |
| `field.state.meta.isValid`            | No validation errors                        |
| `field.state.meta.isValidating`       | Async validation in progress                |
| `field.state.meta.errors`             | Array of error messages                     |
| `field.handleChange(value)`           | Update field value                          |
| `field.handleBlur()`                  | Mark as touched + trigger onBlur validation |
| `field.pushValue(item)`               | Array mode: add item                        |
| `field.removeValue(index)`            | Array mode: remove item                     |
| `field.swapValues(a, b)`              | Array mode: swap items                      |
| `field.insertValue(index, item)`      | Array mode: insert at index                 |
| `field.form.setFieldValue(name, val)` | Set another field's value                   |
| `field.form.getFieldValue(name)`      | Read another field's value                  |

### Pattern 3: Direct import — No type safety, zero boilerplate

```tsx
import { FormTextField } from '@/components/forms/fields';

<FormTextField name='name' label='Name' />; // name is `string` — no type check
```

### When to use which

| Scenario                                           | Pattern       | Why                                         |
| -------------------------------------------------- | ------------- | ------------------------------------------- |
| Standard fields (text, select, checkbox, etc.)     | **Pattern 1** | Type-safe + concise                         |
| Custom one-off fields (date picker, OTP, combobox) | **Pattern 2** | Full field API access                       |
| Array fields with custom row layout                | **Pattern 2** | Need `pushValue`, `removeValue`, sub-fields |
| Array fields with composed component               | **Pattern 1** | Pass `mode="array"`                         |
| Multi-step form steps                              | **Pattern 2** | `group.AppField` + `field.TextField`        |
| Linked field validation (`onChangeListenTo`)       | **Pattern 2** | Need `fieldApi` in validator                |
| Quick prototype / dynamic field names              | **Pattern 3** | Fastest                                     |

---

## Available Field Components

Each field has two variants:

| Base (for render props) | Composed (for flat use) | Input type                                    |
| ----------------------- | ----------------------- | --------------------------------------------- |
| `TextField`             | `FormTextField`         | Text, email, password, tel, url, number       |
| `TextareaField`         | `FormTextareaField`     | Multi-line text with optional character count |
| `SelectField`           | `FormSelectField`       | Single-value dropdown (`options` prop)        |
| `CheckboxField`         | `FormCheckboxField`     | Boolean checkbox with label                   |
| `SwitchField`           | `FormSwitchField`       | Toggle switch with label + description        |
| `RadioGroupField`       | `FormRadioGroupField`   | Radio button group (`options` prop)           |
| `SliderField`           | `FormSliderField`       | Range slider with min/max display             |
| `FileUploadField`       | `FormFileUploadField`   | Drag-and-drop file upload                     |

**TextField** supports `type` prop: `'text'`, `'email'`, `'password'`, `'tel'`, `'url'`, `'number'`. Shows a spinner during async validation.

---

## Validation

### Recommended strategy: Field-level + Form-level

```
┌─────────────────────────────────────────────────────┐
│  onBlur (field-level)   → instant feedback on tab   │
│  onChangeAsync (field)  → server checks (debounced) │
│  onSubmit (form-level)  → catch-all safety net      │
└─────────────────────────────────────────────────────┘
```

### Validator timing

| Validator       | When it runs                | Use for                            |
| --------------- | --------------------------- | ---------------------------------- |
| `onChange`      | Every keystroke             | Instant feedback (use sparingly)   |
| `onBlur`        | When field loses focus      | Required checks, format validation |
| `onChangeAsync` | After debounce on keystroke | Server-side uniqueness checks      |
| `onBlurAsync`   | After debounce on blur      | Expensive server validation        |
| `onSubmit`      | On form submission          | Final catch-all                    |
| `onMount`       | When field mounts           | Pre-validation                     |

### Zod schemas vs functions

```tsx
// Zod schema — StandardSchemaV1, no adapter needed (Zod v4)
validators={{ onBlur: z.string().email('Invalid email') }}

// Sync function — return error string or undefined
validators={{
  onChange: ({ value }) => value.length < 3 ? 'Too short' : undefined,
}}

// Async function — supports AbortSignal for cancellation
validators={{
  onChangeAsync: async ({ value, signal }) => {
    const res = await fetch(`/api/check?q=${value}`, { signal });
    const { ok } = await res.json();
    return ok ? undefined : 'Already taken';
  },
  onChangeAsyncDebounceMs: 500,
}}
```

### Async validation

```tsx
<FormTextField
  name='username'
  label='Username'
  validators={{
    onBlur: z.string().min(3, 'Too short'),
    onChangeAsync: async ({ value }: { value: string }) => {
      if (!value || value.length < 3) return undefined;
      await new Promise((r) => setTimeout(r, 500)); // simulated API
      if (value === 'admin') return 'Username is taken';
      return undefined;
    },
    onChangeAsyncDebounceMs: 500
  }}
/>
```

`TextField` automatically shows a spinner when `isValidating` is true.

### Linked / dependent field validation

Use `onChangeListenTo` to re-run validation when another field changes:

```tsx
<form.AppField
  name='confirmPassword'
  validators={{
    onChangeListenTo: ['password'],
    onChange: ({ value, fieldApi }) => {
      const password = fieldApi.form.getFieldValue('password');
      return value !== password ? 'Passwords do not match' : undefined;
    }
  }}
>
  {(field) => <field.TextField label='Confirm Password' type='password' />}
</form.AppField>
```

### Cross-field (form-level) validation

For validation that spans multiple fields, use form-level validators:

```tsx
const form = useAppForm({
  defaultValues: { ... },
  validators: {
    onSubmit: fullZodSchema,  // validates entire form shape
    // or use a function:
    onChange: ({ value }) => {
      if (value.startDate > value.endDate) return 'End date must be after start';
      return undefined;
    },
  },
});
```

Form-level errors are rendered by `<FormErrors />`.

### Error visibility

Errors are shown when either condition is met:

1. **Field is touched** — user has interacted with the field (blur/change)
2. **Form has been submitted** — at least one submit attempt, even if fields weren't touched

This prevents showing errors on a pristine form while ensuring all errors appear after submit.

---

## Listeners (Side Effects)

Listeners run side effects without affecting validation. Use them to reset dependent fields, sync values, trigger analytics, etc.

```tsx
<FormSelectField
  name='country'
  label='Country'
  options={countries}
  listeners={{
    onChange: ({ value, fieldApi }) => {
      fieldApi.form.setFieldValue('state', '');
      fieldApi.form.setFieldValue('city', '');
    }
  }}
/>
```

| Listener   | When it fires             |
| ---------- | ------------------------- |
| `onChange` | After field value changes |
| `onBlur`   | When field loses focus    |
| `onMount`  | When field mounts         |
| `onSubmit` | On form submission        |

Each has an optional `*DebounceMs` companion (e.g., `onChangeDebounceMs: 300`).

---

## Form Recipes

### Simple CRUD form

```tsx
const form = useAppForm({
  defaultValues: { name: '', email: '' } as FormValues,
  validators: { onSubmit: schema },
  onSubmit: async ({ value }) => {
    await saveToApi(value);
    toast.success('Saved!');
  }
});

const { FormTextField } = useFormFields<FormValues>();

<form.AppForm>
  <form.Form>
    <FormTextField name='name' label='Name' required validators={{ onBlur: z.string().min(2) }} />
    <FormTextField
      name='email'
      label='Email'
      required
      type='email'
      validators={{ onBlur: z.string().email() }}
    />
    <form.SubmitButton label='Save' />
  </form.Form>
</form.AppForm>;
```

### Form in a Sheet or Dialog

Use the HTML `form` attribute to connect an external submit button:

```tsx
const [open, setOpen] = useState(false);

const form = useAppForm({
  defaultValues: { ... },
  onSubmit: ({ value }) => {
    toast.success('Created!');
    setOpen(false);
    form.reset();
  },
});

<Sheet open={open} onOpenChange={setOpen}>
  <SheetContent>
    <SheetHeader>...</SheetHeader>
    <ScrollArea className="flex-1">
      <form.AppForm>
        <form.Form id="sheet-form" className="space-y-4 p-0 md:p-0">
          {/* fields */}
        </form.Form>
      </form.AppForm>
    </ScrollArea>
    <SheetFooter>
      <Button type="submit" form="sheet-form">Save</Button>
    </SheetFooter>
  </SheetContent>
</Sheet>
```

Key: `id="sheet-form"` on `form.Form` + `form="sheet-form"` on the external button.

### Multi-step wizard

```tsx
import { useAppForm, withFieldGroup } from '@/components/ui/tanstack-form';
import { revalidateLogic, useStore } from '@tanstack/react-form';

// 1. Define step groups
const Step1 = withFieldGroup({
  defaultValues: { name: '', category: '' },
  render: ({ group }) => (
    <>
      <group.AppField name="name">
        {(field) => <field.TextField label="Name" required />}
      </group.AppField>
      <group.AppField name="category">
        {(field) => <field.SelectField label="Category" options={opts} />}
      </group.AppField>
    </>
  ),
});

// 2. Define per-step schemas
const stepSchemas = [
  fullSchema.pick({ name: true, category: true }),
  fullSchema.pick({ description: true }),
  z.object({}),  // review step — no validation
];

// 3. Create form with dynamic validation
const { currentValidator, currentStep, ... } = useFormStepper(stepSchemas);

const form = useAppForm({
  defaultValues: { ... },
  validationLogic: revalidateLogic(),
  validators: {
    onDynamic: currentValidator,
    onDynamicAsyncDebounceMs: 500,
  },
  onSubmit: ({ value }) => { ... },
});

// 4. Render current step
<Step1 form={form} fields={{ name: 'name', category: 'category' }} />
```

See `src/features/forms/components/multi-step-product-form.tsx`.

### Nested object fields

Use dot-notation for nested paths. `DeepKeys<T>` provides autocomplete for `team.name`, `team.size`, etc.

```tsx
type FormValues = {
  team: { name: string; size: number };
};

const { FormTextField } = useFormFields<FormValues>();

<FormTextField name="team.name" label="Team Name" required />
<FormTextField name="team.size" label="Team Size" type="number" />
```

### Dynamic array rows

Use `form.AppField` with `mode="array"` for full control over add/remove:

```tsx
type FormValues = {
  members: Array<{ name: string; role: string }>;
};

<form.AppField name='members' mode='array'>
  {(field) => (
    <div className='space-y-3'>
      {field.state.value.map((_, i) => (
        <div key={i} className='flex gap-2'>
          <form.AppField
            name={`members[${i}].name`}
            validators={{ onBlur: z.string().min(1, 'Required') }}
          >
            {(sub) => (
              <sub.FieldSet className='flex-1'>
                <sub.Field>
                  <Input
                    placeholder='Name'
                    value={sub.state.value}
                    onChange={(e) => sub.handleChange(e.target.value)}
                    onBlur={sub.handleBlur}
                  />
                </sub.Field>
                <sub.FieldError />
              </sub.FieldSet>
            )}
          </form.AppField>
          <Button variant='ghost' size='icon' onClick={() => field.removeValue(i)}>
            <Icons.close className='h-4 w-4' />
          </Button>
        </div>
      ))}
      <Button variant='outline' size='sm' onClick={() => field.pushValue({ name: '', role: '' })}>
        Add Member
      </Button>
    </div>
  )}
</form.AppField>;
```

Array methods: `pushValue`, `removeValue`, `insertValue`, `replaceValue`, `swapValues`, `moveValue`.

### Dependent dropdowns (country → state)

Combine `listeners` with reactive `useStore`:

```tsx
// Read country value reactively
const selectedCountry = useStore(form.store, (s) => s.values.country);
const stateOptions = countryStateMap[selectedCountry] ?? [];

<FormSelectField
  name="country"
  label="Country"
  options={countryOptions}
  listeners={{
    onChange: ({ fieldApi }) => {
      fieldApi.form.setFieldValue('state', '');  // reset dependent field
    },
  }}
/>
<FormSelectField
  name="state"
  label="State"
  options={stateOptions}
  placeholder={selectedCountry ? 'Select state' : 'Select a country first'}
/>
```

### Password confirmation (linked fields)

```tsx
<form.AppField
  name='confirmPassword'
  validators={{
    onChangeListenTo: ['password'],
    onChange: ({ value, fieldApi }) => {
      const password = fieldApi.form.getFieldValue('password');
      return value !== password ? 'Passwords do not match' : undefined;
    },
    onBlur: z.string().min(1, 'Required')
  }}
>
  {(field) => <field.TextField label='Confirm Password' required type='password' />}
</form.AppField>
```

### Checkbox group (multi-select array)

For selecting multiple values from a list, use `form.AppField` with `mode="array"`:

```tsx
const positionOptions = [
  { value: 'frontend', label: 'Frontend Developer' },
  { value: 'backend', label: 'Backend Developer' },
  { value: 'fullstack', label: 'Full Stack Developer' }
];

<form.AppField name='position' mode='array'>
  {(field) => {
    const values: string[] = field.state.value || [];
    return (
      <field.FieldSet>
        <FieldLabel>Position(s) *</FieldLabel>
        <div className='grid grid-cols-2 gap-3'>
          {positionOptions.map((opt) => (
            <div key={opt.value} className='flex items-center space-x-2'>
              <Checkbox
                id={`position-${opt.value}`}
                checked={values.includes(opt.value)}
                onCheckedChange={(checked) => {
                  if (checked) field.pushValue(opt.value);
                  else {
                    const idx = values.indexOf(opt.value);
                    if (idx > -1) field.removeValue(idx);
                  }
                }}
              />
              <Label htmlFor={`position-${opt.value}`}>{opt.label}</Label>
            </div>
          ))}
        </div>
        <field.FieldError />
      </field.FieldSet>
    );
  }}
</form.AppField>;
```

### Date picker field (Calendar popover)

For date selection, use `form.AppField` with a Calendar popover. Store as ISO string:

```tsx
<form.AppField
  name='available-date'
  validators={{ onBlur: z.string().min(1, 'Please select a date') }}
>
  {(field) => (
    <field.FieldSet>
      <field.Field>
        <field.FieldLabel>Available Date *</field.FieldLabel>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant='outline'
              className={cn(
                'w-full justify-start text-left font-normal',
                !field.state.value && 'text-muted-foreground'
              )}
            >
              <Icons.calendar className='mr-2 h-4 w-4' />
              {field.state.value ? format(new Date(field.state.value), 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className='w-auto p-0' align='start'>
            <Calendar
              mode='single'
              selected={field.state.value ? new Date(field.state.value) : undefined}
              onSelect={(date) => {
                field.handleChange(date ? date.toISOString() : '');
                field.handleBlur();
              }}
              disabled={(date) => date < new Date()}
            />
          </PopoverContent>
        </Popover>
      </field.Field>
      <field.FieldError />
    </field.FieldSet>
  )}
</form.AppField>
```

### Real-world example: Job Application form

A complete form combining flat fields, checkbox group, date picker, select, file upload, and production utilities. Follows the split-file pattern:

```
src/features/applications/
├── schemas/application.ts         ← Zod schema + z.infer type
├── constants/application-options.ts ← Position & experience options
├── components/application-form.tsx  ← Form UI
```

**Schema** (`schemas/application.ts`):

```ts
export const applicationSchema = z.object({
  firstName: z.string({ error: 'This field is required' }),
  lastName: z.string({ error: 'This field is required' }),
  email: z.email({ error: 'Please enter a valid email' }),
  'github-url': z.url({ error: 'Please enter a valid url' }).optional(),
  'linkedin-url': z.url({ error: 'Please enter a valid url' }).optional(),
  position: z.array(z.string()).min(1, 'Please select at least one item'),
  experience: z.string().min(1, 'Please select an item'),
  'available-date': z.string().min(1, 'Please select a date'),
  'cover-letter': z.string().optional(),
  'file-upload': z.union([z.file(), z.array(z.file()).nonempty(), ...]).optional(),
});

export type ApplicationFormValues = z.infer<typeof applicationSchema>;
```

**Form** (`components/application-form.tsx`):

```tsx
import { applicationSchema, type ApplicationFormValues } from '../schemas/application';
import { positionOptions, experienceOptions } from '../constants/application-options';

const form = useAppForm({
  defaultValues: { ... } as ApplicationFormValues,
  validators: { onSubmit: applicationSchema },
  onSubmitInvalid: () => scrollToFirstError(),
  onSubmit: ({ value }) => { ... },
});

const { FormTextField, FormSelectField, FormTextareaField, FormFileUploadField } =
  useFormFields<ApplicationFormValues>();

// Flat fields for text/email/url/select/textarea/file
<FormTextField name="firstName" label="First Name" required ... />

// AppField for checkbox group (position) and date picker (available-date)
<form.AppField name="position" mode="array">...</form.AppField>
<form.AppField name="available-date">...</form.AppField>
```

See `/dashboard/forms/application` for the full working example.

---

## Production Utilities

### FormErrors — form-level error display

Renders errors from form-level validators (cross-field validation). Place at the top of the form.

```tsx
import { FormErrors } from '@/components/ui/tanstack-form';

<form.AppForm>
  <form.Form>
    <FormErrors />
    {/* fields */}
  </form.Form>
</form.AppForm>;
```

### scrollToFirstError — auto-scroll on failed submit

Scrolls to and focuses the first field with a validation error. Wire it to `onSubmitInvalid`:

```tsx
import { scrollToFirstError } from '@/components/ui/tanstack-form';

const form = useAppForm({
  ...
  onSubmitInvalid: () => scrollToFirstError(),
});
```

---

## Adding a New Field Type

Creating a new field (e.g., `DatePickerField`) requires **2 touchpoints**:

### 1. Create the field file

```tsx
// src/components/forms/fields/date-picker-field.tsx
'use client';

import { useStore } from '@tanstack/react-form';
import { FieldLabel } from '@/components/ui/field';
import {
  useFieldContext,
  FormFieldSet,
  FormField,
  FormFieldError,
  createFormField
} from '@/components/ui/form-context';

interface DatePickerFieldProps {
  label: string;
  required?: boolean;
}

export function DatePickerField({ label, required }: DatePickerFieldProps) {
  const field = useFieldContext();
  const value = useStore(field.store, (s) => s.value) as Date | undefined;

  return (
    <FormFieldSet>
      <FormField>
        <FieldLabel>
          {label}
          {required && ' *'}
        </FieldLabel>
        {/* Your date picker UI here — call field.handleChange and field.handleBlur */}
      </FormField>
      <FormFieldError />
    </FormFieldSet>
  );
}

export const FormDatePickerField = createFormField(DatePickerField);
```

### 2. Export from barrel

```tsx
// src/components/forms/fields/index.tsx
export { DatePickerField } from './date-picker-field';
export { FormDatePickerField } from './date-picker-field';
```

### 3. Use it

```tsx
// Direct import (Pattern 3)
import { FormDatePickerField } from '@/components/forms/fields';
<FormDatePickerField name='birthDate' label='Birth Date' />;

// Type-safe with typedField (Pattern 1 for custom fields)
import { typedField } from '@/components/ui/tanstack-form';
const narrow = typedField<FormValues>();
const TypedDatePicker = narrow(FormDatePickerField);
<TypedDatePicker name='birthDate' label='Birth Date' />;

// Or add to useFormFields in tanstack-form.tsx for built-in support
```

### Optional: Register for AppField render props

To use `field.DatePickerField` inside `form.AppField`, add to `fieldComponents` in `tanstack-form.tsx`.

To include in `useFormFields`, add to its return object.

---

## Type Safety Reference

| What                                          | Type-safe? | How                                           |
| --------------------------------------------- | :--------: | --------------------------------------------- |
| Field names via `useFormFields<T>()`          |    Yes     | `DeepKeys<T>` narrows `name`                  |
| Field names via `form.AppField`               |    Yes     | Native TanStack Form typing                   |
| Field names via `typedField<T>()(Component)`  |    Yes     | `DeepKeys<T>` narrowing for custom fields     |
| Field names via direct `FormTextField` import |     No     | `name` is `string`                            |
| Nested paths (`team.name`, `members[0].role`) |    Yes     | `DeepKeys<T>` resolves dot/bracket notation   |
| Validator values (Zod schema)                 |    Yes     | StandardSchemaV1 pass-through                 |
| Validator functions                           |  Partial   | `value` typed as `unknown` — cast in function |
| Listener callbacks                            |  Partial   | `value` typed as `unknown` — cast in callback |

---

## Exports Reference

### From `@/components/ui/tanstack-form`

| Export                 | Type      | Purpose                                                                  |
| ---------------------- | --------- | ------------------------------------------------------------------------ |
| `useAppForm`           | Hook      | Create a form instance                                                   |
| `useFormFields<T>()`   | Hook      | Get type-safe composed field components                                  |
| `withForm`             | HOC       | Wrap a component with form context                                       |
| `withFieldGroup`       | HOC       | Create multi-step field groups                                           |
| `useFormContext`       | Hook      | Access form instance from context                                        |
| `useFieldContext`      | Hook      | Access field API from context                                            |
| `createFormField`      | Utility   | Create a composed field from a base field                                |
| `typedField<T>()`      | Utility   | Narrow any composed field's name to `DeepKeys<T>`                        |
| `revalidateLogic`      | Utility   | Dynamic validation logic for multi-step                                  |
| `scrollToFirstError`   | Utility   | Scroll + focus first invalid field                                       |
| `FormFieldSet`         | Component | Structural — accessibility ID wrapper                                    |
| `FormField`            | Component | Structural — aria-invalid, aria-describedby                              |
| `FormFieldError`       | Component | Renders field-level errors                                               |
| `FormErrors`           | Component | Renders form-level errors                                                |
| `FieldConfig`          | Type      | `validators` + `asyncDebounceMs` + `listeners` + `mode` + `defaultValue` |
| `FieldValidatorConfig` | Type      | Validator timing options                                                 |
| `FieldListenerConfig`  | Type      | Listener options                                                         |
| `WithTypedName`        | Type      | Narrow component's `name` prop                                           |

### From `@/components/forms/fields`

| Base (render prop) | Composed (flat)       |
| ------------------ | --------------------- |
| `TextField`        | `FormTextField`       |
| `TextareaField`    | `FormTextareaField`   |
| `SelectField`      | `FormSelectField`     |
| `CheckboxField`    | `FormCheckboxField`   |
| `SwitchField`      | `FormSwitchField`     |
| `RadioGroupField`  | `FormRadioGroupField` |
| `SliderField`      | `FormSliderField`     |
| `FileUploadField`  | `FormFileUploadField` |

---

## Dashboard Examples

### Form Pages (`/dashboard/forms/...`)

| Page                  | Route                         | Patterns demonstrated                                                                                                                                                                                                                           |
| --------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Basic Form**        | `/dashboard/forms/basic`      | All 8 field types, `useFormFields`, `onBlur` + async validation, listeners, form data preview                                                                                                                                                   |
| **Multi-Step Form**   | `/dashboard/forms/multi-step` | `withFieldGroup`, per-step Zod schemas, `revalidateLogic`, step navigation, review summary                                                                                                                                                      |
| **Sheet & Dialog**    | `/dashboard/forms/sheet-form` | Form in Sheet with external submit button, form in Dialog, close + reset on success                                                                                                                                                             |
| **Advanced Patterns** | `/dashboard/forms/advanced`   | Async validation (username check), linked fields (`onChangeListenTo` for password confirm), nested objects (`team.name`), dynamic array rows (members), dependent dropdowns (country → state with listener), `FormErrors`, `scrollToFirstError` |

### Other Forms

| Form          | File                                                   | Patterns                                   |
| ------------- | ------------------------------------------------------ | ------------------------------------------ |
| Product CRUD  | `src/features/products/components/product-form.tsx`    | Pattern 1, split schema, onBlur validators |
| Sheet Product | `src/features/forms/components/sheet-product-form.tsx` | Pattern 2 in Sheet                         |
| Auth          | `src/features/auth/components/user-auth-form.tsx`      | Pattern 2, minimal                         |
