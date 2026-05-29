'use client';

import { useAppForm, useFormFields } from '@/components/ui/tanstack-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createClient } from '@/utils/supabase/client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import * as z from 'zod';

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

type ResetPasswordValues = z.infer<typeof resetPasswordSchema>;

const { FormTextField } = useFormFields<ResetPasswordValues>();

export function ResetPasswordForm() {
  const router = useRouter();
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setHasSession(true);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const form = useAppForm({
    defaultValues: { password: '', confirmPassword: '' } as ResetPasswordValues,
    validators: { onSubmit: resetPasswordSchema },
    onSubmit: async ({ value }) => {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: value.password });
      if (error) {
        toast.error('Não foi possível atualizar a senha. Tente novamente.');
        return;
      }
      toast.success('Password updated successfully');
      router.push('/dashboard');
    }
  });

  if (hasSession === null) {
    return null;
  }

  if (!hasSession) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Link expired</CardTitle>
          <CardDescription>
            This reset link is invalid or has expired.{' '}
            <Link href='/auth/forgot-password' className='underline underline-offset-4'>
              Request a new one
            </Link>
            .
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-xl'>Set new password</CardTitle>
        <CardDescription>Enter and confirm your new password</CardDescription>
      </CardHeader>
      <CardContent>
        <form.AppForm>
          <form.Form className='flex flex-col gap-4'>
            <FormTextField
              name='password'
              label='New password'
              type='password'
              placeholder='••••••••'
            />
            <FormTextField
              name='confirmPassword'
              label='Confirm password'
              type='password'
              placeholder='••••••••'
            />
            <form.SubmitButton className='w-full'>Update password</form.SubmitButton>
          </form.Form>
        </form.AppForm>
      </CardContent>
    </Card>
  );
}
