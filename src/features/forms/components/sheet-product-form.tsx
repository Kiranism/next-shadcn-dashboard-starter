'use client';

import { useAppForm } from '@/components/ui/tanstack-form';
import * as z from 'zod';
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
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Icons } from '@/components/icons';
import { useState } from 'react';

const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  category: z.string().min(1, 'Please select a category'),
  price: z.number().min(0.01, 'Price must be greater than 0'),
  description: z.string().min(10, 'Description must be at least 10 characters')
});

const categoryOptions = [
  { value: 'beauty', label: 'Beauty Products' },
  { value: 'electronics', label: 'Electronics' },
  { value: 'home', label: 'Home & Garden' },
  { value: 'sports', label: 'Sports & Outdoors' }
];

export default function SheetProductForm() {
  const [open, setOpen] = useState(false);

  const form = useAppForm({
    defaultValues: {
      name: '',
      category: '',
      price: undefined as number | undefined,
      description: ''
    },
    validators: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any -- TanStack Form validator type mismatch with Zod
      onSubmit: productSchema as any
    },
    onSubmit: () => {
      alert('Product created successfully!');
      setOpen(false);
      form.reset();
    }
  });

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger render={<Button />}>
        <Icons.add className='mr-2 h-4 w-4' />
        Add Product
      </SheetTrigger>
      <SheetContent className='flex flex-col'>
        <SheetHeader>
          <SheetTitle>New Product</SheetTitle>
          <SheetDescription>Fill in the details to create a new product.</SheetDescription>
        </SheetHeader>

        <div className='flex-1 overflow-auto'>
          <form.AppForm>
            <form.Form id='sheet-product-form' className='space-y-4 p-4 md:p-4'>
              <form.AppField
                name='name'
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel htmlFor={field.name}>Product Name *</field.FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder='Enter product name'
                          aria-invalid={isInvalid}
                        />
                      </field.Field>
                      <field.FieldError />
                    </field.FieldSet>
                  );
                }}
              />

              <form.AppField
                name='category'
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel htmlFor={field.name}>Category *</field.FieldLabel>
                        <Select
                          items={categoryOptions}
                          name={field.name}
                          value={field.state.value}
                          onValueChange={(value) => field.handleChange(value ?? '')}
                        >
                          <SelectTrigger id={field.name} aria-invalid={isInvalid}>
                            <SelectValue placeholder='Select category' />
                          </SelectTrigger>
                          <SelectContent>
                            {categoryOptions.map((opt) => (
                              <SelectItem key={opt.value} value={opt.value}>
                                {opt.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </field.Field>
                      <field.FieldError />
                    </field.FieldSet>
                  );
                }}
              />

              <form.AppField
                name='price'
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel htmlFor={field.name}>Price *</field.FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          type='number'
                          min={0}
                          step='0.01'
                          value={field.state.value ?? ''}
                          onBlur={field.handleBlur}
                          onChange={(e) => {
                            const v = e.target.value;
                            field.handleChange(v === '' ? undefined : parseFloat(v));
                          }}
                          placeholder='Enter price'
                          aria-invalid={isInvalid}
                        />
                      </field.Field>
                      <field.FieldError />
                    </field.FieldSet>
                  );
                }}
              />

              <form.AppField
                name='description'
                children={(field) => {
                  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel htmlFor={field.name}>Description *</field.FieldLabel>
                        <Textarea
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder='Enter product description'
                          maxLength={500}
                          rows={4}
                          aria-invalid={isInvalid}
                        />
                        <div className='text-muted-foreground text-right text-sm'>
                          {field.state.value?.length || 0} / 500
                        </div>
                      </field.Field>
                      <field.FieldError />
                    </field.FieldSet>
                  );
                }}
              />
            </form.Form>
          </form.AppForm>
        </div>

        <SheetFooter>
          <Button type='button' variant='outline' onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type='submit' form='sheet-product-form'>
            Create Product
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
