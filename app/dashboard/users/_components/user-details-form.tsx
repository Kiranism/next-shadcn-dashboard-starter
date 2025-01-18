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
import { getUser, updateUser } from '@/utils/user';
import { useRouter, useSearchParams } from 'next/navigation';
import { CurrentUserContextType } from '@/@types/user';
import { UserContext } from '@/context/UserProvider';
import { Textarea } from '@/components/ui/textarea';

import ClipLoader from 'react-spinners/ClipLoader';

const formSchema = z.object({
  fname: z.string().min(2, {
    message: 'Name must be at least 2 characters.'
  }),
  lname: z.string().min(2, {
    message: 'Name must be at least 2 characters.'
  }),

  email: z.string().email({
    message: 'Please enter a valid email address.'
  }),
  phone_number: z.string().min(2, {
    message: 'Number must be at least 2 characters.'
  }),
  bio: z.string().min(1, {
    message: 'Company name is required.'
  }),
  role: z.string({
    required_error: 'Please select a role.'
  })
});

export default function UserDetailForm() {
  const { user } = React.useContext(UserContext) as CurrentUserContextType;
  const search = useSearchParams();
  const id = search.get('id');

  const router = useRouter();

  const [loading, setLoading] = React.useState<boolean>(true);
  const [submitLoading, setSubmitLoading] = React.useState<boolean>(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fname: '',
      lname: '',
      email: '',
      phone_number: '',
      bio: '',
      role: ''
    }
  });

  React.useEffect(() => {
    getUser(id, user?.token).then((res) => {
      setLoading(false);
      console.log(res);
      form.reset({
        fname: res?.firstName,
        lname: res?.lastName,
        email: res?.email,
        phone_number: res?.phoneNumber,
        bio: res?.bio,
        role: res?.role
      });
    });
  }, [form.reset]);

  function onSubmit(values: z.infer<typeof formSchema>) {
    setSubmitLoading(true);
    const formData = new FormData();
    formData.append('role', values.role);

    updateUser(formData, id, user?.token).then((res) => {
      console.log(res);
      setSubmitLoading(false);
      router.back();
    });
    console.log(values);
  }

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="text-left text-2xl font-bold">
          User Information
        </CardTitle>
      </CardHeader>
      {!loading && (
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="fname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First name</FormLabel>
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
                  name="lname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last name</FormLabel>
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
                  name="phone_number"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <Input
                          type="text"
                          placeholder="Enter your phone number"
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
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a role" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="store">Store</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="bio"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bio</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Enter bio" {...field} disabled />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Button disabled={submitLoading} type="submit">
                Update User
                <ClipLoader
                  color="white"
                  loading={submitLoading}
                  //cssOverride={override}
                  size={25}
                  aria-label="Loading Spinner"
                  data-testid="loader"
                />
              </Button>
            </form>
          </Form>
        </CardContent>
      )}
      {loading && (
        <CardTitle className="ms-6 text-left text-2xl font-bold">
          Loading...
        </CardTitle>
      )}
    </Card>
  );
}
