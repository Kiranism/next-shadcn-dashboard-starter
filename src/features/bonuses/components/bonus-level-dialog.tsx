/**
 * @file: bonus-level-dialog.tsx
 * @description: Диалог для создания и редактирования уровня бонусной программы
 * @project: SaaS Bonus System
 * @dependencies: React, shadcn/ui, react-hook-form
 * @created: 2025-01-28
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
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
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
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { BonusLevel } from '@/types/bonus';

const formSchema = z.object({
  name: z.string().min(1, 'Название обязательно').max(50, 'Максимум 50 символов'),
  minAmount: z.number().min(0, 'Минимальная сумма не может быть отрицательной'),
  maxAmount: z.number().optional().nullable(),
  bonusPercent: z.number().min(0).max(100, 'Процент должен быть от 0 до 100'),
  paymentPercent: z.number().min(0).max(100, 'Процент должен быть от 0 до 100'),
  isActive: z.boolean()
});

type FormValues = z.infer<typeof formSchema>;

interface BonusLevelDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  level?: BonusLevel | null;
}

export function BonusLevelDialog({
  open,
  onOpenChange,
  projectId,
  level
}: BonusLevelDialogProps) {
  const [loading, setLoading] = useState(false);
  const isEditing = !!level;

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: level?.name || '',
      minAmount: level?.minAmount || 0,
      maxAmount: level?.maxAmount || null,
      bonusPercent: level?.bonusPercent || 5,
      paymentPercent: level?.paymentPercent || 10,
      isActive: level?.isActive ?? true
    }
  });

  async function onSubmit(values: FormValues) {
    setLoading(true);

    try {
      const url = isEditing
        ? `/api/projects/${projectId}/bonus-levels/${level.id}`
        : `/api/projects/${projectId}/bonus-levels`;

      const method = isEditing ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }

      toast.success(isEditing ? 'Уровень обновлен' : 'Уровень создан');
      onOpenChange(false);
      form.reset();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Ошибка сохранения');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? 'Редактировать уровень' : 'Создать уровень'}
          </DialogTitle>
          <DialogDescription>
            Настройте параметры уровня бонусной программы
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Название уровня</FormLabel>
                  <FormControl>
                    <Input placeholder="Например: Золотой" {...field} />
                  </FormControl>
                  <FormDescription>
                    Название, которое увидят пользователи
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="minAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Минимальная сумма</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      От какой суммы покупок
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="maxAmount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Максимальная сумма</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="Не ограничено"
                        {...field}
                        value={field.value || ''}
                        onChange={(e) => {
                          const value = e.target.value;
                          field.onChange(value === '' ? null : Number(value));
                        }}
                      />
                    </FormControl>
                    <FormDescription>
                      До какой суммы (опционально)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="bonusPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Процент начисления</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Сколько бонусов начислять
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="paymentPercent"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Процент оплаты</FormLabel>
                    <FormControl>
                      <div className="flex items-center gap-2">
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                        <span className="text-muted-foreground">%</span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Макс. доля оплаты бонусами
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Активный уровень
                    </FormLabel>
                    <FormDescription>
                      Уровень будет применяться к пользователям
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

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Сохранение...' : 'Сохранить'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}