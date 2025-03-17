'use client';

import { FileUploader } from '@/components/file-uploader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LabelledComboBox } from '@/components/ui/combobox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SiteConfig } from '@/constants/site-config';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import {
  IBrand,
  ICategory,
  IProduct,
  IProductAttribute
} from 'types/schema/product.shema';
import * as z from 'zod';
import { useEffect, useMemo, useState, useTransition } from 'react';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import updateProduct from '@/app/(server)/actions/updateProduct';
import { useRouter } from 'next/navigation';
import RichTextEditor from '@/components/ui/rich-text-editor';
import { MultiSelect } from '@/components/ui/multi-select';

const MAX_FILE_SIZE = SiteConfig.featureFlags.maxFileSize;
const ACCEPTED_IMAGE_TYPES = SiteConfig.featureFlags.acceptedImageTypes;

// Base schema without thumbnail/gallery validation
const baseSchema = z.object({
  title: z.string().min(2, { message: 'Title must be at least 2 characters.' }),
  slug: z.string().min(1, { message: 'Slug is required.' }),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  productCode: z.string().min(1, { message: 'Product code is required.' }),
  regularPrice: z
    .number()
    .min(0, { message: 'Regular price must be non-negative.' }),
  discountPrice: z
    .number()
    .min(0, { message: 'Discount price must be non-negative.' })
    .optional(),
  quantity: z
    .number()
    .int()
    .min(0, { message: 'Quantity must be a non-negative integer.' }),
  description: z
    .string()
    .min(10, { message: 'Description must be at least 10 characters.' }),
  keyFeatures: z.string().optional(),
  specifications: z.string().optional(),
  thresholdAmount: z
    .number()
    .min(0, { message: 'Threshold amount must be non-negative.' })
    .optional(),
  category_id: z.string().min(1, { message: 'Category is required.' }),
  attribute_value_ids: z
    .array(z.string())
    .min(1, { message: 'At least one attribute is required.' }), // Updated validation
  brand_id: z.string().optional()
});

// File validation schema (applied conditionally)
const fileValidation = {
  thumbnail: z
    .any()
    .refine((files) => files?.length === 1, 'Thumbnail image is required.')
    .refine(
      (files) => files?.[0]?.size <= MAX_FILE_SIZE,
      `Max thumbnail size is 5MB.`
    )
    .refine(
      (files) => ACCEPTED_IMAGE_TYPES.includes(files?.[0]?.type),
      '.jpg, .jpeg, .png, and .webp files are accepted.'
    ),
  gallery: z
    .any()
    .refine((files) => files?.length >= 0, 'Gallery images are optional.')
    .refine(
      (files) => files?.every((file: File) => file.size <= MAX_FILE_SIZE),
      `Max gallery image size is 5MB.`
    )
    .refine(
      (files) =>
        files?.every((file: File) => ACCEPTED_IMAGE_TYPES.includes(file.type)),
      '.jpg, .jpeg, .png, and .webp files are accepted.'
    )
    .optional()
};

