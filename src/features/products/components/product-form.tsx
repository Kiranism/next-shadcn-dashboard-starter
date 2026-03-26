'use client';

import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product } from '@/constants/mock-api';
import { useRouter } from 'next/navigation';
import * as z from 'zod';
import {
  productSchema,
  type ProductFormValues
} from '@/features/products/schemas/product';
import { categoryOptions } from '@/features/products/constants/product-options';

export default function ProductForm({
  initialData,
  pageTitle
}: {
  initialData: Product | null;
  pageTitle: string;
}) {
  const router = useRouter();

  const form = useAppForm({
    defaultValues: {
      image: undefined,
      name: initialData?.name ?? '',
      category: initialData?.category ?? '',
      price: initialData?.price,
      description: initialData?.description ?? ''
    } as ProductFormValues,
    validators: {
      onSubmit: productSchema
    },
    onSubmit: ({ value }) => {
      console.log(value);
      router.push('/dashboard/product');
    }
  });

  const {
    FormTextField,
    FormSelectField,
    FormTextareaField,
    FormFileUploadField
  } = useFormFields<ProductFormValues>();

  return (
    <Card className='mx-auto w-full'>
      <CardHeader>
        <CardTitle className='text-left text-2xl font-bold'>
          {pageTitle}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='space-y-8'>
            <FormFileUploadField
              name='image'
              label='Product Image'
              description='Upload a product image'
              maxSize={5 * 1024 * 1024}
              maxFiles={4}
            />

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <FormTextField
                name='name'
                label='Product Name'
                required
                placeholder='Enter product name'
                validators={{
                  onBlur: z
                    .string()
                    .min(2, 'Product name must be at least 2 characters.')
                }}
              />

              <FormSelectField
                name='category'
                label='Category'
                required
                options={categoryOptions}
                placeholder='Select category'
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
                step={0.01}
                placeholder='Enter price'
                validators={{
                  onBlur: z.number({ message: 'Price is required' })
                }}
              />
            </div>

            <FormTextareaField
              name='description'
              label='Description'
              required
              placeholder='Enter product description'
              maxLength={500}
              rows={4}
              validators={{
                onBlur: z
                  .string()
                  .min(10, 'Description must be at least 10 characters.')
              }}
            />

            <form.SubmitButton label='Add Product' />
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
