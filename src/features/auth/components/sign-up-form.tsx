'use client';

import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useState } from 'react';
import { toast } from 'sonner';
import * as z from 'zod';
import { GoogleAuthButton } from './google-auth-button';

const signUpSchema = z
  .object({
    email: z.string().email('Enter a valid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type SignUpValues = z.infer<typeof signUpSchema>;

const { FormTextField } = useFormFields<SignUpValues>();

export function SignUpForm() {
  const [confirmed, setConfirmed] = useState(false);

  const form = useAppForm({
    defaultValues: { email: '', password: '', confirmPassword: '' } as SignUpValues,
    validators: { onSubmit: signUpSchema },
    onSubmit: async ({ value }) => {
      const supabase = createClient();
      const { error } = await supabase.auth.signUp({
        email: value.email,
        password: value.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`
        }
      });
      if (error) {
        if (error.message.toLowerCase().includes('already registered')) {
          toast.error('An account with this email already exists');
        } else {
          toast.error('Could not create account. Please try again.');
        }
        return;
      }
      setConfirmed(true);
    }
  });

  if (confirmed) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your inbox</CardTitle>
          <CardDescription>
            We sent a confirmation link to your email. Click it to activate your account.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl'>Create an account</CardTitle>
        <CardDescription>Enter your details below to create your account</CardDescription>
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
            <FormTextField
              name='confirmPassword'
              label='Confirm password'
              type='password'
              placeholder='••••••••'
            />
            <form.SubmitButton className='w-full'>Create account</form.SubmitButton>
            <div className='relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t after:border-border'>
              <span className='relative z-10 bg-card px-2 text-muted-foreground'>or</span>
            </div>
            <GoogleAuthButton />
            <div className='text-center text-sm'>
              Already have an account?{' '}
              <Link href='/auth/sign-in' className='underline underline-offset-4'>
                Sign in
              </Link>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
