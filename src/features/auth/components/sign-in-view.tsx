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

const formSchema = z.object({
  email: z.string().email({ message: 'Введите корректный email' }),
  password: z.string().min(1, { message: 'Пароль обязателен' })
});

type FormValues = z.infer<typeof formSchema>;

export default function SignInViewPage({ stars }: { stars: number }) {
  return (
    <div className='relative container grid h-screen flex-col items-center justify-center lg:max-w-none lg:grid-cols-1 lg:px-0'>
      <div className='mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[400px]'>
        <div className='flex flex-col space-y-2 text-center'>
          <h1 className='text-2xl font-semibold tracking-tight'>
            Добро пожаловать
          </h1>
          <p className='text-muted-foreground text-sm'>
            Войдите в свой аккаунт
          </p>
        </div>
        <AuthForm />
        <p className='text-muted-foreground px-8 text-center text-sm'>
          Нет аккаунта?{' '}
          <Link
            href='/auth/sign-up'
            className='hover:text-primary underline underline-offset-4'
          >
            Зарегистрироваться
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
    defaultValues: { email: '', password: '' }
  });

  async function onSubmit(values: FormValues) {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const apiError = (data?.error as string) || 'Ошибка входа';
        // Пробросить ошибки в форму, если есть детали
        if (data?.details?.fieldErrors) {
          const fieldErrors = data.details.fieldErrors as Record<string, string[]>;
          Object.entries(fieldErrors).forEach(([key, messages]) => {
            form.setError(key as keyof FormValues, {
              type: 'server',
              message: messages?.[0] ?? apiError
            });
          });
        }
        throw new Error(apiError);
      }

      toast.success('Вход выполнен успешно');
      router.push('/dashboard');
      router.refresh();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Ошибка входа';
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
                <div className='flex items-center justify-between'>
                  <FormLabel>Пароль</FormLabel>
                  <Link
                    href='/auth/forgot-password'
                    className='text-muted-foreground hover:text-primary text-sm underline underline-offset-4'
                  >
                    Забыли пароль?
                  </Link>
                </div>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='Введите пароль'
                    autoComplete='current-password'
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
            {form.formState.isSubmitting ? 'Вход...' : 'Войти'}
          </Button>
        </form>
      </Form>
    </div>
  );
}
