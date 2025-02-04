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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { CurrentUserContextType } from '@/@types/user';
import { UserContext } from '@/context/UserProvider';
import { Heading } from '@/components/ui/heading';
import { Textarea } from '@/components/ui/textarea';
import { Copy, CheckCircle } from 'lucide-react';
import { CopyToClipboard } from 'react-copy-to-clipboard';

const formSchema = z.object({
  name: z.string().min(2, {
    message: 'Name must be at least 2 characters.'
  }),
  last_name: z.string({
    required_error: 'Please select a country.'
  }),
  email: z.string().email({
    message: 'Please enter a valid email address.'
  }),
  role: z.string().optional()
});

export default function ProfileForm() {
  const { user } = React.useContext(UserContext) as CurrentUserContextType;
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: user?.firstName,
      last_name: user?.lastName,
      email: user?.email,
      role: user.role
    }
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log(values);
  }

  const [copied, setCopied] = React.useState(false);

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          Profile Information
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
                      <Input
                        placeholder="Enter your name"
                        {...field}
                        disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Enter your name"
                        {...field}
                        disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="Enter your email"
                        {...field}
                        disabled
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <FormControl>
                      <Input placeholder="" {...field} disabled />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div>
                <div>
                  <Heading
                    title={'Embed Listings'}
                    description=" Copy the code below to embed your stores listings to your website."
                  />
                  <div className="flex">
                    <Card className="mx-auto w-full p-4">
                      <p>
                        {`<iframe
                        src="https://mehchant.vercel.app/widget/${user.storeId}"
                        title="The Marketplace For Merchandise Licensed by Creators"
                        style="border: none; width: 100%; height: 100vh"
                      ></iframe>`}
                      </p>
                    </Card>

                    <CopyToClipboard
                      text={`<iframe
                        src="https://mehchant.vercel.app/widget/${user.storeId}"
                        title="The Marketplace For Merchandise Licensed by Creators"
                        style="border: none; width: 100%; height: 100vh"
                      ></iframe>`}
                      onCopy={() => setCopied((prevState) => !prevState)}
                    >
                      <span className="ms-5 flex cursor-pointer items-center space-x-2">
                        Copy <Copy size={18} className="ms-1" />
                      </span>
                    </CopyToClipboard>
                  </div>
                  {copied && (
                    <div className="mt-3 flex items-center space-x-2">
                      <span>Copied to clipboard!</span>
                      <CheckCircle color="green" />
                    </div>
                  )}
                </div>
              </div>
            </div>
            {/* <Button type="submit" disabled>
              Submit
            </Button> */}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
