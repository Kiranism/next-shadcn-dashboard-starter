# Forms

Forms follow the **official shadcn TanStack Form conventions**, scaled with
TanStack's own [`createFormHook`](https://tanstack.com/form/latest/docs/framework/react/guides/form-composition)
pattern: the doc's `Field` anatomy is written **once per widget** as a reusable
field component, and pages use them as one-liners inside `form.AppField`.

- [shadcn: TanStack Form](https://ui.shadcn.com/docs/forms/tanstack) — the
  anatomy inside every field component
- [TanStack Form docs](https://tanstack.com/form/latest) — validators,
  listeners, arrays, async validation

## Architecture

| File | What it provides |
| --- | --- |
| `src/lib/form-context.ts` | `createFormHookContexts` — `fieldContext`, `formContext`, `useFieldContext`, `useFieldInvalid`, `BaseFieldProps` |
| `src/components/forms/fields/*.tsx` | 16 field components, each the exact shadcn doc anatomy for its widget |
| `src/components/forms/submit-button.tsx` | `SubmitButton` — disables while submitting (`form.Subscribe`) |
| `src/lib/form.ts` | `createFormHook` — exports `useAppForm` / `withForm` with everything registered |

## The pattern

One `useAppForm` per form, a Zod schema validated on submit, and one
`form.AppField` per field rendering the matching component:

```tsx
'use client';

import { useAppForm } from '@/lib/form';
import { FieldGroup } from '@/components/ui/field';
import * as z from 'zod';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.'),
  severity: z.string().min(1, 'Select a severity.')
});

export function BugReportForm() {
  const form = useAppForm({
    defaultValues: { title: '', severity: '' },
    validators: { onSubmit: formSchema },
    onSubmit: ({ value }) => console.log(value)
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}
    >
      <FieldGroup>
        <form.AppField
          name='title'
          children={(field) => (
            <field.TextField label='Bug Title' required placeholder='Login button broken' />
          )}
        />
        <form.AppField
          name='severity'
          children={(field) => (
            <field.SelectField
              label='Severity'
              options={[
                { value: 'low', label: 'Low' },
                { value: 'high', label: 'High' }
              ]}
            />
          )}
        />
        <form.AppForm>
          <form.SubmitButton>Submit</form.SubmitButton>
        </form.AppForm>
      </FieldGroup>
    </form>
  );
}
```

`form.AppField`'s `name` is fully typed against `defaultValues` — typos are
compile errors. Field-level validators/listeners go on the `form.AppField`
element (async checks, `onChangeListenTo` linked fields).

## Available field components

All render inside `form.AppField` as `field.XxxField`; every one takes
`label`, `description?`, `required?`.

| Component | Value type | Notes |
| --- | --- | --- |
| `TextField` | `string` / `number` | Any input `type` (text, email, password, tel, url, time, number). Number inputs convert at the edge — clearing writes `undefined`. Shows a spinner while async validators run. |
| `TextareaField` | `string` | `showCount` renders a character counter against `maxLength` |
| `SelectField` | `string` | `options` array |
| `CheckboxField` | `boolean` | Single checkbox (terms, consent) |
| `SwitchField` | `boolean` | Label/description left, switch right |
| `RadioGroupField` | `string` | `FieldSet` + `FieldLegend` semantics |
| `SliderField` | `number` | `min`/`max`/`step` + value readout |
| `ComboboxField` | `string` | Searchable select (Popover + Command) |
| `DatePickerField` | `Date \| undefined` | Popover + Calendar, `disabledDates` |
| `DateRangeField` | `DateRange \| undefined` | Two-month range calendar |
| `OtpField` | `string` | 6-digit code (3 + 3) |
| `ColorField` | `string` | Native picker + hex input |
| `FileUploadField` | `File[]` | Wraps `FileUploader`, `maxSize`/`maxFiles` |
| `CheckboxGroupField` | `string[]` | Needs `mode='array'` on the AppField |
| `TagsField` | `string[]` | Needs `mode='array'`; Enter/Add pushes, badges remove |
| `ToggleGroupField` | `string[]` | Needs `mode='array'`; pass `ToggleGroupItem`s as children |

## One-off custom fields — drop down to `form.Field`

For anything the components don't cover (object-row arrays, bespoke UI), use
the raw doc pattern directly — it composes freely with the components:

```tsx
<form.Field
  name='members'
  mode='array'
  children={(field) => (
    <>
      {field.state.value.map((_, i) => (
        <form.Field
          name={`members[${i}].name`}
          children={(subField) => {
            const isInvalid = subField.state.meta.isTouched && !subField.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <Input
                  value={subField.state.value}
                  onChange={(e) => subField.handleChange(e.target.value)}
                  onBlur={subField.handleBlur}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={subField.state.meta.errors} />}
              </Field>
            );
          }}
        />
      ))}
      <Button type='button' onClick={() => field.pushValue({ name: '' })}>Add</Button>
    </>
  )}
/>
```

The doc conventions inside any custom field: `data-invalid` on `<Field>`,
`aria-invalid` on the control, `{isInvalid && <FieldError errors={…} />}`,
function validators return `{ message: '…' }` objects.

## Template-specific notes

**Submitting with React Query.** `onSubmit` awaits the mutation; success/error
handling lives on the mutation (see `features/products/components/product-form.tsx`):

```tsx
onSubmit: async ({ value }) => {
  await createMutation.mutateAsync(value);
};
```

**Sheet / Dialog forms.** The submit button lives in the footer, outside the
`<form>` element, connected via the HTML `form` attribute
(`features/users/components/user-form-sheet.tsx`):

```tsx
<form id='user-form-sheet' onSubmit={…}>…</form>
<SheetFooter>
  <Button type='submit' form='user-form-sheet'>Save</Button>
</SheetFooter>
```

**Multi-step forms.** `useFormStepper(stepSchemas, { fullSchema })` from
`@/hooks/use-stepper` gates step navigation: `Next` validates the current
step's schema and paints its errors; the final submit re-validates the whole
schema and never submits invalid data. Route every submit through the gate —
see `features/forms/components/multi-step-product-form.tsx`.

**Number inputs.** `TextField type='number'` already converts at the edge;
give required numbers a human message: `z.number({ error: 'Price is required' })`.

**A caveat to know.** `field.XxxField` components assert their value type via
`useFieldContext<T>()` — the compiler checks the `name` path exists, but not
that the widget matches the path's value type (a `SwitchField` on a string
path compiles and misbehaves). Match widgets to the table above.

## Examples in the dashboard

| Page | Route | Demonstrates |
| --- | --- | --- |
| Basic Form | `/dashboard/forms/basic` | All 16 field components incl. array-mode groups, pickers, OTP, tags, upload |
| Advanced | `/dashboard/forms/advanced` | Async validation, linked fields (`onChangeListenTo`), nested paths, raw `form.Field` object-row arrays, listener side effects |
| Multi-Step | `/dashboard/forms/multi-step` | Per-step schemas, validation gate, review step |
| Sheet Form | `/dashboard/forms/sheet-form` | Sheet + Dialog forms with external submit buttons |
