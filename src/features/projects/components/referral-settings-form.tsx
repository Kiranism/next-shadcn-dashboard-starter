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
import {
  Save,
  AlertCircle,
  Users,
  Gift,
  DollarSign,
  Percent
} from 'lucide-react';
import type {
  ReferralProgram,
  Project,
  WelcomeRewardType
} from '@/types/bonus';
import { getReferralLinkExample } from '@/lib/utils/referral-link';

const referralLevelSchema = z.object({
  level: z.number().int().min(1).max(3),
  percent: z
    .number()
    .min(0, 'Процент не может быть отрицательным')
    .max(100, 'Процент не может быть больше 100'),
  isActive: z.boolean().optional()
});

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
  welcomeRewardType: z.enum(['BONUS', 'DISCOUNT']).default('BONUS'),
  welcomeBonus: z
    .number()
    .min(0, 'Приветственный бонус не может быть отрицательным')
    .max(100000, 'Слишком большой бонус')
    .default(0),
  firstPurchaseDiscountPercent: z
    .number()
    .int()
    .min(0, 'Скидка не может быть отрицательной')
    .max(100, 'Скидка не может быть больше 100%')
    .default(0),
  minPurchaseAmount: z
    .number()
    .min(0, 'Минимальная сумма покупки не может быть отрицательной'),
  cookieLifetime: z
    .number()
    .min(1, 'Время жизни cookie должно быть больше 0')
    .max(365, 'Время жизни cookie не может быть больше года')
    .max(365, 'Время жизни cookie не может быть больше года'),
  levels: z
    .array(referralLevelSchema)
    .length(3, 'Нужно задать параметры для трёх уровней')
});

type ReferralProgramFormData = z.infer<typeof referralProgramSchema>;

interface ReferralSettingsFormProps {
  projectId: string;
  referralProgram?: ReferralProgram | null;
  project?: Project | null;
  onSuccess: () => void;
}

