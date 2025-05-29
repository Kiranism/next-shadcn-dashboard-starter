'use client';

import { Button, buttonVariants } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useLogin } from '@/hooks/useMutation';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/stores/useUserStore';
import { ILoginRequestDto } from '@/types/mutation.types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { Eye, EyeOff } from 'lucide-react';
import { Metadata } from 'next';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

export const metadata: Metadata = {
  title: 'Authentication',
  description: 'Authentication forms built using the components.'
};

// Form schema
const signInSchema = z.object({
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters')
});

type SignInValues = z.infer<typeof signInSchema>;

export default function SignInViewPage() {
  const [showPassword, setShowPassword] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors }
  } = useForm<ILoginRequestDto>();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setToken, setCurrentUser } = useUserStore();
  const { mutateAsync: login, isPending } = useLogin({
    onSuccess: (data) => {
      toast.success('Signed in successfully!');
      setToken(data.data.token);
      setCurrentUser(data.data.user);
      queryClient.invalidateQueries({ queryKey: ['get-current-user'] });
      router.push('/dashboard/all-jobs');
    },
    onError: (error) => {
      toast.error(error.message || 'Failed to sign in');
    }
  });
  // Default values
  const defaultValues: Partial<SignInValues> = {
    email: '',
    password: ''
  };

  const form = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues
  });

  const onSubmit: SubmitHandler<ILoginRequestDto> = async (data) => {
    await login(data);
  };

  return (
    <div className='relative h-screen flex-col items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:px-0'>
      <Link
        href='/examples/authentication'
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'absolute top-4 right-4 hidden md:top-8 md:right-8'
        )}
      >
        Login
      </Link>
      <div className='bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r'>
        <div className='absolute inset-0 bg-zinc-900' />
        <div className='relative z-20 flex items-center text-lg font-medium'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            viewBox='0 0 24 24'
            fill='none'
            stroke='currentColor'
            strokeWidth='2'
            strokeLinecap='round'
            strokeLinejoin='round'
            className='mr-2 h-6 w-6'
          >
            <path d='M15 6v12a3 3 0 1 0 3-3H6a3 3 0 1 0 3 3V6a3 3 0 1 0-3 3h12a3 3 0 1 0-3-3' />
          </svg>
          Logo
        </div>
      </div>
      <div className='flex h-full items-center justify-center p-4 lg:p-8'>
        <div className='flex w-full max-w-md flex-col items-center justify-center space-y-6'>
          {/* Custom Sign In Form */}
          <Card className='w-full'>
            <CardHeader>
              <CardTitle>Sign In</CardTitle>
              <CardDescription>
                Enter your credentials to sign in to your account
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
                <div className='space-y-2'>
                  <Label htmlFor='email' className='text-black-100'>
                    Email
                  </Label>
                  <Input
                    id='email'
                    type='email'
                    className={
                      'h-12 w-full rounded-full border border-[#737373] px-4'
                    }
                    placeholder='Enter your email'
                    autoComplete='email' // Added autoComplete for email
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /\S+@\S+\.\S+/,
                        message: 'Invalid email address'
                      }
                    })}
                  />
                  {errors.email && (
                    <p className='text-sm text-red-500'>
                      {errors.email.message}
                    </p>
                  )}
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='password' className='text-black-100'>
                    Password
                  </Label>
                  <div className='relative'>
                    <Input
                      id='password'
                      type={showPassword ? 'text' : 'password'}
                      className={
                        'h-12 w-full rounded-full border border-[#737373] px-4'
                      }
                      placeholder='Enter your password'
                      autoComplete='current-password' // Added autoComplete for password
                      {...register('password', {
                        required: 'Password is required',
                        minLength: {
                          value: 8,
                          message: 'Password must be at least 8 characters'
                        }
                      })}
                    />
                    <button
                      type='button'
                      onClick={() => setShowPassword(!showPassword)}
                      className='absolute top-1/2 right-4 -translate-y-1/2 text-gray-500 hover:text-gray-700'
                    >
                      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className='text-sm text-red-500'>
                      {errors.password.message}
                    </p>
                  )}
                </div>
                <div className='text-right'>
                  <Link href={'/forget-password'} className='text-gray-100'>
                    Forgot Password
                  </Link>
                </div>
                <Button
                  type='submit'
                  className='h-[48px] w-full rounded-full bg-orange-600 text-base'
                  disabled={isPending}
                >
                  {isPending ? 'Logging in...' : 'Log In'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
