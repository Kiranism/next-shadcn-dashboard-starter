'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import React, { useCallback, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

const FormSchema = z.object({
  email: z.string().email(),
  password: z.string(),
  remember_me: z.string().default('false').optional()
});

type FormType = z.infer<typeof FormSchema>;

export default function LoginForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const [loading, startTransition] = useTransition();
  const router = useRouter();
  const form = useForm<FormType>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      remember_me: 'false'
    }
  });

  const onSubmit = useCallback(
    async (data: FormType) => {
      startTransition(async () => {
        const result = await signIn('credentials', {
          ...data,
          redirect: false
        });

        if (result?.ok) {
          toast.success('Signed In Successfully!');
          router.replace(callbackUrl ?? '/dashboard');
        } else {
          toast.error('Invalid Credeintials!');
        }
      });
    },
    [callbackUrl, router]
  );
  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className='flex flex-col gap-4'
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <Input
                  className='shadow-md hover:shadow-lg focus:shadow-lg sm:h-13'
                  disabled={loading}
                  placeholder='Email'
                  type='email'
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <PasswordInput
                  className='shadow-md hover:shadow-lg focus:shadow-lg sm:h-13'
                  disabled={loading}
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className='flex items-center justify-between'>
          <FormField
            control={form.control}
            name='remember_me'
            render={({ field }) => (
              <FormItem className='mb-0 flex items-center justify-center gap-1 space-y-0 justify-self-center'>
                <FormControl>
                  <Checkbox
                    checked={field.value == 'true'}
                    onCheckedChange={(val) =>
                      field.onChange(val ? 'true' : 'false')
                    }
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormLabel>Remember me</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            disabled={loading}
            type='button'
            variant={'link'}
            size={'sm'}
            className='text-xs text-primary-foreground sm:text-sm'
          >
            Forget password?
          </Button>
        </div>

        <Button
          disabled={loading}
          className='bg-orange-550 text-base font-semibold text-white shadow-md hover:bg-orange-500 hover:shadow-lg focus:shadow-lg sm:h-13'
        >
          Login
        </Button>
      </form>
    </Form>
  );
}
