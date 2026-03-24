import {
  createFormHook,
  createFormHookContexts,
  revalidateLogic,
  useStore
} from '@tanstack/react-form';
import type { VariantProps } from 'class-variance-authority';
import * as React from 'react';
import { Button, type buttonVariants } from '@/components/ui/button';
import {
  Field as DefaultField,
  FieldError as DefaultFieldError,
  FieldSet as DefaultFieldSet,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldTitle,
  fieldVariants
} from '@/components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput
} from '@/components/ui/input-group';
import { Spinner } from '@/components/ui/spinner';
import { cn } from '@/lib/utils';

const {
  fieldContext,
  formContext,
  useFieldContext: _useFieldContext,
  useFormContext
} = createFormHookContexts();

const { useAppForm, withForm, withFieldGroup } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: {
    Field,
    FieldError,
    FieldSet,
    FieldContent,
    FieldDescription,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldSeparator,
    FieldTitle,
    InputGroup,
    InputGroupAddon,
    InputGroupInput
  },
  formComponents: {
    SubmitButton,
    StepButton,
    FieldLegend,
    FieldDescription,
    FieldSeparator,
    Form
  }
});

type FormItemContextValue = {
  id: string;
};

const FormItemContext = React.createContext<FormItemContextValue>(
  {} as FormItemContextValue
);

function FieldSet({
  className,
  children,
  ...props
}: React.ComponentProps<'fieldset'>) {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <DefaultFieldSet className={cn('grid gap-1', className)} {...props}>
        {children}
      </DefaultFieldSet>
    </FormItemContext.Provider>
  );
}

const useFieldContext = () => {
  const { id } = React.useContext(FormItemContext);
  const { name, store, ...fieldContext } = _useFieldContext();

  const errors = useStore(store, (state) => state.meta.errors);
  if (!fieldContext) {
    throw new Error('useFieldContext should be used within <FormItem>');
  }

  return {
    id,
    name,
    formItemId: `${id}-form-item`,
    formDescriptionId: `${id}-form-item-description`,
    formMessageId: `${id}-form-item-message`,
    errors,
    store,
    ...fieldContext
  };
};

function Field({
  children,
  ...props
}: React.ComponentProps<'div'> & VariantProps<typeof fieldVariants>) {
  const {
    errors,
    formItemId,
    formDescriptionId,
    formMessageId,
    handleBlur,
    store
  } = useFieldContext();
  const isTouched = useStore(store, (state) => state.meta.isTouched);
  const hasVisibleErrors = !!errors.length && isTouched;

  return (
    <DefaultField
      data-invalid={hasVisibleErrors}
      id={formItemId}
      onBlur={handleBlur}
      aria-describedby={
        !hasVisibleErrors
          ? `${formDescriptionId}`
          : `${formDescriptionId} ${formMessageId}`
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
  const isTouched = useStore(store, (state) => state.meta.isTouched);
  if (!errors.length || !isTouched) return null;
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

function Form({
  children,
  ...props
}: Omit<React.ComponentPropsWithoutRef<'form'>, 'onSubmit' | 'noValidate'> & {
  children?: React.ReactNode;
}) {
  const form = useFormContext();
  const handleSubmit = React.useCallback(
    (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      e.stopPropagation();
      form.handleSubmit();
    },
    [form]
  );
  return (
    <form
      onSubmit={handleSubmit}
      className={cn(
        'mx-auto flex w-full flex-col gap-2 p-2 md:p-5',
        props.className
      )}
      noValidate
      {...props}
    >
      {children}
    </form>
  );
}

function SubmitButton({
  label,
  className,
  size,
  ...props
}: React.ComponentProps<'button'> &
  VariantProps<typeof buttonVariants> & {
    label: string;
  }) {
  const form = useFormContext();
  return (
    <form.Subscribe
      selector={(state) => [state.canSubmit, state.isSubmitting] as const}
    >
      {([canSubmit, isSubmitting]) => (
        <Button
          className={className}
          size={size}
          type='submit'
          disabled={!canSubmit}
          {...props}
        >
          {isSubmitting && <Spinner />}
          {label}
        </Button>
      )}
    </form.Subscribe>
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
    <Button
      size='sm'
      variant='ghost'
      type='button'
      onClick={handleMovement}
      {...props}
    >
      {label}
    </Button>
  );
}

export {
  revalidateLogic,
  useAppForm,
  useFieldContext,
  useFormContext,
  withFieldGroup,
  withForm
};
