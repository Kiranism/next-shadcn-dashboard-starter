'use client';
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
import Cookies from 'universal-cookie';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';
import { login } from '@/utils/auth';
import { CurrentUserContextType, IUser } from '@/@types/user';
import { UserContext } from '@/context/UserProvider';
import React from 'react';

const formSchema = z.object({
  email: z.string().email({ message: 'Enter a valid email address' }),
  password: z.string({ message: 'Enter a valid password' })
});

type UserFormValue = z.infer<typeof formSchema>;

export default function UserAuthForm() {
  const { setUser } = React.useContext(UserContext) as CurrentUserContextType;
  const router = useRouter();
  const cookies = new Cookies();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const [loading, startTransition] = useTransition();
  const [error, setError] = useState<String>('');
  const defaultValues = {
    email: 'demo@gmail.com',
    password: ''
  };
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: UserFormValue) => {
    login(data.email, data.password).then((res: any) => {
      console.log(res.status);
      if (res.status === 200) {
        cookies.set('user', JSON.stringify(res.data), {
          path: '/'
        });
        const userData: IUser = {
          firstName: res?.data?.firstName,
          lastName: res?.data?.lastName,
          email: res?.data?.email,
          userId: res?.data?.userId,
          token: res?.data?.token,
          role: res?.data?.role,
          storeId: res?.data?.storeId,
          storeName: res?.data?.storeName
        };
        setUser(userData);
        toast.success('Signed In Successfully!');
        router.push('/dashboard/overview');
      } else {
        setError('Invalid Email address or Password');
      }
    });
    // startTransition(() => {
    //   signIn('credentials', {
    //     email: data.email,
    //     callbackUrl: callbackUrl ?? '/dashboard'
    //   });
    //   toast.success('Signed In Successfully!');
    // });
  };

  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="w-full space-y-2"
        >
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="Enter your email..."
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    placeholder="Enter your password..."
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
          <Button disabled={loading} className="ml-auto w-full" type="submit">
            Login
          </Button>
        </form>
      </Form>
      {/* <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">
            Or continue with
          </span>
        </div>
      </div>
      <GithubSignInButton /> */}
    </>
  );
}
