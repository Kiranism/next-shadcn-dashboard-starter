'use client';

import { useState } from 'react';
import { useAppForm } from '@/lib/form';
import * as z from 'zod';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { FieldGroup } from '@/components/ui/field';
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
import { Icons } from '@/components/icons';

// ---------------------------------------------------------------------------
// Schemas
// ---------------------------------------------------------------------------

const sheetFormSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  category: z.string().min(1, 'Please select a category'),
  price: z.number({ error: 'Price is required' }).min(0.01, 'Price must be greater than 0'),
  description: z.string().min(10, 'Description must be at least 10 characters')
});

const dialogFormSchema = z.object({
  rating: z.number().min(0).max(10),
  feedback: z.string().min(5, 'Feedback must be at least 5 characters')
});

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
      price: undefined as number | undefined,
      description: ''
    },
    validators: {
      onSubmit: sheetFormSchema
    },
    onSubmit: ({ value }) => {
      toast.success('Product created successfully!', {
        description: `${value.name} has been added.`
      });
      setOpen(false);
      form.reset();
    }
  });

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
          <SheetTrigger render={<Button />}>
            <Icons.add className='mr-2 h-4 w-4' />
            Add Product
          </SheetTrigger>
          <SheetContent className='flex flex-col'>
            <SheetHeader>
              <SheetTitle>New Product</SheetTitle>
              <SheetDescription>
                Fill in the details below to create a new product.
              </SheetDescription>
            </SheetHeader>

            <form
              id='sheet-form-id'
              className='space-y-4 p-4 md:p-4'
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              <FieldGroup>
                <form.AppField
                  name='name'
                  children={(field) => (
                    <field.TextField
                      label='Product Name'
                      required
                      placeholder='Enter product name'
                    />
                  )}
                />

                <form.AppField
                  name='category'
                  children={(field) => (
                    <field.SelectField
                      label='Category'
                      required
                      options={categoryOptions}
                      placeholder='Select a category'
                    />
                  )}
                />

                <form.AppField
                  name='price'
                  children={(field) => (
                    <field.TextField
                      label='Price'
                      required
                      type='number'
                      min={0}
                      step='0.01'
                      placeholder='0.00'
                    />
                  )}
                />

                <form.AppField
                  name='description'
                  children={(field) => (
                    <field.TextareaField
                      label='Description'
                      required
                      placeholder='Enter product description'
                      maxLength={500}
                      rows={4}
                    />
                  )}
                />
              </FieldGroup>
            </form>

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
    },
    validators: {
      onSubmit: dialogFormSchema
    },
    onSubmit: ({ value }) => {
      toast.success('Feedback submitted!', {
        description: `Rating: ${value.rating}/10. Thank you!`
      });
      setOpen(false);
      form.reset();
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dialog Form</CardTitle>
        <CardDescription>
          A quick feedback form inside a Dialog with the submit button in the DialogFooter.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger render={<Button variant='outline' />}>
            <Icons.send className='mr-2 h-4 w-4' />
            Send Feedback
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Quick Feedback</DialogTitle>
              <DialogDescription>Rate your experience and leave a comment.</DialogDescription>
            </DialogHeader>

            <form
              id='dialog-form-id'
              className='space-y-4 py-2'
              onSubmit={(e) => {
                e.preventDefault();
                form.handleSubmit();
              }}
            >
              <FieldGroup>
                <form.AppField
                  name='rating'
                  children={(field) => (
                    <field.SliderField
                      label='Rating'
                      description='Rate your experience (0-10)'
                      min={0}
                      max={10}
                      step={1}
                    />
                  )}
                />

                <form.AppField
                  name='feedback'
                  children={(field) => (
                    <field.TextareaField
                      label='Feedback'
                      required
                      placeholder='Tell us what you think...'
                      maxLength={300}
                      rows={3}
                    />
                  )}
                />
              </FieldGroup>
            </form>

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
