/**
 * @file: src/features/projects/components/referral-settings-form.tsx
 * @description: Форма настроек реферальной программы
 * @project: SaaS Bonus System
 * @dependencies: React, Shadcn/ui, React Hook Form, Zod
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { Save, AlertCircle, Users, Gift, DollarSign } from 'lucide-react';
import type { ReferralProgram } from '@/types/bonus';

const referralProgramSchema = z.object({
  isActive: z.boolean(),
  referrerBonus: z
    .number()
    .min(0, 'Бонус рефереру не может быть отрицательным')
    .max(50, 'Бонус рефереру не может быть больше 50%'),
  refereeBonus: z
    .number()
    .min(0, 'Бонус новому пользователю не может быть отрицательным')
    .max(50, 'Бонус новому пользователю не может быть больше 50%'),
  minPurchaseAmount: z
    .number()
    .min(0, 'Минимальная сумма покупки не может быть отрицательной'),
  cookieLifetime: z
    .number()
    .min(1, 'Время жизни cookie должно быть больше 0')
    .max(365, 'Время жизни cookie не может быть больше года')
});

type ReferralProgramFormData = z.infer<typeof referralProgramSchema>;

interface ReferralSettingsFormProps {
  projectId: string;
  referralProgram?: ReferralProgram | null;
  onSuccess: () => void;
}

export function ReferralSettingsForm({
  projectId,
  referralProgram,
  onSuccess
}: ReferralSettingsFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors }
  } = useForm<ReferralProgramFormData>({
    resolver: zodResolver(referralProgramSchema),
    defaultValues: {
      isActive: referralProgram?.isActive ?? false,
      referrerBonus: referralProgram?.referrerBonus ?? 10,
      refereeBonus: referralProgram?.refereeBonus ?? 5,
      minPurchaseAmount: referralProgram?.minPurchaseAmount ?? 0,
      cookieLifetime: referralProgram?.cookieLifetime ?? 30
    }
  });

  const onSubmit = async (data: ReferralProgramFormData) => {
    try {
      setLoading(true);

      const response = await fetch(
        `/api/projects/${projectId}/referral-program`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(data)
        }
      );

      if (response.ok) {
        toast({
          title: 'Успех',
          description: 'Настройки реферальной программы обновлены'
        });
        onSuccess();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения настроек:', error);
      toast({
        title: 'Ошибка',
        description:
          error instanceof Error
            ? error.message
            : 'Не удалось сохранить настройки',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const isActive = watch('isActive');

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      {/* Main Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Основные настройки</CardTitle>
          <CardDescription>
            Основные параметры реферальной программы
          </CardDescription>
        </CardHeader>
        <CardContent className='space-y-6'>
          {/* Active Switch */}
          <div className='flex items-center justify-between rounded-lg border p-4'>
            <div>
              <Label className='text-base'>
                Активировать реферальную программу
              </Label>
              <p className='text-sm text-gray-600'>
                Включить отслеживание рефералов через UTM метки и начисление
                бонусов
              </p>
            </div>
            <Switch
              {...register('isActive')}
              checked={isActive}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
          </div>

          {isActive && (
            <>
              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {/* Referrer Bonus */}
                <div className='space-y-2'>
                  <Label
                    htmlFor='referrerBonus'
                    className='flex items-center space-x-2'
                  >
                    <Users className='h-4 w-4 text-blue-600' />
                    <span>Бонус рефереру (%)</span>
                  </Label>
                  <Input
                    id='referrerBonus'
                    type='number'
                    step='0.1'
                    min='0'
                    max='50'
                    placeholder='10'
                    {...register('referrerBonus', { valueAsNumber: true })}
                  />
                  {errors.referrerBonus && (
                    <p className='text-sm text-red-600'>
                      {errors.referrerBonus.message}
                    </p>
                  )}
                  <p className='text-xs text-gray-600'>
                    Процент от первой покупки реферала, который получает рефер
                  </p>
                </div>

                {/* Referee Bonus */}
                <div className='space-y-2'>
                  <Label
                    htmlFor='refereeBonus'
                    className='flex items-center space-x-2'
                  >
                    <Gift className='h-4 w-4 text-green-600' />
                    <span>Бонус новому пользователю (%)</span>
                  </Label>
                  <Input
                    id='refereeBonus'
                    type='number'
                    step='0.1'
                    min='0'
                    max='50'
                    placeholder='5'
                    {...register('refereeBonus', { valueAsNumber: true })}
                  />
                  {errors.refereeBonus && (
                    <p className='text-sm text-red-600'>
                      {errors.refereeBonus.message}
                    </p>
                  )}
                  <p className='text-xs text-gray-600'>
                    Процент от первой покупки, который получает новый
                    пользователь
                  </p>
                </div>
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {/* Min Purchase Amount */}
                <div className='space-y-2'>
                  <Label
                    htmlFor='minPurchaseAmount'
                    className='flex items-center space-x-2'
                  >
                    <DollarSign className='h-4 w-4 text-purple-600' />
                    <span>Минимальная сумма покупки (₽)</span>
                  </Label>
                  <Input
                    id='minPurchaseAmount'
                    type='number'
                    step='100'
                    min='0'
                    placeholder='0'
                    {...register('minPurchaseAmount', { valueAsNumber: true })}
                  />
                  {errors.minPurchaseAmount && (
                    <p className='text-sm text-red-600'>
                      {errors.minPurchaseAmount.message}
                    </p>
                  )}
                  <p className='text-xs text-gray-600'>
                    Минимальная сумма покупки для начисления реферальных бонусов
                  </p>
                </div>

                {/* Cookie Lifetime */}
                <div className='space-y-2'>
                  <Label htmlFor='cookieLifetime'>
                    Время отслеживания (дни)
                  </Label>
                  <Input
                    id='cookieLifetime'
                    type='number'
                    min='1'
                    max='365'
                    placeholder='30'
                    {...register('cookieLifetime', { valueAsNumber: true })}
                  />
                  {errors.cookieLifetime && (
                    <p className='text-sm text-red-600'>
                      {errors.cookieLifetime.message}
                    </p>
                  )}
                  <p className='text-xs text-gray-600'>
                    Сколько дней после перехода по реферальной ссылке
                    засчитывается реферал
                  </p>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Info Alert */}
      <Alert>
        <AlertCircle className='h-4 w-4' />
        <AlertDescription>
          <div className='space-y-2'>
            <p className='font-medium'>Как работает реферальная программа:</p>
            <ul className='ml-4 space-y-1 text-sm'>
              <li>
                • Пользователь переходит по ссылке с UTM метками (utm_source,
                utm_medium, utm_campaign)
              </li>
              <li>
                • При регистрации новый пользователь автоматически привязывается
                к рефереру
              </li>
              <li>
                • При первой покупке начисляются бонусы и рефереру, и новому
                пользователю
              </li>
              <li>
                • Минимальная сумма покупки учитывается при начислении бонусов
              </li>
            </ul>
          </div>
        </AlertDescription>
      </Alert>

      {/* Example scenarios */}
      {isActive && (
        <Card>
          <CardHeader>
            <CardTitle>Примеры начислений</CardTitle>
            <CardDescription>
              Как будут начисляться бонусы при текущих настройках
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-2'>
              <div className='rounded-lg border p-3'>
                <p className='mb-2 font-medium'>Покупка на 5 000 ₽</p>
                <div className='space-y-1 text-gray-600'>
                  <p>
                    Рефер получит:{' '}
                    {(((watch('referrerBonus') || 0) * 5000) / 100).toFixed(0)}{' '}
                    ₽
                  </p>
                  <p>
                    Новый пользователь:{' '}
                    {(((watch('refereeBonus') || 0) * 5000) / 100).toFixed(0)} ₽
                  </p>
                </div>
              </div>
              <div className='rounded-lg border p-3'>
                <p className='mb-2 font-medium'>Покупка на 10 000 ₽</p>
                <div className='space-y-1 text-gray-600'>
                  <p>
                    Рефер получит:{' '}
                    {(((watch('referrerBonus') || 0) * 10000) / 100).toFixed(0)}{' '}
                    ₽
                  </p>
                  <p>
                    Новый пользователь:{' '}
                    {(((watch('refereeBonus') || 0) * 10000) / 100).toFixed(0)}{' '}
                    ₽
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Actions */}
      <div className='flex justify-end'>
        <Button type='submit' disabled={loading}>
          <Save className='mr-2 h-4 w-4' />
          {loading ? 'Сохранение...' : 'Сохранить настройки'}
        </Button>
      </div>
    </form>
  );
}
