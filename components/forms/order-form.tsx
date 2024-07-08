'use client';

import { useState } from 'react';
import { Trash } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Heading } from '@/components/ui/heading';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';

export interface Order {
  id: number;
  customer_name: string;
  phone_number: string;
  address: string;
  city: string;
  status: string;
  handling_cost: number;
  shipping_cost: number;
  total: number;
  cogs: number;
  gross_profit: number;
  shipping_company: string;
  agent: string;
  product_link: string;
  product_name: string;
  quantity: number;
}

interface OrderFormProps {
  initialData: Order | null;
  statuses: string[];
  shippingCompanies: string[];
  agents: string[];
}

export const OrderForm: React.FC<OrderFormProps> = ({
  initialData,
  statuses,
  shippingCompanies,
  agents
}) => {
  // const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Order>({
    id: initialData?.id || 0,
    customer_name: initialData?.customer_name || '',
    phone_number: initialData?.phone_number || '',
    address: initialData?.address || '',
    city: initialData?.city || '',
    status: initialData?.status || '',
    handling_cost: initialData?.handling_cost || 0,
    shipping_cost: initialData?.shipping_cost || 0,
    total: initialData?.total || 0,
    cogs: initialData?.cogs || 0,
    gross_profit: initialData?.gross_profit || 0,
    shipping_company: initialData?.shipping_company || '',
    agent: initialData?.agent || '',
    product_link: initialData?.product_link || '',
    product_name: initialData?.product_name || '',
    quantity: initialData?.quantity || 0
  });
  console.log('initialData ==>', initialData);

  const title = initialData ? 'Edit order' : 'Create order';
  const description = initialData ? 'Edit an order.' : 'Add a new order';
  const toastMessage = initialData ? 'Order updated.' : 'Order created.';
  const action = initialData ? 'Save changes' : 'Create';

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: [
        'handling_cost',
        'shipping_cost',
        'total',
        'cogs',
        'gross_profit',
        'quantity'
      ].includes(name)
        ? parseFloat(value)
        : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setLoading(true);
      if (initialData) {
        // await axios.put(`/api/orders/${initialData.id}`, formData);
      } else {
        // await axios.post(`/api/orders`, formData);
      }
      router.refresh();
      router.push(`/dashboard/orders`);
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

  return (
    <>
      <div className="flex items-center justify-between">
        <Heading title={title} description={description} />
        {initialData && (
          <Button
            disabled={loading}
            variant="destructive"
            size="sm"
            onClick={() => {
              // Handle delete functionality
            }}
          >
            <Trash className="h-4 w-4" />
          </Button>
        )}
      </div>
      <Separator />
      <form onSubmit={handleSubmit} className="w-full space-y-8">
        <div className="gap-8 md:grid md:grid-cols-2">
          <div>
            <label htmlFor="customer_name">Customer Name</label>
            <Input
              id="customer_name"
              name="customer_name"
              disabled={loading}
              value={formData.customer_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="phone_number">Phone Number</label>
            <Input
              id="phone_number"
              name="phone_number"
              disabled={loading}
              value={formData.phone_number}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="address">Address</label>
            <Input
              id="address"
              name="address"
              disabled={loading}
              value={formData.address}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="city">City</label>
            <Input
              id="city"
              name="city"
              disabled={loading}
              value={formData.city}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="status">Status</label>
            <Select
              disabled={loading}
              onValueChange={(value) =>
                handleChange({ target: { name: 'status', value } } as any)
              }
              value={formData.status}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>
                    {status}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="handling_cost">Handling Cost</label>
            <Input
              id="handling_cost"
              name="handling_cost"
              type="number"
              disabled={loading}
              value={formData.handling_cost}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="shipping_cost">Shipping Cost</label>
            <Input
              id="shipping_cost"
              name="shipping_cost"
              type="number"
              disabled={loading}
              value={formData.shipping_cost}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="total">Total</label>
            <Input
              id="total"
              name="total"
              type="number"
              disabled={loading}
              value={formData.total}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="cogs">COGS</label>
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
            <label htmlFor="gross_profit">Gross Profit</label>
            <Input
              id="gross_profit"
              name="gross_profit"
              type="number"
              disabled={loading}
              value={formData.gross_profit}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="shipping_company">Shipping Company</label>
            <Select
              disabled={loading}
              onValueChange={(value) =>
                handleChange({
                  target: { name: 'shipping_company', value }
                } as any)
              }
              value={formData.shipping_company}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select shipping company" />
              </SelectTrigger>
              <SelectContent>
                {shippingCompanies.map((company) => (
                  <SelectItem key={company} value={company}>
                    {company}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="agent">Agent</label>
            <Select
              disabled={loading}
              onValueChange={(value) =>
                handleChange({ target: { name: 'agent', value } } as any)
              }
              value={formData.agent}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select agent" />
              </SelectTrigger>
              <SelectContent>
                {agents.map((agent) => (
                  <SelectItem key={agent} value={agent}>
                    {agent}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label htmlFor="product_link">Product Link</label>
            <Input
              id="product_link"
              name="product_link"
              disabled={loading}
              value={formData.product_link}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="product_name">Product Name</label>
            <Input
              id="product_name"
              name="product_name"
              disabled={loading}
              value={formData.product_name}
              onChange={handleChange}
            />
          </div>
          <div>
            <label htmlFor="quantity">Quantity</label>
            <Input
              id="quantity"
              name="quantity"
              type="number"
              disabled={loading}
              value={formData.quantity}
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
