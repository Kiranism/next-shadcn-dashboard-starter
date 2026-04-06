'use client';

import { useState } from 'react';
import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from '@/components/ui/sheet';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Icons } from '@/components/icons';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type SheetFormValues = {
  name: string;
  category: string;
  price: number | undefined;
  description: string;
};

type DialogFormValues = {
  rating: number;
  feedback: string;
};

// ---------------------------------------------------------------------------
// Options
// ---------------------------------------------------------------------------

const categoryOptions = [
  { value: 'beauty', label: 'Beauty Products' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'sports', label: 'Sports & Outdoors' }
];

// ---------------------------------------------------------------------------
// Sheet Form
// ---------------------------------------------------------------------------

function SheetFormSection() {
  const [open, setOpen] = useState(false);

  const form = useAppForm({
    defaultValues: {
      name: '',
      category: '',
      price: undefined,
      description: ''
    } as SheetFormValues,
    onSubmit: ({ value }) => {
      toast.success('Product created successfully!', {
        description: `${value.name} has been added.`
      });
      setOpen(false);
      form.reset();
    }
  });

  const { FormTextField, FormSelectField, FormTextareaField } = useFormFields<SheetFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sheet Form</CardTitle>
        <CardDescription>
          A product creation form inside a Sheet. The submit button lives in the SheetFooter,
          outside the form element, connected via the HTML{' '}
          <code className='bg-muted rounded px-1 text-sm'>form</code> attribute.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button>
              <Icons.add className='mr-2 h-4 w-4' />
              Add Product
            </Button>
          </SheetTrigger>
          <SheetContent className='flex flex-col'>
            <SheetHeader>
              <SheetTitle>New Product</SheetTitle>
              <SheetDescription>
                Fill in the details below to create a new product.
              </SheetDescription>
            </SheetHeader>

            <ScrollArea className='flex-1'>
              <form.AppForm>
                <form.Form id='sheet-form-id' className='space-y-4 p-0 md:p-0'>
                  <FormTextField
                    name='name'
                    label='Product Name'
                    required
                    placeholder='Enter product name'
                    validators={{
                      onBlur: z.string().min(2, 'Product name must be at least 2 characters')
                    }}
                  />

                  <FormSelectField
                    name='category'
                    label='Category'
                    required
                    options={categoryOptions}
                    placeholder='Select a category'
                    validators={{
                      onBlur: z.string().min(1, 'Please select a category')
                    }}
                  />

                  <FormTextField
                    name='price'
                    label='Price'
                    required
                    type='number'
                    min={0}
                    step='0.01'
                    placeholder='0.00'
                    validators={{
                      onBlur: z.number().min(0.01, 'Price must be greater than 0')
                    }}
                  />

                  <FormTextareaField
                    name='description'
                    label='Description'
                    required
                    placeholder='Enter product description'
                    maxLength={500}
                    rows={4}
                    validators={{
                      onBlur: z.string().min(10, 'Description must be at least 10 characters')
                    }}
                  />
                </form.Form>
              </form.AppForm>
            </ScrollArea>

            <SheetFooter className='pt-4'>
              <Button type='button' variant='outline' onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' form='sheet-form-id'>
                Create Product
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Dialog Form
// ---------------------------------------------------------------------------

function DialogFormSection() {
  const [open, setOpen] = useState(false);

  const form = useAppForm({
    defaultValues: {
      rating: 5,
      feedback: ''
    } as DialogFormValues,
    onSubmit: ({ value }) => {
      toast.success('Feedback submitted!', {
        description: `Rating: ${value.rating}/10. Thank you!`
      });
      setOpen(false);
      form.reset();
    }
  });

  const { FormSliderField, FormTextareaField } = useFormFields<DialogFormValues>();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dialog Form</CardTitle>
        <CardDescription>
          A quick feedback form inside a Dialog. Uses composed field components from{' '}
          <code className='bg-muted rounded px-1 text-sm'>useFormFields</code> with the submit
          button in the DialogFooter.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant='outline'>
              <Icons.send className='mr-2 h-4 w-4' />
              Send Feedback
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quick Feedback</DialogTitle>
              <DialogDescription>Rate your experience and leave a comment.</DialogDescription>
            </DialogHeader>

            <form.AppForm>
              <form.Form id='dialog-form-id' className='space-y-4 py-2'>
                <FormSliderField
                  name='rating'
                  label='Rating'
                  description='Rate your experience (0-10)'
                  min={0}
                  max={10}
                  step={1}
                />

                <FormTextareaField
                  name='feedback'
                  label='Feedback'
                  required
                  placeholder='Tell us what you think...'
                  maxLength={300}
                  rows={3}
                  validators={{
                    onBlur: z.string().min(5, 'Feedback must be at least 5 characters')
                  }}
                />
              </form.Form>
            </form.AppForm>

            <DialogFooter>
              <Button type='button' variant='outline' onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type='submit' form='dialog-form-id'>
                Submit Feedback
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Toast Demo
// ---------------------------------------------------------------------------

function ToastDemoSection() {
  return (
    <Card className='md:col-span-2'>
      <CardHeader>
        <CardTitle>Toast Notifications</CardTitle>
        <CardDescription>
          Trigger different toast variants to preview notification styles.
        </CardDescription>
      </CardHeader>
      <CardContent className='flex flex-wrap gap-2'>
        <Button variant='outline' onClick={() => toast('Default toast notification')}>
          Default
        </Button>
        <Button variant='outline' onClick={() => toast.success('Action completed successfully!')}>
          <Icons.circleCheck className='mr-2 h-4 w-4' />
          Success
        </Button>
        <Button variant='outline' onClick={() => toast.error('Something went wrong.')}>
          <Icons.circleX className='mr-2 h-4 w-4' />
          Error
        </Button>
        <Button variant='outline' onClick={() => toast.warning('Please review before continuing.')}>
          <Icons.warning className='mr-2 h-4 w-4' />
          Warning
        </Button>
        <Button variant='outline' onClick={() => toast.info('Here is some useful information.')}>
          <Icons.info className='mr-2 h-4 w-4' />
          Info
        </Button>
        <Button
          variant='outline'
          onClick={() =>
            toast.promise(new Promise((resolve) => setTimeout(resolve, 2000)), {
              loading: 'Loading...',
              success: 'Data loaded!',
              error: 'Failed to load.'
            })
          }
        >
          <Icons.spinner className='mr-2 h-4 w-4' />
          Promise
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Main Demo
// ---------------------------------------------------------------------------

export default function SheetFormDemo() {
  return (
    <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
      <SheetFormSection />
      <DialogFormSection />
      <ToastDemoSection />
    </div>
  );
}
