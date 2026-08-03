'use client';

import * as React from 'react';
import { revalidateLogic, useForm, useStore } from '@tanstack/react-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Icons } from '@/components/icons';
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'motion/react';
import { useFormStepper } from '@/hooks/use-stepper';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// --- Schema ---

const productFormSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  category: z.string().min(1, 'Please select a category'),
  price: z.number({ error: 'Price is required' }).min(0.01, 'Price must be greater than 0'),
  description: z.string().min(10, 'Description must be at least 10 characters')
});

const stepSchemas = [
  // Step 1: Basic Info
  productFormSchema.pick({ name: true, category: true, price: true }),
  // Step 2: Details
  productFormSchema.pick({ description: true }),
  // Step 3: Review (no validation)
  z.object({})
];

const categoryOptions = [
  { value: 'beauty', label: 'Beauty Products' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'sports', label: 'Sports & Outdoors' }
];

// --- Review summary (reads form values) ---

function ReviewSummary({
  values
}: {
  values: {
    name: string;
    category: string;
    price?: number;
    description: string;
  };
}) {
  return (
    <div className='space-y-3'>
      <Separator />
      <div className='grid gap-3'>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>Name</p>
          <p className='text-sm'>{values.name || '—'}</p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>Category</p>
          <p className='text-sm capitalize'>{values.category || '—'}</p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>Price</p>
          <p className='text-sm'>{values.price != null ? `$${values.price}` : '—'}</p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>Description</p>
          <p className='text-sm'>{values.description || '—'}</p>
        </div>
      </div>
    </div>
  );
}

// --- Main Form ---

type ProductFormValues = {
  name: string;
  category: string;
  price: number | undefined;
  description: string;
};

export default function MultiStepProductForm() {
  const {
    currentValidator,
    step,
    currentStep,
    isFirstStep,
    handleCancelOrBack,
    handleNextStepOrSubmit
  } = useFormStepper(stepSchemas, { fullSchema: productFormSchema });

  const form = useForm({
    defaultValues: {
      name: '',
      category: '',
      price: undefined,
      description: ''
    } as ProductFormValues,
    validationLogic: revalidateLogic(),
    validators: {
      onDynamic: currentValidator as typeof productFormSchema,
      onDynamicAsyncDebounceMs: 500
    },
    onSubmit: () => {
      toast.success('Product created successfully!');
    }
  });

  const isDefault = useStore(form.store, (state) => state.isDefaultValue);
  const formValues = useStore(form.store, (state) => state.values);

  const handleNext = async () => {
    await handleNextStepOrSubmit(form);
  };

  const totalSteps = 3;

  return (
    /* Every submit (Enter key, the review step's submit button) routes
       through the stepper gate — calling form.handleSubmit directly on a
       non-final step would validate only that step's schema and submit. */
    <form
      onSubmit={(e) => {
        e.preventDefault();
        e.stopPropagation();
        void handleNext();
      }}
      noValidate
      className='mx-auto flex w-full flex-col gap-2 p-0'
    >
      <div className='flex flex-col gap-2 pt-3'>
        <div className='flex flex-col items-center justify-start gap-1'>
          <span className='text-muted-foreground text-sm'>
            Step {currentStep} of {totalSteps}
          </span>
          <Progress value={(currentStep / totalSteps) * 100} />
        </div>

        <AnimatePresence mode='popLayout'>
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -15 }}
            transition={{ duration: 0.4, type: 'spring' }}
            className='flex flex-col gap-2'
          >
            {currentStep === 1 && (
              <FieldGroup className='space-y-4'>
                <h3 className='text-lg font-semibold'>Basic Info</h3>
                <FieldDescription>Enter the product name, category, and price.</FieldDescription>

                <form.Field
                  name='name'
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Product Name *</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder='Enter product name'
                          aria-invalid={isInvalid}
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                />

                <form.Field
                  name='category'
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Category *</FieldLabel>
                        <Select
                          name={field.name}
                          value={field.state.value}
                          onValueChange={(value) => field.handleChange(value ?? '')}
                        >
                          <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                            <SelectValue placeholder='Select category' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              {categoryOptions.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                  {opt.label}
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                />

                <form.Field
                  name='price'
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Price *</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type='number'
                          min={0}
                          step={0.01}
                          value={field.state.value ?? ''}
                          onBlur={field.handleBlur}
                          onChange={(e) =>
                            field.handleChange(
                              e.target.value === '' ? undefined : Number(e.target.value)
                            )
                          }
                          placeholder='Enter price'
                          aria-invalid={isInvalid}
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                />
              </FieldGroup>
            )}

            {currentStep === 2 && (
              <FieldGroup className='space-y-4'>
                <h3 className='text-lg font-semibold'>Details</h3>
                <FieldDescription>Add a detailed product description.</FieldDescription>

                <form.Field
                  name='description'
                  children={(field) => {
                    const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Description *</FieldLabel>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder='Enter product description'
                          maxLength={500}
                          rows={5}
                          aria-invalid={isInvalid}
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    );
                  }}
                />
              </FieldGroup>
            )}

            {currentStep === 3 && (
              <div className='space-y-4'>
                <h3 className='text-lg font-semibold'>Review & Submit</h3>
                <FieldDescription>Review the details below before submitting.</FieldDescription>
                <ReviewSummary values={formValues} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className='flex w-full items-center justify-between gap-3 pt-3'>
          <Button
            size='sm'
            variant='ghost'
            type='button'
            disabled={isFirstStep}
            onClick={() => handleCancelOrBack({ onBack: () => {} })}
          >
            <Icons.chevronLeft /> Previous
          </Button>
          <div className='flex w-full items-center justify-end gap-3 pt-3'>
            {!isDefault && (
              <Button
                type='button'
                onClick={() => form.reset()}
                className='rounded-lg'
                variant='outline'
                size='sm'
              >
                Reset
              </Button>
            )}
            {step.isCompleted ? (
              <Button type='submit'>Submit</Button>
            ) : (
              <Button size='sm' variant='ghost' type='button' onClick={() => void handleNext()}>
                Next <Icons.chevronRight />
              </Button>
            )}
          </div>
        </div>
      </div>
    </form>
  );
}
