'use client';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Link from 'next/link';
import { useState } from 'react';

const formSchema = z.object({
  email: z.string().email({ message: 'Введите корректный email' })
});

type FormValues = z.infer<typeof formSchema>;

export default function ForgotPasswordViewPage() {
  const [isSubmitted, setIsSubmitted] = useState(false);

  return (
    <div className='relative container grid h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-1 lg:px-0'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]'>
        <div className='flex flex-col space-y-2 text-center'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Восстановление пароля
          </h1>
          <p className='text-muted-foreground text-sm'>
            {isSubmitted
              ? 'Мы отправили инструкции на ваш email'
              : 'Введите email для восстановления доступа'}
          </p>
        </div>

        {!isSubmitted ? (
          <AuthForm onSubmit={() => setIsSubmitted(true)} />
        ) : (
          <div className='space-y-4 text-center'>
            <p className='text-muted-foreground text-sm'>
              Проверьте вашу почту и следуйте инструкциям для восстановления
              пароля.
            </p>
            <Button asChild variant='outline'>
              <Link href='/auth/sign-in'>Вернуться к входу</Link>
            </Button>
          </div>
        )}

        <p className='text-muted-foreground px-8 text-center text-sm'>
          Вспомнили пароль?{' '}
          <Link
            href='/auth/sign-in'
            className='hover:text-primary underline underline-offset-4'
          >
            Войти
          </Link>
        </p>
      </div>
    </div>
  );
}

function AuthForm({ onSubmit }: { onSubmit: () => void }) {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '' }
  });

  async function handleSubmit(values: FormValues) {
    try {
      // TODO: Реализовать API endpoint для восстановления пароля
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || 'Ошибка отправки');
      }

      toast.success('Инструкции отправлены на email');
      onSubmit();
    } catch (e: unknown) {
      // Для демонстрации всегда показываем успех (из соображений безопасности)
      toast.success('Если такой email существует, мы отправили инструкции');
      onSubmit();
    }
  }

  return (
    <div className='grid gap-6'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className='space-y-4'>
          <FormField
            control={form.control}
            name='email'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Эл. почта</FormLabel>
                <FormControl>
                  <Input
                    type='email'
                    placeholder='admin@example.com'
                    autoComplete='email'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type='submit'
            className='w-full'
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting
              ? 'Отправка...'
              : 'Отправить инструкции'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
