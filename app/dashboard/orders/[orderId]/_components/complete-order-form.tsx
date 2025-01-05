'use client';
import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { completeOrder } from '@/utils/orders';
import { CurrentUserContextType } from '@/@types/user';
import { UserContext } from '@/context/UserProvider';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import ClipLoader from 'react-spinners/ClipLoader';

const formSchema = z.object({
  tracking_number: z.string().min(5, {
    message: 'Tracking number must be at least 2 characters.'
  }),
  ship_provider: z.string().min(3, {
    message: 'Please select a shipping provider.'
  }),
  shipDate: z.string().min(3, {
    message: 'Please enter a valid ship date'
  }),
  notes: z.string().optional()
});

export default function CompleteOrderForm() {
  const { user } = React.useContext(UserContext) as CurrentUserContextType;
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const storeId = searchParams.get('storeId');
  const params = useParams();
  const { orderId } = params;

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      tracking_number: '',
      ship_provider: '',
      shipDate: '',
      notes: ''
    }
  });

  const [error, setError] = React.useState<string>('');
  const [loading, setLoading] = React.useState<boolean>(false);

  function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true);
    const { tracking_number, ship_provider, shipDate, notes } = values;
    if (user?.token) {
      completeOrder(
        id,
        storeId,
        tracking_number,
        ship_provider,
        shipDate,
        notes,
        user?.token
      )
        .then((res) => {
          setLoading(false);
          console.log(res);
          router.push('/dashboard/orders');
        })
        .catch((e) => setError('There was an issue completing this order'));
    }
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Complete Order
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <FormField
                control={form.control}
                name="tracking_number"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tracking Number</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter tracking number" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="ship_provider"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Shipping Provider</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a provider" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="usps">USPS</SelectItem>
                        <SelectItem value="dhl">DHL</SelectItem>
                        <SelectItem value="fedex">FEDEX</SelectItem>
                        <SelectItem value="ups">UPS</SelectItem>
                        <SelectItem value="royal_mail">ROYAL MAIL</SelectItem>
                        <SelectItem value="air_france">AIR FRANCE</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name={`shipDate`}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Start date</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        // disabled={loading}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Note</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Enter note (optional)"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {error && (
              <p className="text-muted-foreground text-red-900">{error}</p>
            )}
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
