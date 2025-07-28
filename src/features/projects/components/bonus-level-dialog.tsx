/**
 * @file: src/features/projects/components/bonus-level-dialog.tsx
 * @description: Диалог для создания и редактирования уровней бонусов
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { AlertCircle, Save } from 'lucide-react';
import type { BonusLevel } from '@/types/bonus';

const bonusLevelSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Название уровня обязательно')
      .max(50, 'Название слишком длинное'),
    minAmount: z
      .number()
      .min(0, 'Минимальная сумма не может быть отрицательной'),
    maxAmount: z.number().nullable(),
    bonusPercent: z
      .number()
      .min(0.1, 'Процент бонусов должен быть больше 0')
      .max(50, 'Процент бонусов не может быть больше 50%'),
    paymentPercent: z
      .number()
      .min(1, 'Процент оплаты должен быть больше 0')
      .max(100, 'Процент оплаты не может быть больше 100%'),
    isActive: z.boolean()
  })
  .refine(
    (data) => {
      if (data.maxAmount !== null && data.maxAmount <= data.minAmount) {
        return false;
      }
      return true;
    },
    {
      message: 'Максимальная сумма должна быть больше минимальной',
      path: ['maxAmount']
    }
  );

type BonusLevelFormData = z.infer<typeof bonusLevelSchema>;

interface BonusLevelDialogProps {
  projectId: string;
  level?: BonusLevel | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function BonusLevelDialog({
  projectId,
  level,
  open,
  onOpenChange,
  onSuccess
}: BonusLevelDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [unlimitedMax, setUnlimitedMax] = useState(level?.maxAmount === null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<BonusLevelFormData>({
    resolver: zodResolver(bonusLevelSchema),
    defaultValues: {
      name: level?.name || '',
      minAmount: level?.minAmount || 0,
      maxAmount: level?.maxAmount,
      bonusPercent: level?.bonusPercent || 5,
      paymentPercent: level?.paymentPercent || 10,
      isActive: level?.isActive ?? true
    }
  });

  const handleUnlimitedMaxChange = (checked: boolean) => {
    setUnlimitedMax(checked);
    setValue('maxAmount', checked ? null : 10000);
  };

  const onSubmit = async (data: BonusLevelFormData) => {
    try {
      setLoading(true);

      const url = level
        ? `/api/projects/${projectId}/bonus-levels/${level.id}`
        : `/api/projects/${projectId}/bonus-levels`;

      const method = level ? 'PUT' : 'POST';

      const payload = {
        ...data,
        maxAmount: unlimitedMax ? null : data.maxAmount
      };

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        toast({
          title: 'Успех',
          description: level ? 'Уровень обновлен' : 'Уровень создан'
        });
        onSuccess();
        reset();
      } else {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }
    } catch (error) {
      console.error('Ошибка сохранения уровня:', error);
      toast({
        title: 'Ошибка',
        description:
          error instanceof Error
            ? error.message
            : 'Не удалось сохранить уровень',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    reset();
    setUnlimitedMax(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>
            {level ? 'Редактировать уровень' : 'Создать уровень'}
          </DialogTitle>
          <DialogDescription>
            {level
              ? 'Измените параметры уровня бонусной программы'
              : 'Создайте новый уровень бонусной программы'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className='space-y-4'>
          {/* Name */}
          <div className='space-y-2'>
            <Label htmlFor='name'>Название уровня</Label>
            <Input
              id='name'
              placeholder='Базовый, Серебряный, Золотой...'
              {...register('name')}
            />
            {errors.name && (
              <p className='text-sm text-red-600'>{errors.name.message}</p>
            )}
          </div>

          {/* Min Amount */}
          <div className='space-y-2'>
            <Label htmlFor='minAmount'>Минимальная сумма покупок (₽)</Label>
            <Input
              id='minAmount'
              type='number'
              step='100'
              placeholder='0'
              {...register('minAmount', { valueAsNumber: true })}
            />
            {errors.minAmount && (
              <p className='text-sm text-red-600'>{errors.minAmount.message}</p>
            )}
          </div>

          {/* Max Amount */}
          <div className='space-y-2'>
            <Label>Максимальная сумма покупок</Label>
            <div className='mb-2 flex items-center space-x-2'>
              <Switch
                checked={unlimitedMax}
                onCheckedChange={handleUnlimitedMaxChange}
              />
              <Label className='text-sm'>Без ограничений</Label>
            </div>
            {!unlimitedMax && (
              <Input
                type='number'
                step='100'
                placeholder='10000'
                {...register('maxAmount', { valueAsNumber: true })}
              />
            )}
            {errors.maxAmount && (
              <p className='text-sm text-red-600'>{errors.maxAmount.message}</p>
            )}
          </div>

          {/* Bonus Percent */}
          <div className='space-y-2'>
            <Label htmlFor='bonusPercent'>Процент начисления бонусов (%)</Label>
            <Input
              id='bonusPercent'
              type='number'
              step='0.1'
              min='0.1'
              max='50'
              placeholder='5'
              {...register('bonusPercent', { valueAsNumber: true })}
            />
            {errors.bonusPercent && (
              <p className='text-sm text-red-600'>
                {errors.bonusPercent.message}
              </p>
            )}
            <p className='text-xs text-gray-600'>
              Сколько процентов от покупки начисляется в виде бонусов
            </p>
          </div>

          {/* Payment Percent */}
          <div className='space-y-2'>
            <Label htmlFor='paymentPercent'>
              Максимальный процент оплаты бонусами (%)
            </Label>
            <Input
              id='paymentPercent'
              type='number'
              step='1'
              min='1'
              max='100'
              placeholder='10'
              {...register('paymentPercent', { valueAsNumber: true })}
            />
            {errors.paymentPercent && (
              <p className='text-sm text-red-600'>
                {errors.paymentPercent.message}
              </p>
            )}
            <p className='text-xs text-gray-600'>
              Максимальный процент заказа, который можно оплатить бонусами
            </p>
          </div>

          {/* Active Switch */}
          <div className='flex items-center justify-between rounded-lg border p-4'>
            <div>
              <Label className='text-base'>Активный уровень</Label>
              <p className='text-sm text-gray-600'>
                Включить этот уровень в бонусную программу
              </p>
            </div>
            <Switch
              {...register('isActive')}
              checked={watch('isActive')}
              onCheckedChange={(checked) => setValue('isActive', checked)}
            />
          </div>

          {/* Warning */}
          <Alert>
            <AlertCircle className='h-4 w-4' />
            <AlertDescription>
              Убедитесь, что диапазоны сумм не пересекаются с другими уровнями.
              Пользователи получают уровень автоматически при достижении нужной
              суммы покупок.
            </AlertDescription>
          </Alert>

          {/* Actions */}
          <div className='flex justify-end space-x-2 pt-4'>
            <Button
              type='button'
              variant='outline'
              onClick={handleClose}
              disabled={loading}
            >
              Отмена
            </Button>
            <Button type='submit' disabled={loading}>
              <Save className='mr-2 h-4 w-4' />
              {loading ? 'Сохранение...' : level ? 'Обновить' : 'Создать'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