export function ReferralSettingsForm({
  projectId,
  referralProgram,
  project,
  onSuccess
}: ReferralSettingsFormProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const initialLevels = [1, 2, 3].map((level) => {
    const existing = referralProgram?.levels?.find(
      (lvl) => lvl.level === level
    );
    return {
      level,
      percent:
        existing?.percent ??
        (level === 1 ? (referralProgram?.referrerBonus ?? 0) : 0),
      isActive: existing ? existing.isActive : level === 1
    };
  });

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
      welcomeRewardType:
        (referralProgram?.welcomeRewardType as WelcomeRewardType) ?? 'BONUS',
      welcomeBonus: (() => {
        try {
          if (typeof referralProgram?.welcomeBonus === 'number') {
            return referralProgram.welcomeBonus;
          }
          const meta = referralProgram?.description
            ? JSON.parse(referralProgram.description)
            : {};
          return typeof meta?.welcomeBonus === 'number' ? meta.welcomeBonus : 0;
        } catch {
          return 0;
        }
      })(),
      firstPurchaseDiscountPercent:
        referralProgram?.firstPurchaseDiscountPercent ?? 10,
      minPurchaseAmount: referralProgram?.minPurchaseAmount ?? 0,
      cookieLifetime: referralProgram?.cookieLifetime ?? 30,
      levels: initialLevels
    }
  });

  const onSubmit = async (data: ReferralProgramFormData) => {
    try {
      setLoading(true);

      const levelOnePercent =
        data.levels?.find((lvl) => lvl.level === 1)?.percent ??
        data.referrerBonus;
      const payload = {
        ...data,
        referrerBonus: levelOnePercent
      };

      const response = await fetch(
        `/api/projects/${projectId}/referral-program`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
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
  const levels = watch('levels');
  const levelOnePercent = levels?.find((lvl) => lvl.level === 1)?.percent || 0;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className='space-y-6'>
      {/* Main Settings */}
      {project?.enablePartnerRoles && (
        <Alert>
          <Users className='h-4 w-4' />
          <AlertDescription className='text-sm'>
            Эта вкладка настраивает <strong>вознаграждение для клиентов</strong>{' '}
            (приветственные бонусы, % с первой покупки). Комиссии партнёрам
            (тренер / менеджер / директор) настраиваются во вкладке{' '}
            <strong>«Комиссии»</strong>.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Основные настройки</CardTitle>
          <CardDescription>
            {project?.enablePartnerRoles
              ? 'Бонусы и условия для новых клиентов, пришедших по реф-ссылке'
              : 'Основные параметры реферальной программы'}
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

              {/* Welcome Bonus */}
              <div className='space-y-4 rounded-lg border p-4'>
                <div>
                  <Label className='flex items-center space-x-2 text-base'>
                    <Gift className='h-4 w-4 text-emerald-600' />
                    <span>Приветственное вознаграждение</span>
                  </Label>
                  <p className='mt-1 text-sm text-gray-600'>
                    Выберите тип вознаграждения для новых пользователей при
                    регистрации
                  </p>
                </div>

                {/* Reward Type Selector */}
                <div className='grid grid-cols-2 gap-3'>
                  <button
                    type='button'
                    onClick={() => setValue('welcomeRewardType', 'BONUS')}
                    className={`rounded-lg border-2 p-3 text-left transition-colors ${
                      watch('welcomeRewardType') === 'BONUS'
                        ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className='flex items-center space-x-2'>
                      <Gift className='h-5 w-5 text-emerald-600' />
                      <span className='font-medium'>Бонусы</span>
                    </div>
                    <p className='mt-1 text-xs text-gray-600'>
                      Начислить фиксированную сумму бонусов при регистрации
                    </p>
                  </button>
                  <button
                    type='button'
                    onClick={() => setValue('welcomeRewardType', 'DISCOUNT')}
                    className={`rounded-lg border-2 p-3 text-left transition-colors ${
                      watch('welcomeRewardType') === 'DISCOUNT'
                        ? 'border-purple-500 bg-purple-50 dark:bg-purple-950'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className='flex items-center space-x-2'>
                      <Percent className='h-5 w-5 text-purple-600' />
                      <span className='font-medium'>Скидка</span>
                    </div>
                    <p className='mt-1 text-xs text-gray-600'>
                      Процентная скидка на первую покупку
                    </p>
                  </button>
                </div>

                {/* Conditional Fields */}
                {watch('welcomeRewardType') === 'BONUS' ? (
                  <div className='space-y-2'>
                    <Label htmlFor='welcomeBonus'>
                      Сумма приветственных бонусов
                    </Label>
                    <Input
                      id='welcomeBonus'
                      type='number'
                      step='1'
                      min='0'
                      placeholder='0'
                      {...register('welcomeBonus', { valueAsNumber: true })}
                    />
                    {errors.welcomeBonus && (
                      <p className='text-sm text-red-600'>
                        {errors.welcomeBonus.message}
                      </p>
                    )}
                    <p className='text-xs text-gray-600'>
                      Фиксированное начисление при регистрации. Срок действия —
                      как в настройке проекта.
                    </p>
                  </div>
                ) : (
                  <div className='space-y-2'>
                    <Label htmlFor='firstPurchaseDiscountPercent'>
                      Скидка на первую покупку (%)
                    </Label>
                    <Input
                      id='firstPurchaseDiscountPercent'
                      type='number'
                      step='1'
                      min='0'
                      max='100'
                      placeholder='10'
                      {...register('firstPurchaseDiscountPercent', {
                        valueAsNumber: true
                      })}
                    />
                    {errors.firstPurchaseDiscountPercent && (
                      <p className='text-sm text-red-600'>
                        {errors.firstPurchaseDiscountPercent.message}
                      </p>
                    )}
                    <p className='text-xs text-gray-600'>
                      Процент скидки, который будет применён к первой покупке
                      нового пользователя. Скидка действует однократно.
                    </p>
                  </div>
                )}
              </div>

              <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
                {/* Min Purchase Amount */}
                <div className='space-y-2'>
                  <Label
                    htmlFor='minPurchaseAmount'
                    className='flex items-center space-x-2'
                  >
                    <DollarSign className='h-4 w-4 text-purple-600' />
                    <span>Минимальная сумма покупки (руб.)</span>
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

              <div className='space-y-3 rounded-lg border p-4'>
                <div>
                  <Label className='text-base'>Многоуровневая программа</Label>
                  <p className='text-sm text-gray-600'>
                    {project?.enablePartnerRoles
                      ? 'Шаблон для кнопки «Создать план из текущей программы». Реальные выплаты партнёрам — во вкладке «Комиссии».'
                      : 'Настройте проценты начислений для каждого уровня рефералов'}
                  </p>
                </div>
                {project?.enablePartnerRoles && (
                  <Alert>
                    <AlertCircle className='h-4 w-4' />
                    <AlertDescription className='text-sm'>
                      При включённых персональных планах этот блок не влияет на
                      выплаты. Используйте его только чтобы быстро создать план
                      комиссий с теми же процентами.
                    </AlertDescription>
                  </Alert>
                )}
                <div className='grid gap-4 md:grid-cols-3'>
                  {levels?.map((levelField, index) => {
                    const fieldBase = `levels.${index}` as const;
                    const isLevelActive = levelField?.isActive ?? false;
                    const levelDescriptions = project?.enablePartnerRoles
                      ? [
                          '→ Тренер (L1), комиссия в «Комиссии»',
                          '→ Менеджер (L2)',
                          '→ Директор (L3)'
                        ]
                      : [
                          'Прямые приглашения',
                          'Рефералы ваших рефералов',
                          'Третий уровень сети'
                        ];
                    return (
                      <div
                        key={levelField.level}
                        className='space-y-3 rounded-lg border p-4'
                      >
                        <input
                          type='hidden'
                          {...register(`${fieldBase}.level`, {
                            valueAsNumber: true
                          })}
                        />
                        <div className='flex items-center justify-between'>
                          <div>
                            <p className='font-semibold'>
                              Уровень {levelField.level}
                            </p>
                            <p className='text-muted-foreground text-xs'>
                              {levelDescriptions[index]}
                            </p>
                          </div>
                          <Switch
                            checked={isLevelActive}
                            onCheckedChange={(checked) =>
                              setValue(`${fieldBase}.isActive`, checked, {
                                shouldDirty: true
                              })
                            }
                          />
                        </div>
                        <Input
                          type='number'
                          step='0.1'
                          min='0'
                          max='100'
                          disabled={!isLevelActive}
                          placeholder='0'
                          {...register(`${fieldBase}.percent`, {
                            valueAsNumber: true
                          })}
                        />
                        {errors.levels?.[index]?.percent && (
                          <p className='text-sm text-red-600'>
                            {errors.levels[index]?.percent?.message}
                          </p>
                        )}
                      </div>
                    );
                  })}
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
                • Пользователь переходит по ссылке вида{' '}
                <code>{getReferralLinkExample(project?.domain)}</code>
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
                <p className='mb-2 font-medium'>Покупка на 5 000 руб.</p>
                <div className='space-y-1 text-gray-600'>
                  <p>
                    Рефер получит:{' '}
                    {(((levelOnePercent || 0) * 5000) / 100).toFixed(0)} бонусов
                  </p>
                  <p>
                    Новый пользователь:{' '}
                    {(((watch('refereeBonus') || 0) * 5000) / 100).toFixed(0)}{' '}
                    бонусов
                  </p>
                </div>
              </div>
              <div className='rounded-lg border p-3'>
                <p className='mb-2 font-medium'>Покупка на 10 000 руб.</p>
                <div className='space-y-1 text-gray-600'>
                  <p>
                    Рефер получит:{' '}
                    {(((levelOnePercent || 0) * 10000) / 100).toFixed(0)}{' '}
                    бонусов
                  </p>
                  <p>
                    Новый пользователь:{' '}
                    {(((watch('refereeBonus') || 0) * 10000) / 100).toFixed(0)}{' '}
                    бонусов
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
