'use client';

import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect } from 'react';
import { toast } from 'sonner';
import * as z from 'zod';
import { GoogleAuthButton } from './google-auth-button';

const signInSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required')
});

type SignInValues = z.infer<typeof signInSchema>;

const { FormTextField } = useFormFields<SignInValues>();

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams.get('error') === 'oauth_error') {
      toast.error('Sign-in was cancelled');
    }
  }, [searchParams]);

  const form = useAppForm({
    defaultValues: { email: '', password: '' } as SignInValues,
    validators: { onSubmit: signInSchema },
    onSubmit: async ({ value }) => {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: value.email,
        password: value.password
      });
      if (error) {
        if (error.message.toLowerCase().includes('email not confirmed')) {
          toast.error('Please confirm your email before signing in');
        } else {
          toast.error('Invalid email or password');
        }
        return;
      }
      router.push('/dashboard');
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl'>Sign in</CardTitle>
        <CardDescription>Enter your email and password to sign in</CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='flex flex-col gap-4'>
            <FormTextField name='email' label='Email' placeholder='you@example.com' />
            <FormTextField
              name='password'
              label='Password'
              type='password'
              placeholder='••••••••'
            />
            <div className='text-right text-sm'>
              <Link href='/auth/forgot-password' className='underline underline-offset-4'>
                Forgot password?
              </Link>
            </div>
            <form.SubmitButton className='w-full'>Sign in</form.SubmitButton>
            <div className='relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border'>
              <span className='relative z-10 bg-card px-2 text-muted-foreground'>or</span>
            </div>
            <GoogleAuthButton />
            <div className='text-center text-sm'>
              Don&apos;t have an account?{' '}
              <Link href='/auth/sign-up' className='underline underline-offset-4'>
                Sign up
              </Link>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
