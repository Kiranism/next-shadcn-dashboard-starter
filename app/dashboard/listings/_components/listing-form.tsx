'use client';
import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Heading } from '@/components/ui/heading';
import { Plus, Trash } from 'lucide-react';
import FileUploadFour from '@/components/file-upload-four';
import { cn } from '@/lib/utils';
import { createListing } from '@/utils/listings';
import { CurrentUserContextType } from '@/@types/user';
import { UserContext } from '@/context/UserProvider';
import { useRouter } from 'next/navigation';

import ClipLoader from 'react-spinners/ClipLoader';

import MDEditor from '@uiw/react-md-editor';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.'
  }),
  category: z.string({
    required_error: 'Please select a category.'
  }),
  // description: z.string().min(1, {
  //   message: 'Please enter a description'
  // }),
  tags: z.string().min(1, {
    message: 'Please enter tags associated with the listing.'
  }),
  type: z.enum(['physical', 'digital'], {
    required_error: 'Please select a type.'
  }),
  price: z.coerce.number().min(1, {
    message: 'Please enter price'
  }),
  quantity: z.coerce.number().min(1, {
    message: 'Please enter quantity'
  }),
  sku: z.string().min(1, {
    message: 'Please enter sku'
  }),
  upc: z.coerce.number().min(1, {
    message: 'Please enter upc'
  }),
  shipping: z.enum(['standard', 'express'], {
    required_error: 'Please select a shipping option.'
  })
});

