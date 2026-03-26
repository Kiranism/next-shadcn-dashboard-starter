'use client';

import * as React from 'react';
import { useAppForm, withFieldGroup } from '@/components/ui/tanstack-form';
import { revalidateLogic, useStore } from '@tanstack/react-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { Icons } from '@/components/icons';
import { FieldDescription } from '@/components/ui/field';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'motion/react';
import { useFormStepper } from '@/hooks/use-stepper';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

// --- Schema ---

const productFormSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  category: z.string().min(1, 'Please select a category'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
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

// --- Step Groups ---

const categoryOptions = [
  { value: 'beauty', label: 'Beauty Products' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'sports', label: 'Sports & Outdoors' }
];

const Step1Group = withFieldGroup({
  defaultValues: {
    name: '',
    category: '',
    price: undefined as number | undefined
  },
  render: function Step1Render({ group }) {
    return (
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Basic Info</h3>
        <FieldDescription>
          Enter the product name, category, and price.
        </FieldDescription>

        <group.AppField name='name'>
          {(field) => (
            <field.TextField
              label='Product Name'
              required
              placeholder='Enter product name'
            />
          )}
        </group.AppField>

        <group.AppField name='category'>
          {(field) => (
            <field.SelectField
              label='Category'
              required
              options={categoryOptions}
              placeholder='Select category'
            />
          )}
        </group.AppField>

        <group.AppField name='price'>
          {(field) => (
            <field.TextField
              label='Price'
              required
              type='number'
              min={0}
              step={0.01}
              placeholder='Enter price'
            />
          )}
        </group.AppField>
      </div>
    );
  }
});

const Step2Group = withFieldGroup({
  defaultValues: {
    description: ''
  },
  render: function Step2Render({ group }) {
    return (
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Details</h3>
        <FieldDescription>Add a detailed product description.</FieldDescription>

        <group.AppField name='description'>
          {(field) => (
            <field.TextareaField
              label='Description'
              required
              placeholder='Enter product description'
              maxLength={500}
              rows={5}
            />
          )}
        </group.AppField>
      </div>
    );
  }
});

const Step3Group = withFieldGroup({
  defaultValues: {},
  render: function Step3Render() {
    return (
      <div className='space-y-4'>
        <h3 className='text-lg font-semibold'>Review & Submit</h3>
        <FieldDescription>
          Review the details below before submitting.
        </FieldDescription>
      </div>
    );
  }
});

// --- Review component (reads form values) ---

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
          <p className='text-muted-foreground text-xs font-medium uppercase'>
            Name
          </p>
          <p className='text-sm'>{values.name || '—'}</p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>
            Category
          </p>
          <p className='text-sm capitalize'>{values.category || '—'}</p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>
            Price
          </p>
          <p className='text-sm'>
            {values.price != null ? `$${values.price}` : '—'}
          </p>
        </div>
        <div>
          <p className='text-muted-foreground text-xs font-medium uppercase'>
            Description
          </p>
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
  } = useFormStepper(stepSchemas);

  const form = useAppForm({
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
    onSubmit: ({ value }) => {
      console.log('Multi-step form submitted:', value);
      toast.success('Product created successfully!');
    }
  });

  const isDefault = useStore(form.store, (state) => state.isDefaultValue);
  const formValues = useStore(form.store, (state) => state.values);

  const groups: Record<number, React.ReactNode> = {
    1: (
      <Step1Group
        form={form}
        fields={{ name: 'name', category: 'category', price: 'price' }}
      />
    ),
    2: <Step2Group form={form} fields={{ description: 'description' }} />,
    3: (
      <>
        <Step3Group form={form} fields={{}} />
        <ReviewSummary values={formValues} />
      </>
    )
  };

  const handleNext = async () => {
    await handleNextStepOrSubmit(form);
  };

  const current = groups[currentStep];

  return (
    <form.AppForm>
      <form.Form className='p-0 md:p-0'>
        <div className='flex flex-col gap-2 pt-3'>
          <div className='flex flex-col items-center justify-start gap-1'>
            <span className='text-muted-foreground text-sm'>
              Step {currentStep} of {Object.keys(groups).length}
            </span>
            <Progress
              value={(currentStep / Object.keys(groups).length) * 100}
            />
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
              {current}
            </motion.div>
          </AnimatePresence>

          <div className='flex w-full items-center justify-between gap-3 pt-3'>
            <form.StepButton
              label={
                <>
                  <Icons.chevronLeft /> Previous
                </>
              }
              disabled={isFirstStep}
              handleMovement={() =>
                handleCancelOrBack({
                  onBack: () => {}
                })
              }
            />
            {step.isCompleted ? (
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
                <form.SubmitButton label='Submit' />
              </div>
            ) : (
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
                <form.StepButton
                  label={
                    <>
                      Next <Icons.chevronRight />
                    </>
                  }
                  handleMovement={handleNext}
                />
              </div>
            )}
          </div>
        </div>
      </form.Form>
    </form.AppForm>
  );
}
