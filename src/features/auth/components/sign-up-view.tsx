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
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Link from 'next/link';

const formSchema = z
  .object({
    email: z.string().email({ message: 'Введите корректный email' }),
    password: z
      .string()
      .min(8, { message: 'Пароль должен содержать минимум 8 символов' }),
    confirmPassword: z.string()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Пароли не совпадают',
    path: ['confirmPassword']
  });

type FormValues = z.infer<typeof formSchema>;

export default function SignUpViewPage() {
  return (
    <div className='relative container grid h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-1 lg:px-0'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]'>
        <div className='flex flex-col space-y-2 text-center'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Создать аккаунт
          </h1>
          <p className='text-muted-foreground text-sm'>
            Зарегистрируйтесь как администратор системы
          </p>
        </div>
        <AuthForm />
        <p className='text-muted-foreground px-8 text-center text-sm'>
          Уже есть аккаунт?{' '}
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

function AuthForm() {
  const router = useRouter();
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: { email: '', password: '', confirmPassword: '' }
  });

  async function onSubmit(values: FormValues) {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: values.email,
          password: values.password
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const apiError = (data?.error as string) || 'Ошибка регистрации';
        if (data?.details?.fieldErrors) {
          const fieldErrors = data.details.fieldErrors as Record<string, string[]>;
          Object.entries(fieldErrors).forEach(([key, messages]) => {
            // у нас нет confirmPassword с сервера, оставим только известные поля
            if (key === 'email' || key === 'password') {
              form.setError(key as keyof FormValues, {
                type: 'server',
                message: messages?.[0] ?? apiError
              });
            }
          });
        }
        throw new Error(apiError);
      }

      toast.success('Регистрация выполнена успешно');
      router.push('/dashboard');
      router.refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Ошибка регистрации';
      toast.error(message);
    }
  }

  return (
    <div className='grid gap-6'>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
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
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Пароль</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='Минимум 8 символов'
                    autoComplete='new-password'
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name='confirmPassword'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Подтвердите пароль</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='Повторите пароль'
                    autoComplete='new-password'
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
              ? 'Регистрация...'
              : 'Зарегистрироваться'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
