'use client';

/**
 * @file: integration-form.tsx
 * @description: InSales Integration Configuration Form
 * @project: SaaS Bonus System
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Loader2, Save, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const formSchema = z.object({
  apiKey: z.string().min(1, 'API Key обязателен'),
  apiPassword: z.string().min(1, 'API Password обязателен'),
  shopDomain: z
    .string()
    .min(1, 'Shop Domain обязателен')
    .regex(/^[a-zA-Z0-9-]+\.myinsales\.ru$/, 'Формат: yourshop.myinsales.ru'),
  bonusPercent: z.number().min(0).max(100),
  maxBonusSpend: z.number().min(0).max(100),
  useProjectSettings: z.boolean(),
  widgetEnabled: z.boolean(),
  showProductBadges: z.boolean(),
  isActive: z.boolean()
});

type FormValues = z.infer<typeof formSchema>;

interface InSalesIntegrationFormProps {
  projectId: string;
  integration: any | null;
  defaultBonusPercent: number;
}

export function InSalesIntegrationForm({
  projectId,
  integration,
  defaultBonusPercent
}: InSalesIntegrationFormProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiKey: integration?.apiKey || '',
      apiPassword: '', // Не показываем сохраненный пароль
      shopDomain: integration?.shopDomain || '',
      bonusPercent: integration?.bonusPercent || defaultBonusPercent,
      maxBonusSpend: integration?.maxBonusSpend || 50,
      useProjectSettings: integration?.useProjectSettings ?? true,
      widgetEnabled: integration?.widgetEnabled ?? true,
      showProductBadges: integration?.showProductBadges ?? true,
      isActive: integration?.isActive ?? true
    }
  });

  const useProjectSettings = form.watch('useProjectSettings');

  async function onSubmit(data: FormValues) {
    try {
      setLoading(true);

      const method = integration ? 'PUT' : 'POST';
      const response = await fetch(
        `/api/projects/${projectId}/integrations/insales`,
        {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to save integration');
      }

      toast({
        title: 'Успешно сохранено',
        description: integration
          ? 'Настройки InSales интеграции обновлены'
          : 'InSales интеграция активирована'
      });

      router.refresh();
    } catch (error) {
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
  }

  async function onDelete() {
    if (!confirm('Вы уверены? Это действие нельзя отменить.')) {
      return;
    }

    try {
      setDeleting(true);

      const response = await fetch(
        `/api/projects/${projectId}/integrations/insales`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        throw new Error('Failed to delete integration');
      }

      toast({
        title: 'Интеграция удалена',
        description: 'InSales интеграция успешно удалена'
      });

      router.refresh();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description: 'Не удалось удалить интеграцию',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Настройки интеграции</CardTitle>
        <CardDescription>
          Настройте параметры подключения к InSales магазину
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
            {/* API Credentials */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium'>Учётные данные API</h3>

              <FormField
                control={form.control}
                name='apiKey'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Key</FormLabel>
                    <FormControl>
                      <Input
                        placeholder='Введите API Key из InSales'
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Получите в админ-панели InSales: Настройки → API
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='apiPassword'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>API Password</FormLabel>
                    <FormControl>
                      <Input
                        type='password'
                        placeholder={
                          integration ? '••••••••' : 'Введите API Password'
                        }
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {integration
                        ? 'Оставьте пустым, чтобы не менять пароль'
                        : 'API Password из InSales'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='shopDomain'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Домен магазина</FormLabel>
                    <FormControl>
                      <Input placeholder='yourshop.myinsales.ru' {...field} />
                    </FormControl>
                    <FormDescription>
                      Домен вашего магазина в InSales
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Settings Inheritance */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium'>Управление настройками</h3>

              <FormField
                control={form.control}
                name='useProjectSettings'
                render={({ field }) => (
                  <FormItem className='bg-muted/30 flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base font-semibold tracking-tight uppercase'>
                        Использовать настройки проекта
                      </FormLabel>
                      <FormDescription>
                        Процент начисления и лимиты будут наследоваться из общих
                        настроек проекта.
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Bonus Settings */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium'>Настройки бонусов</h3>

              <FormField
                control={form.control}
                name='bonusPercent'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Процент начисления бонусов (%)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        max='100'
                        disabled={useProjectSettings}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {useProjectSettings
                        ? `Используется значение проекта: ${defaultBonusPercent}%`
                        : 'Сколько процентов от суммы покупки начислять бонусами'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='maxBonusSpend'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Максимум оплаты бонусами (%)</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        max='100'
                        disabled={useProjectSettings}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      {useProjectSettings
                        ? 'Лимит оплаты бонусами будет взят из настроек уровней лояльности проекта'
                        : 'Максимальный процент заказа, который можно оплатить бонусами'}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Widget Settings */}
            <div className='space-y-4'>
              <h3 className='text-sm font-medium'>Настройки виджета</h3>

              <FormField
                control={form.control}
                name='widgetEnabled'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>
                        Включить виджет
                      </FormLabel>
                      <FormDescription>
                        Показывать виджет баланса бонусов на сайте
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='showProductBadges'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>
                        Показывать бейджи на товарах
                      </FormLabel>
                      <FormDescription>
                        Отображать сколько бонусов можно получить за покупку
                        товара
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='isActive'
                render={({ field }) => (
                  <FormItem className='flex flex-row items-center justify-between rounded-lg border p-4'>
                    <div className='space-y-0.5'>
                      <FormLabel className='text-base'>Активна</FormLabel>
                      <FormDescription>
                        Включить/выключить интеграцию
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className='flex items-center gap-4'>
              <Button type='submit' disabled={loading}>
                {loading && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
                <Save className='mr-2 h-4 w-4' />
                {integration ? 'Обновить' : 'Активировать'}
              </Button>

              {integration && (
                <Button
                  type='button'
                  variant='destructive'
                  onClick={onDelete}
                  disabled={deleting}
                >
                  {deleting && (
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                  )}
                  <Trash2 className='mr-2 h-4 w-4' />
                  Удалить интеграцию
                </Button>
              )}
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function Separator() {
  return <div className='border-t' />;
}