export default function CreateListingForm() {
  const { user } = React.useContext(UserContext) as CurrentUserContextType;
  const router = useRouter();

  const [markdown, setMarkdown] = React.useState('');

  function handleEditorChange({ html, text }: { html: string; text: string }) {
    // console.log('handleEditorChange', html, text);
    setMarkdown(text);
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      category: '',
      //description: '',
      tags: '',
      type: undefined,
      shipping: undefined,
      price: 0,
      quantity: 0,
      sku: '',
      upc: 0
    }
  });

  React.useEffect(() => {
    document.body.style.overflow = 'auto'; // Ensure scrolling is enabled
  }, []);

  const [listingImages, setListingImages] = React.useState([]);
  const [reRender, setReRender] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const fileImages = (images: any) => {
    setListingImages(images);
    setReRender((prevState) => !prevState);
  };

  const [variants, setVariants] = React.useState([{ option: '', value: '' }]);

  const handleVariantChange = (
    index: number,
    field: 'option' | 'value',
    value: string
  ) => {
    const updatedVariants = [...variants];
    updatedVariants[index][field] = value;
    setVariants(updatedVariants);
  };

  const addVariant = () => {
    setVariants([...variants, { option: '', value: '' }]);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const combineVariants = () => {
    const combined = variants.reduce(
      (acc, curr) => {
        const existing = acc.find((item) => item.option === curr.option);
        if (existing) {
          existing.value.push(curr.value);
        } else {
          acc.push({ option: curr.option, value: [curr.value] });
        }
        return acc;
      },
      [] as { option: string; value: string[] }[]
    );

    return combined;
  };

  function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    console.log(values);
    const {
      name,
      category,
      //description,
      tags,
      type,
      price,
      quantity,
      sku,
      upc,
      shipping
    } = values;

    const variants = combineVariants();

    const formData = new FormData();
    formData.append('listingName', name);
    formData.append('category', category);
    formData.append('description', markdown);
    formData.append('type', type);
    formData.append('tags', tags);
    formData.append('price', price.toString());
    formData.append('quantity', quantity.toString());
    formData.append('sku', sku);
    formData.append('upc', upc.toString());
    formData.append('shipping', shipping);
    formData.append('variation', JSON.stringify(variants));
    formData.append('userId', user?.userId);
    formData.append('storeId', user?.storeId);

    for (const image of listingImages) {
      formData.append('images', image);
    }

    createListing(formData, user?.token)
      .then((res) => {
        console.log(res);
        setLoading(false);
        router.back();
      })
      .catch((e) => {
        console.log(e);
      });
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Create Listing
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter name" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Category</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="clothing">Clothing</SelectItem>
                        <SelectItem value="fashion">
                          Fashion Accessories
                        </SelectItem>
                        <SelectItem value="digital-assets">
                          Digital Assets
                        </SelectItem>
                        <SelectItem value="beauty">Beauty</SelectItem>
                        <SelectItem value="music">
                          Music e.g vinyl, cds
                        </SelectItem>
                        <SelectItem value="collections">
                          Rare Collections
                        </SelectItem>
                        {/* <SelectItem value="japan">Japan</SelectItem>
                        <SelectItem value="brazil">Brazil</SelectItem> */}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter description" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              /> */}
            </div>
            <div data-color-mode="light">
              <Heading
                title={'Description'}
                description=" Please write a detailed description of your listing."
              />
              <MDEditor
                value={markdown}
                onChange={(val) => setMarkdown(val || '')}
              />
            </div>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <Heading
                      title={'Tags'}
                      description=" Please enter tags associated with the listing."
                    />
                    <FormControl>
                      <Textarea placeholder="Enter tags" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <Heading
                      title={'Type'}
                      description=" Choose the type of listing you want."
                    />
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="physical" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Physical
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="digital" />
                          </FormControl>
                          <FormLabel className="font-normal">Digital</FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="other" />
                          </FormControl>
                          <FormLabel className="font-normal">Other</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div>
              <Heading
                title={'Photos'}
                description=" Please upload clean, clear photos of your listing. Also
            upload the different photos of variants if added as an
            option."
              />
              <FileUploadFour fileImages={fileImages} />
            </div>
            <div>
              <Heading
                title={'Variation'}
                description=" This item has variations e.g color, size, length etc."
              />
              <div className="mt-5 space-y-4">
                {variants.map((option, index) => (
                  <div key={index} className="flex items-center space-x-4">
                    {/* Dropdown for Variant Type */}
                    <select
                      value={option.option}
                      onChange={(e) =>
                        handleVariantChange(index, 'option', e.target.value)
                      }
                      className={cn(
                        'flex h-9 w-48 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                      )}
                    >
                      <option value="" disabled>
                        Select Variant
                      </option>
                      <option value="Size">Size</option>
                      <option value="Color">Color</option>
                      <option value="Width">Width</option>
                      <option value="Length">Length</option>
                      <option value="Material">Material</option>
                    </select>

                    {/* Input for Value */}
                    <input
                      type="text"
                      value={option.value}
                      onChange={(e) =>
                        handleVariantChange(index, 'value', e.target.value)
                      }
                      placeholder="Enter value"
                      className={cn(
                        'flex h-9 w-72 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50'
                      )}
                    />

                    {/* Remove Variant Button */}
                    {variants.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeVariant(index)}
                        className="text-red-500 hover:underline"
                      >
                        <Trash size={15} />
                      </button>
                    )}
                  </div>
                ))}

                {/* Add Another Option Button */}
                <button
                  type="button"
                  onClick={addVariant}
                  className={cn(buttonVariants({ variant: 'default' }))}
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Another Option
                </button>
              </div>
            </div>

            <Heading
              title={'Inventory And Pricing'}
              description=" Price entered here are assumed for all the the different item variations."
            />
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Price</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter price ($)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="quantity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Quantity</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Enter quantity"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="sku"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>SKU</FormLabel>
                    <FormControl>
                      <Input type="text" placeholder="Enter sku" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="upc"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>UPC</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Enter upc" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div>
              <FormField
                control={form.control}
                name="shipping"
                render={({ field }) => (
                  <FormItem className="space-y-3">
                    <Heading
                      title={'Shipping'}
                      description=" Choose the shipping option available to deliver this listing."
                    />
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex space-x-4"
                      >
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="standard" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Standard Delivery ($4.99)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="express" />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Express Delivery ($8.99)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2">
                          <FormControl>
                            <RadioGroupItem value="other" />
                          </FormControl>
                          <FormLabel className="font-normal">Other</FormLabel>
                        </FormItem>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" disabled={loading}>
              Submit
              <ClipLoader
                color="white"
                loading={loading}
                //cssOverride={override}
                size={25}
                aria-label="Loading Spinner"
                data-testid="loader"
              />
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
