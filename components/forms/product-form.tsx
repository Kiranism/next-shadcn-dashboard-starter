'use client';

import { useState } from 'react';
import { Trash } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import { useToast } from '../ui/use-toast';
import { getProduct, createProduct, updateProduct } from '../../data/products';

export interface Product {
  id: number;
  name: string;
  cogs: number;
  selling_price: number;
  stock_qty: number;
  vendor: string;
}

interface ProductFormProps {
  initialData: Product | null;
}

export const ProductForm: React.FC<ProductFormProps> = ({ initialData }) => {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Product>({
    id: initialData?.id || 0,
    name: initialData?.name || '',
    cogs: initialData?.cogs || 0,
    selling_price: initialData?.selling_price || 0,
    stock_qty: initialData?.stock_qty || 0,
    vendor: initialData?.vendor || ''
  });

  const title = initialData ? 'Edit product' : 'Create product';
  const description = initialData ? 'Edit a product.' : 'Add a new product';
  const toastMessage = initialData ? 'Product updated.' : 'Product created.';
  const action = initialData ? 'Save changes' : 'Create';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: name === 'name' || name === 'vendor' ? value : parseFloat(value)
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (initialData) {
        // await axios.put(`/api/products/${initialData.id}`, );
        await updateProduct(formData.id, formData);
      } else {
        // const res = await axios.post(`/api/products`, formData);
        await createProduct(formData);
        // console.log("product", res);
      }
      router.refresh();
      router.push(`/dashboard/products`);
      toast({
        title: 'Success',
        description: toastMessage
      });
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem with your request.'
      });
    } finally {
      setLoading(false);
    }
  };

  const onDelete = async () => {
    try {
      setLoading(true);
      // await axios.delete(`/api/products/${initialData?.id}`);
      router.refresh();
      router.push(`/dashboard/products`);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Uh oh! Something went wrong.',
        description: 'There was a problem with your request.'
      });
    } finally {
      setLoading(false);
      setOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={loading}
            variant="destructive"
            size="sm"
            onClick={() => setOpen(true)}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />
      <form onSubmit={handleSubmit} className="w-full space-y-8">
        <div className="gap-8 md:grid md:grid-cols-2">
          <div>
            <label htmlFor="name">Name</label>
            <Input
              id="name"
              name="name"
              disabled={loading}
              placeholder="Product name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="cogs">Cost of Goods Sold (COGS)</label>
            <Input
              id="cogs"
              name="cogs"
              type="number"
              disabled={loading}
              value={formData.cogs}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="selling_price">Selling Price</label>
            <Input
              id="selling_price"
              name="selling_price"
              type="number"
              disabled={loading}
              value={formData.selling_price}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="stock_qty">Stock Quantity</label>
            <Input
              id="stock_qty"
              name="stock_qty"
              type="number"
              disabled={loading}
              value={formData.stock_qty}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="vendor">Vendor</label>
            <Input
              id="vendor"
              name="vendor"
              disabled={loading}
              placeholder="Vendor name"
              value={formData.vendor}
              onChange={handleChange}
            />
          </div>
        </div>
        <Button disabled={loading} className="ml-auto" type="submit">
          {action}
        </Button>
      </form>
    </>
  );
};
