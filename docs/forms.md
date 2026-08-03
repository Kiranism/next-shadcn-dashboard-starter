# Forms

Forms follow the **official shadcn TanStack Form conventions** — no custom
abstraction layer. Read the upstream guide first; everything in this repo is
written exactly that way:

- [shadcn: TanStack Form](https://ui.shadcn.com/docs/forms/tanstack) — the
  anatomy every form here uses
- [TanStack Form docs](https://tanstack.com/form/latest) — validators,
  listeners, arrays, async validation

## The pattern

One `useForm` per form, a Zod schema validated on submit, and one
`form.Field` render prop per field composed from the `Field` primitives in
`@/components/ui/field`:

```tsx
'use client';

import { useForm } from '@tanstack/react-form';
import * as z from 'zod';
import { Field, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const formSchema = z.object({
  title: z.string().min(5, 'Title must be at least 5 characters.')
});

export function BugReportForm() {
  const form = useForm({
    defaultValues: { title: '' },
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
        <form.Field
          name='title'
          children={(field) => {
            const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
            return (
              <Field data-invalid={isInvalid}>
                <FieldLabel htmlFor={field.name}>Bug Title</FieldLabel>
                <Input
                  id={field.name}
                  name={field.name}
                  value={field.state.value}
                  onBlur={field.handleBlur}
                  onChange={(e) => field.handleChange(e.target.value)}
                  aria-invalid={isInvalid}
                />
                {isInvalid && <FieldError errors={field.state.meta.errors} />}
              </Field>
            );
          }}
        />
      </FieldGroup>
      <Button type='submit'>Submit</Button>
    </form>
  );
}
```

The conventions, per the shadcn doc:

- `data-invalid` on `<Field>`, `aria-invalid` on the control.
- `{isInvalid && <FieldError errors={field.state.meta.errors} />}` inside the
  `<Field>`.
- Checkbox groups and dynamic lists use `mode='array'` with
  `field.pushValue` / `field.removeValue`.
- Radio/checkbox groups wrap in `<FieldSet>` + `<FieldLegend variant='label'>`.
- Function validators return `{ message: '…' }` objects so `<FieldError>` can
  render them.

## Template-specific notes

**Number inputs.** Controls emit strings; convert at the edge and let the
schema report missing values with a human message:

```tsx
onChange={(e) => field.handleChange(e.target.value === '' ? undefined : Number(e.target.value))}
// schema: z.number({ error: 'Price is required' }).min(0.01, '…')
```

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
schema and never submits invalid data. Route every submit through the gate
with a plain `<form onSubmit={…handleNextStepOrSubmit(form)}>` — see
`features/forms/components/multi-step-product-form.tsx`.

**Stateful controls.** Never call `useState` inside a `form.Field` render
prop (it is not a component). Extract the control into a page-local component
and pass the field API in — see `FrameworkCombobox` in
`components/forms/demo-form.tsx`.

## Examples in the dashboard

| Page | Route | Demonstrates |
| --- | --- | --- |
| Basic Form | `/dashboard/forms/basic` | Every input type in the doc anatomy: text, number, select, combobox, checkbox group (array mode), radio, switch, slider, date/range pickers, OTP, tags, file upload |
| Advanced | `/dashboard/forms/advanced` | Async validation, linked fields (`onChangeListenTo`), nested objects, dynamic array rows, listener side effects |
| Multi-Step | `/dashboard/forms/multi-step` | Per-step schemas, validation gate, review step |
| Sheet Form | `/dashboard/forms/sheet-form` | Sheet + Dialog forms with external submit buttons |
