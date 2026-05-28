'use client';

import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useState } from 'react';
import * as z from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Enter a valid email address')
});

type ForgotPasswordValues = z.infer<typeof forgotPasswordSchema>;

const { FormTextField } = useFormFields<ForgotPasswordValues>();

export function ForgotPasswordForm() {
  const [sent, setSent] = useState(false);

  const form = useAppForm({
    defaultValues: { email: '' } as ForgotPasswordValues,
    validators: { onSubmit: forgotPasswordSchema },
    onSubmit: async ({ value }) => {
      const supabase = createClient();
      await supabase.auth.resetPasswordForEmail(value.email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`
      });
      // Always show success to prevent email enumeration
      setSent(true);
    }
  });

  if (sent) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Check your inbox</CardTitle>
          <CardDescription>
            If an account exists for that email, we sent a password reset link.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl'>Forgot password</CardTitle>
        <CardDescription>Enter your email and we&apos;ll send you a reset link</CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='flex flex-col gap-4'>
            <FormTextField name='email' label='Email' placeholder='you@example.com' />
            <form.SubmitButton className='w-full'>Send reset link</form.SubmitButton>
            <div className='text-center text-sm'>
              <Link href='/auth/sign-in' className='underline underline-offset-4'>
                Back to sign in
              </Link>
            </div>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
