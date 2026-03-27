# Forms Guide

## Table of Contents

1. [Architecture](#architecture)
2. [Field Types](#field-types)
3. [Usage Patterns](#usage-patterns)
4. [Validation Strategies](#validation-strategies)
5. [Sheet/Dialog Forms](#sheetdialog-forms)
6. [Multi-Step Forms](#multi-step-forms)
7. [Advanced Patterns](#advanced-patterns)

---

## Architecture

The form system is built on **TanStack Form + Zod** with a composable field layer.

**Key files:**

- `src/components/ui/tanstack-form.tsx` — exports `useAppForm`, `useFormFields<T>()`, composed fields
- `src/components/ui/form-context.tsx` — contexts, `createFormField`, structural components
- `src/components/forms/fields/*.tsx` — 8 field type implementations

**Key exports:**

```tsx
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
```

- `useAppForm(config)` — creates a form instance with `defaultValues`, `validators`, `onSubmit`
- `useFormFields<T>()` — returns all 8 typed field components with name autocomplete from `T`
- `form.AppForm` — context provider wrapper
- `form.Form` — `<form>` element that handles submit
- `form.SubmitButton` — auto-disabled when form is invalid or submitting
- `form.AppField` — low-level render prop for custom fields

---

## Field Types

All fields accept: `name`, `label`, `description`, `required`, `disabled`, `validators`, `listeners`, `className`.

| Component             | Props                                                                                         | Notes                                   |
| --------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------- |
| `FormTextField`       | `type` (text/email/number/password/tel/url), `placeholder`, `min`, `max`, `step`, `maxLength` | For numbers use `type='number'`         |
| `FormTextareaField`   | `placeholder`, `rows`, `maxLength`                                                            | Multiline text                          |
| `FormSelectField`     | `options: {value, label}[]`, `placeholder`                                                    | Single select dropdown                  |
| `FormCheckboxField`   | `options?: {value, label}[]`                                                                  | Single checkbox or multi-checkbox group |
| `FormSwitchField`     | —                                                                                             | Toggle switch                           |
| `FormRadioGroupField` | `options: {value, label}[]`, `orientation`                                                    | Radio button group                      |
| `FormSliderField`     | `min`, `max`, `step`                                                                          | Range slider                            |
| `FormFileUploadField` | `maxSize`, `maxFiles`, `accept`                                                               | Drag-and-drop with preview              |

---

## Usage Patterns

### Pattern 1: `useFormFields<T>()` (Recommended)

Type-safe field components with name autocomplete:

```tsx
const { FormTextField, FormSelectField } = useFormFields<OrderFormValues>();

<FormTextField name='customer' label='Customer' required placeholder='Name'
  validators={{ onBlur: z.string().min(2) }} />

<FormSelectField name='status' label='Status' required options={STATUS_OPTIONS}
  validators={{ onBlur: z.string().min(1) }} />
```

### Pattern 2: `form.AppField` render prop

Full control for custom field rendering:

```tsx
<form.AppField name='framework'>
  {(field) => (
    <field.FieldSet>
      <field.Field>
        <field.TextField label='Framework' />
      </field.Field>
      <field.FieldError />
    </field.FieldSet>
  )}
</form.AppField>
```

### Pattern 3: Direct import (no type safety)

For quick prototyping:

```tsx
import { FormTextField } from '@/components/ui/tanstack-form';
<FormTextField name='name' label='Name' />;
```

---

## Validation Strategies

### Field-level (recommended for UX)

```tsx
<FormTextField
  name='email'
  label='Email'
  validators={{
    onBlur: z.string().email('Invalid email') // Validates when field loses focus
  }}
/>
```

### Form-level (catch-all on submit)

```tsx
const form = useAppForm({
  validators: { onSubmit: orderSchema }, // Validates entire form on submit
  onSubmit: async ({ value }) => {
    /* ... */
  }
});
```

### Async validation (server-side checks)

```tsx
<FormTextField
  name='username'
  label='Username'
  validators={{
    onChangeAsync: async ({ value }) => {
      const exists = await checkUsername(value);
      return exists ? 'Username taken' : undefined;
    }
  }}
  asyncDebounceMs={500}
/>
```

### Linked field validation

For dependent fields (e.g., confirm password):

```tsx
<FormTextField
  name='confirmPassword'
  label='Confirm Password'
  validators={{
    onChangeListenTo: ['password'],
    onChange: ({ value, fieldApi }) => {
      const password = fieldApi.form.getFieldValue('password');
      return value !== password ? 'Passwords must match' : undefined;
    }
  }}
/>
```

---

## Sheet/Dialog Forms

The key pattern for forms inside sheets or dialogs: give the `<form.Form>` an `id`, and use that `id` on the submit button's `form` attribute. This allows the submit button to live outside the form element (e.g., in `SheetFooter`).

```tsx
<form.AppForm>
  <form.Form id='my-sheet-form' className='space-y-4'>
    {/* fields */}
  </form.Form>
</form.AppForm>;

{
  /* In SheetFooter — button is outside the <form> but still submits it */
}
<SheetFooter>
  <Button type='submit' form='my-sheet-form'>
    Save
  </Button>
</SheetFooter>;
```

On success, call `onOpenChange(false)` to close the sheet and `form.reset()` for create forms.

---

## Multi-Step Forms

Use `withFieldGroup` + `useAppForm` with `StepButton`:

```tsx
// Define field groups for each step
const Step1 = withFieldGroup({
  fields: ['name', 'email'],
  render: ({ form }) => {
    const { FormTextField } = useFormFields<FormValues>();
    return (
      <>
        <FormTextField name='name' label='Name' />
        <FormTextField name='email' label='Email' />
        <form.StepButton direction='next' label='Next' />
      </>
    );
  }
});

const Step2 = withFieldGroup({
  fields: ['address', 'city'],
  render: ({ form }) => {
    const { FormTextField } = useFormFields<FormValues>();
    return (
      <>
        <FormTextField name='address' label='Address' />
        <FormTextField name='city' label='City' />
        <form.StepButton direction='prev' label='Back' />
        <form.SubmitButton label='Submit' />
      </>
    );
  }
});
```

Use the `useStepper` hook from `src/hooks/use-stepper.tsx` to manage step state.

---

## Advanced Patterns

### Nested objects (dot notation)

```tsx
<FormTextField name='address.street' label='Street' />
<FormTextField name='address.city' label='City' />
```

### Dynamic array rows

```tsx
<form.AppField name='items' mode='array'>
  {(field) => (
    <>
      {field.state.value.map((_, i) => (
        <form.AppField key={i} name={`items[${i}].name`}>
          {(subField) => <subField.TextField label={`Item ${i + 1}`} />}
        </form.AppField>
      ))}
      <Button onClick={() => field.pushValue({ name: '' })}>Add Row</Button>
    </>
  )}
</form.AppField>
```

### Side effects with listeners

```tsx
<FormSelectField
  name='country'
  label='Country'
  options={countryOptions}
  listeners={{
    onChange: ({ value }) => {
      // Reset city when country changes
      form.setFieldValue('city', '');
    }
  }}
/>
```

### Custom field with `form.AppField`

For fields not covered by the built-in 8 types:

```tsx
<form.AppField name='color'>
  {(field) => (
    <field.FieldSet>
      <Label>Pick a color</Label>
      <field.Field>
        <input
          type='color'
          value={field.state.value}
          onChange={(e) => field.handleChange(e.target.value)}
        />
      </field.Field>
      <field.FieldError />
    </field.FieldSet>
  )}
</form.AppField>
```

### Form-level errors

Display errors that apply to the whole form (e.g., server errors):

```tsx
import { FormErrors } from '@/components/ui/form-context';

<form.AppForm>
  <form.Form>
    <FormErrors /> {/* Renders form-level validation errors */}
    {/* fields... */}
  </form.Form>
</form.AppForm>;
```