export default function ProductForm({
  initialData,
  brands,
  categories,
  attributes,
  pageTitle
}: {
  initialData?: IProduct;
  pageTitle: string;
  brands: IBrand[];
  categories: ICategory[];
  attributes: IProductAttribute[];
}) {
  // Conditional schema based on initialData
  const formSchema = initialData?.thumbnail
    ? baseSchema.extend({
        thumbnail: z.any().optional(),
        gallery: fileValidation.gallery
      })
    : baseSchema.extend({
        thumbnail: fileValidation.thumbnail,
        gallery: fileValidation.gallery
      });

  const defaultValues = {
    title: initialData?.title ?? '',
    slug: initialData?.slug ?? '',
    metaTitle: initialData?.metaTitle ?? '',
    metaDescription: initialData?.metaDescription ?? '',
    productCode: initialData?.productCode ?? '',
    regularPrice: Number.parseFloat(initialData?.regularPrice ?? '0'),
    discountPrice: Number.parseFloat(initialData?.discountPrice ?? '0'),
    quantity: initialData?.quantity ?? 0,
    description: initialData?.description ?? '',
    keyFeatures: initialData?.keyFeatures ?? '',
    specifications: initialData?.specifications ?? '',
    thresholdAmount: initialData?.thresholdAMount ?? undefined,
    category_id: initialData?.category.id ?? '',
    attribute_value_ids:
      initialData?.productAttributes?.map((item) => item.id) ?? [], // Updated to use attributeValue_id
    brand_id: initialData?.brand.id ?? '',
    thumbnail: initialData?.thumbnail
      ? [
          {
            name: `${initialData.title}`,
            preview: initialData.thumbnail,
            size: 0
          }
        ]
      : undefined,
    gallery:
      initialData?.gallery?.map((url: string) => ({
        name: url.split('/').pop() || 'gallery',
        preview: url,
        size: 0
      })) ?? undefined
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const selectedBrandId = form.watch('brand_id');
  const filteredCategories = useMemo(
    () =>
      selectedBrandId
        ? (brands.find((brand) => brand.id === selectedBrandId)?.categories ??
          [])
        : categories,
    [brands, categories, selectedBrandId]
  );

  const [open, setOpen] = useState<boolean>(false);

  useEffect(() => {
    const currentCategoryId = form.getValues('category_id');
    if (
      selectedBrandId &&
      currentCategoryId &&
      !filteredCategories.some((cat) => cat.id === currentCategoryId)
    ) {
      form.setValue('category_id', '');
    }
  }, [selectedBrandId, filteredCategories, form]);

  const router = useRouter();
  const [loading, startAPICall] = useTransition();

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    const formData = new FormData();

    Object.entries(values).forEach(([key, value]) => {
      if (key !== 'thumbnail' && key !== 'gallery') {
        if (Array.isArray(value)) {
          value.forEach((item, index) => {
            formData.append(`${key}[${index}]`, item);
          });
        } else if (value && typeof value === 'object') {
          formData.append(key, JSON.stringify(value));
        } else if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      }
    });

    if (values.thumbnail && values.thumbnail[0] instanceof File) {
      formData.append('thumbnail', values.thumbnail[0]);
    }

    if (values.gallery && values.gallery.length > 0) {
      values.gallery.forEach((file: File, index: number) => {
        if (file instanceof File) {
          formData.append(`gallery[${index}]`, file);
        }
      });
    }

    startAPICall(async () => {
      const data = await updateProduct({
        data: formData,
        method: initialData ? 'PATCH' : 'POST',
        id: initialData?.id
      });
      if (data.ok) {
        toast.success('Update Successful!');
        router.push('.');
      } else {
        toast.error('Update Failed!');
      }
    });
  };

  // Prepare attribute options for MultiSelect
  const attributeOptions = attributes.map((attr) => ({
    label: attr.id, // You might want to use a more descriptive label from your data
    value: `${attr.attributeValue.value}, ${attr.attributeValue.attributeGroup.title}`
  }));

  return (
    <>
      <Card className='mx-auto w-full'>
        <CardHeader>
          <CardTitle className='text-left text-2xl font-bold'>
            {pageTitle}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit, (error) => {
                setOpen(true);
              })}
              className='space-y-8'
            >
              <div className='grid grid-cols-1 gap-2 lg:grid-cols-2 lg:gap-4'>
                <FormField
                  control={form.control}
                  name='thumbnail'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Thumbnail</FormLabel>
                      <FormControl>
                        <FileUploader
                          disabled={loading}
                          value={field.value}
                          onValueChange={field.onChange}
                          maxFiles={1}
                          maxSize={MAX_FILE_SIZE}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='gallery'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Gallery Images</FormLabel>
                      <FormControl>
                        <FileUploader
                          disabled={loading}
                          value={field.value}
                          onValueChange={field.onChange}
                          maxFiles={10}
                          maxSize={MAX_FILE_SIZE}
                          multiple
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
                <FormField
                  control={form.control}
                  name='title'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder='Enter product title'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='slug'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder='Enter product slug'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='productCode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Product Code</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          placeholder='Enter product code'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='regularPrice'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Regular Price</FormLabel>
                      <FormControl>
                        <div className='relative flex'>
                          <Input
                            disabled={loading}
                            type='number'
                            step='0.01'
                            placeholder='Enter regular price'
                            className='pl-10'
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                          <p className='absolute left-2 self-center justify-self-center text-xs lg:text-sm'>
                            BDT
                          </p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='discountPrice'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Discount Price</FormLabel>
                      <FormControl>
                        <div className='relative flex'>
                          <Input
                            disabled={loading}
                            type='number'
                            step='0.01'
                            placeholder='Enter discount price'
                            className='pl-10'
                            value={field.value ?? ''}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseFloat(e.target.value)
                                  : undefined
                              )
                            }
                          />
                          <p className='absolute left-2 self-center justify-self-center text-xs lg:text-sm'>
                            BDT
                          </p>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='quantity'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantity</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          type='number'
                          step='1'
                          placeholder='Enter quantity'
                          value={field.value}
                          onChange={(e) =>
                            field.onChange(parseInt(e.target.value, 10))
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='brand_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Brand</FormLabel>
                      <LabelledComboBox
                        disabled={loading}
                        className='w-full'
                        label='Select Brand'
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        items={brands.map((brand) => ({
                          label: brand.name,
                          value: brand.id
                        }))}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='category_id'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <LabelledComboBox
                        disabled={loading || !selectedBrandId}
                        className='w-full'
                        label='Select Category'
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        items={filteredCategories.map((cat) => ({
                          label: cat.name,
                          value: cat.id
                        }))}
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name='thresholdAmount'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Threshold Amount</FormLabel>
                      <FormControl>
                        <Input
                          disabled={loading}
                          type='number'
                          step='1'
                          placeholder='Enter threshold amount'
                          value={field.value ?? ''}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined
                            )
                          }
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name='description'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        disabled={loading}
                        placeholder='Enter product description'
                        className='h-72'
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <p className='text-lg font-semibold lg:text-xl'>
                Search Engine Optimization (SEO) Options
              </p>
              <FormField
                control={form.control}
                name='metaTitle'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Title</FormLabel>
                    <FormControl>
                      <Input
                        disabled={loading}
                        placeholder='Enter meta title'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='metaDescription'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Meta Description</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        disabled={loading}
                        placeholder='Enter meta description'
                        className='h-72'
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='keyFeatures'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Key Features</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        disabled={loading}
                        placeholder='Enter key features'
                        className='h-72'
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='specifications'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Specifications</FormLabel>
                    <FormControl>
                      <RichTextEditor
                        disabled={loading}
                        placeholder='Enter specifications'
                        className='h-full'
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name='attribute_value_ids'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Product Attributes</FormLabel>
                    <FormControl>
                      <MultiSelect
                        options={attributeOptions}
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                        placeholder='Select product attributes'
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <Button disabled={loading} type='submit'>
                {initialData ? 'Update Product' : 'Add Product'}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger className='hidden'>Show Error</AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Invalid Form</AlertDialogTitle>
            <AlertDialogDescription>
              The form has errors. Please resolve them before proceeding.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <p className='text-semibold'>Errors</p>
          <ScrollArea className='max-h-52'>
            <ul className='list-inside list-disc text-sm text-red-500'>
              {Object.entries(form.formState.errors).map(([key, value]) => (
                <li key={key}>{`${value.message}`}</li>
              ))}
            </ul>
          </ScrollArea>
          <AlertDialogFooter>
            <Button onClick={() => setOpen(false)}>OK</Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
