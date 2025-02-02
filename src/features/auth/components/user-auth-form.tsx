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
import { zodResolver } from '@hookform/resolvers/zod';
import { signIn } from 'next-auth/react';
import { useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' }),
  adminCode: z.string().optional()
});

type UserFormValue = z.infer<typeof formSchema>;

interface UserAuthFormProps {
  isRegister: boolean;
  setIsRegister: (value: boolean) => void;
}

export default function UserAuthForm({ isRegister, setIsRegister }: UserAuthFormProps) {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const [loading, startTransition] = useTransition();
  
  const defaultValues = {
    username: '',
    password: '',
    adminCode: ''
  };
  
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  const onSubmit = async (data: UserFormValue) => {
    startTransition(async () => {
      try {
        if (isRegister) {
          // 注册流程
          const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            const error = await response.text();
            throw new Error(error);
          }

          // 注册成功后直接登录
          const signInResult = await signIn('credentials', {
            username: data.username,
            password: data.password,
            redirect: false
          });

          if (signInResult?.error) {
            throw new Error('登录失败');
          }

          toast.success('注册成功并已登录！');
          window.location.href = callbackUrl ?? '/dashboard';
        } else {
          // 登录流程
          const result = await signIn('credentials', {
            username: data.username,
            password: data.password,
            redirect: false
          });

          if (result?.error) {
            throw new Error('用户名或密码错误');
          }

          toast.success('登录成功！');
          window.location.href = callbackUrl ?? '/dashboard';
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : '操作失败');
      }
    });
  };


  return (
    <>
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className='w-full space-y-2'
        >
          <FormField
            control={form.control}
            name="username"
            render={({ field }) => (
              <FormItem>
                <FormLabel>用户名</FormLabel>
                <FormControl>
                  <Input placeholder="用户名" {...field} />
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
                <FormLabel>密码</FormLabel>
                <FormControl>
                  <Input type="password" placeholder="密码" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {isRegister && (
            <FormField
              control={form.control}
              name="adminCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>管理员码（可选）</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="如有，请输入" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}
          <Button type='submit' className='w-full' disabled={loading}>
            {isRegister ? '注册' : '登录'}
          </Button>
        </form>
      </Form>
      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t' />
        </div>
        
      </div>
      <Button
        variant='link'
        className='w-full'
        onClick={() => setIsRegister(!isRegister)}
      >
        {isRegister
          ? '已有帐户？ 点击登录'
          : "还没有帐户？ 点击注册"}
      </Button>
    </>
  );
}
