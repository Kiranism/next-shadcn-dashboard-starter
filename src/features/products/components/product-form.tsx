'use client';

import { useAppForm } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { FileUploader } from '@/components/file-uploader';
import { Product } from '@/constants/mock-api';
import { useRouter } from 'next/navigation';
import * as z from 'zod';

const MAX_FILE_SIZE = 5000000;
const ACCEPTED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp'
];

const formSchema = z.object({
  image: z
    .any()
    .refine((files) => files?.length == 1, 'Image is required.')
    .refine(
      (files) => files?.[0]?.size <= MAX_FILE_SIZE,
      `Max file size is 5MB.`
    )
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      '.jpg, .jpeg, .png and .webp files are accepted.'
    ),
  name: z.string().min(2, {
    message: 'Product name must be at least 2 characters.'
  }),
  category: z.string(),
  price: z.number(),
  description: z.string().min(10, {
    message: 'Description must be at least 10 characters.'
  })
});

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
      image: undefined as any,
      name: initialData?.name || '',
      category: initialData?.category || '',
      price: initialData?.price || (undefined as number | undefined),
      description: initialData?.description || ''
    },
    validators: {
      onSubmit: formSchema as any
    },
    onSubmit: ({ value }) => {
      console.log(value);
      router.push('/dashboard/product');
    }
  });

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
            <form.AppField
              name='image'
              children={(field) => (
                <field.FieldSet>
                  <field.Field>
                    <field.FieldLabel>Product Image</field.FieldLabel>
                    <FileUploader
                      value={field.state.value}
                      onValueChange={field.handleChange}
                      maxSize={5 * 1024 * 1024}
                      maxFiles={4}
                    />
                  </field.Field>
                  <field.FieldError />
                </field.FieldSet>
              )}
            />

            <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
              <form.AppField
                name='name'
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel htmlFor={field.name}>
                          Product Name *
                        </field.FieldLabel>
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
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel htmlFor={field.name}>
                          Category *
                        </field.FieldLabel>
                        <Select
                          name={field.name}
                          value={field.state.value}
                          onValueChange={field.handleChange}
                        >
                          <SelectTrigger
                            id={field.name}
                            aria-invalid={isInvalid}
                          >
                            <SelectValue placeholder='Select category' />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value='beauty'>
                              Beauty Products
                            </SelectItem>
                            <SelectItem value='electronics'>
                              Electronics
                            </SelectItem>
                            <SelectItem value='home'>Home & Garden</SelectItem>
                            <SelectItem value='sports'>
                              Sports & Outdoors
                            </SelectItem>
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
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid;
                  return (
                    <field.FieldSet>
                      <field.Field>
                        <field.FieldLabel htmlFor={field.name}>
                          Price *
                        </field.FieldLabel>
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
                            field.handleChange(
                              v === '' ? undefined : parseFloat(v)
                            );
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
            </div>

            <form.AppField
              name='description'
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <field.FieldSet>
                    <field.Field>
                      <field.FieldLabel htmlFor={field.name}>
                        Description *
                      </field.FieldLabel>
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

            <Button type='submit'>Add Product</Button>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
