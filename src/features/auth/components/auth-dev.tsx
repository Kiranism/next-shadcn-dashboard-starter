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
import { useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

// 定义表单验证规则
const formSchema = z.object({
  username: z.string().min(3, { message: 'Username must be at least 3 characters' }),
  password: z.string().min(6, { message: 'Password must be at least 6 characters' })
});

// 推断表单值的类型
type UserFormValue = z.infer<typeof formSchema>;

export default function UserAuthForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const [loading, startTransition] = useTransition();
  const [isRegister, setIsRegister] = useState(false);

  // 默认表单值
  const defaultValues = {
    username: '',
    password: ''
  };

  // 使用 react-hook-form 管理表单状态
  const form = useForm<UserFormValue>({
    resolver: zodResolver(formSchema),
    defaultValues
  });

  // 提交表单时的处理函数
  const onSubmit = async (data: UserFormValue) => {
    startTransition(async () => {
      if (isRegister) {
        // 注册逻辑
        try {
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
          toast.success('Registered successfully!');
          setIsRegister(false); // 切换到登录界面
        } catch (error) {
          toast.error(error instanceof Error ? error.message : 'Registration failed');
        }
      } else {
        // 登录逻辑
        try {
          // 指定用户名和密码
          const validUsername = "hyperhit"; // 指定用户名
          const validPassword = "hyperhit123"; // 指定密码

          // 检查输入的用户名和密码是否匹配
          if (data.username === validUsername && data.password === validPassword) {
            toast.success('Signed in successfully!');
            window.location.href = '/dashboard'; // 登录成功后重定向
          } else {
            toast.error('Invalid credentials'); // 用户名或密码错误
          }
        } catch (error) {
          toast.error('Sign in failed'); // 登录失败
        }
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
          {/* 用户名输入框 */}
          <FormField
            control={form.control}
            name='username'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Username</FormLabel>
                <FormControl>
                  <Input
                    type='text'
                    placeholder='Enter your username'
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* 密码输入框 */}
          <FormField
            control={form.control}
            name='password'
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    type='password'
                    placeholder='Enter your password'
                    disabled={loading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          {/* 提交按钮 */}
          <Button type='submit' className='w-full' disabled={loading}>
            {isRegister ? 'Register' : 'Sign In'}
          </Button>
        </form>
      </Form>
      <div className='relative'>
        <div className='absolute inset-0 flex items-center'>
          <span className='w-full border-t' />
        </div>
      </div>
      {/* 切换注册/登录按钮 */}
      <Button
        variant='link'
        className='w-full'
        onClick={() => setIsRegister(!isRegister)}
      >
        {isRegister
          ? 'Already have an account? Sign In'
          : "Don't have an account? Register"}
      </Button>
    </>
  );
}