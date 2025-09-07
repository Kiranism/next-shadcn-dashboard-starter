/**
 * @file: src/features/projects/components/user-create-dialog.tsx
 * @description: Модальный диалог для создания нового пользователя
 * @project: SaaS Bonus System
 * @dependencies: React Hook Form, Zod, Shadcn Dialog
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { DatePicker } from '@/components/ui/date-picker';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { User, Mail, Phone, Calendar } from 'lucide-react';

const userCreateSchema = z
  .object({
    firstName: z
      .string()
      .min(1, 'Имя обязательно')
      .max(50, 'Имя слишком длинное'),
    lastName: z.string().max(50, 'Фамилия слишком длинная').optional(),
    email: z.string().email('Некорректный email').optional().or(z.literal('')),
    phone: z
      .string()
      .min(10, 'Некорректный номер телефона')
      .optional()
      .or(z.literal('')),
    birthDate: z.string().optional().or(z.literal(''))
  })
  .refine((data) => data.email || data.phone, {
    message: 'Необходимо указать email или телефон',
    path: ['email']
  });

type UserCreateFormData = z.infer<typeof userCreateSchema>;

interface UserCreateDialogProps {
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: (user: any) => void;
}

export function UserCreateDialog({
  projectId,
  open,
  onOpenChange,
  onSuccess
}: UserCreateDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<UserCreateFormData>({
    resolver: zodResolver(userCreateSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      birthDate: ''
    }
  });

  const onSubmit = async (data: UserCreateFormData) => {
    try {
      setLoading(true);

      // Подготавливаем данные для отправки
      const payload = {
        firstName: data.firstName,
        lastName: data.lastName || null,
        email: data.email || null,
        phone: data.phone || null,
        birthDate: data.birthDate || null
      };

      const response = await fetch(`/api/projects/${projectId}/users`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка создания пользователя');
      }

      const user = await response.json();

      toast({
        title: 'Успех',
        description: 'Пользователь успешно создан'
      });

      onSuccess(user);
      onOpenChange(false);
      form.reset();
    } catch (error: any) {
      console.error('Ошибка создания пользователя:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось создать пользователя',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='sm:max-w-[425px]'>
        <DialogHeader>
          <DialogTitle className='flex items-center space-x-2'>
            <User className='h-5 w-5' />
            <span>Добавить пользователя</span>
          </DialogTitle>
          <DialogDescription>
            Создайте нового пользователя для проекта. Укажите имя и хотя бы один
            способ связи.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <div className='grid grid-cols-1 gap-4'>
              {/* Имя (обязательное) */}
              <FormField
                control={form.control}
                name='firstName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Имя *</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Введите имя'
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Фамилия */}
              <FormField
                control={form.control}
                name='lastName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Фамилия</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Введите фамилию'
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Email */}
              <FormField
                control={form.control}
                name='email'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center space-x-2'>
                      <Mail className='h-4 w-4' />
                      <span>Email</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='email'
                        placeholder='user@example.com'
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Телефон */}
              <FormField
                control={form.control}
                name='phone'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center space-x-2'>
                      <Phone className='h-4 w-4' />
                      <span>Телефон</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        type='tel'
                        placeholder='+7 999 123-45-67'
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Дата рождения */}
              <FormField
                control={form.control}
                name='birthDate'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className='flex items-center space-x-2'>
                      <Calendar className='h-4 w-4' />
                      <span>Дата рождения</span>
                    </FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value || ''}
                        onChange={(val) => field.onChange(val || '')}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className='text-muted-foreground rounded border-l-4 border-blue-200 bg-blue-50 py-2 pl-4 text-sm'>
              <strong>Примечание:</strong> Необходимо указать хотя бы один
              способ связи (email или телефон) для возможности привязки аккаунта
              в Telegram боте.
            </div>

            <DialogFooter>
              <Button
                type='button'
                variant='outline'
                onClick={handleClose}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button type='submit' disabled={loading}>
                {loading ? 'Создание...' : 'Создать пользователя'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
