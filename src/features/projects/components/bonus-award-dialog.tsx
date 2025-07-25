/**
 * @file: src/features/projects/components/bonus-award-dialog.tsx
 * @description: Модальный диалог для начисления бонусов пользователю
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
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Gift, User, MessageSquare, Tag } from 'lucide-react';
import type { BonusType } from '@/types/bonus';

const bonusAwardSchema = z.object({
  amount: z.number()
    .min(1, 'Сумма должна быть больше 0')
    .max(100000, 'Максимальная сумма 100,000₽'),
  type: z.enum(['PURCHASE', 'BIRTHDAY', 'MANUAL', 'REFERRAL'], {
    required_error: 'Выберите тип бонуса'
  }),
  description: z.string()
    .min(1, 'Описание обязательно')
    .max(200, 'Описание слишком длинное')
});

type BonusAwardFormData = z.infer<typeof bonusAwardSchema>;

interface BonusAwardDialogProps {
  projectId: string;
  userId: string;
  userName: string;
  userContact: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

const bonusTypeLabels: Record<'PURCHASE' | 'BIRTHDAY' | 'MANUAL' | 'REFERRAL', string> = {
  PURCHASE: 'За покупку',
  BIRTHDAY: 'День рождения',
  MANUAL: 'Ручное начисление',
  REFERRAL: 'Реферальная программа'
};

const bonusTypeDescriptions: Record<'PURCHASE' | 'BIRTHDAY' | 'MANUAL' | 'REFERRAL', string> = {
  PURCHASE: 'Бонусы за совершенную покупку',
  BIRTHDAY: 'Поздравление с днем рождения',
  MANUAL: 'Ручное начисление администратором',
  REFERRAL: 'Бонусы за приведенного друга'
};

export function BonusAwardDialog({
  projectId,
  userId,
  userName,
  userContact,
  open,
  onOpenChange,
  onSuccess
}: BonusAwardDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const form = useForm<BonusAwardFormData>({
    resolver: zodResolver(bonusAwardSchema),
    defaultValues: {
      amount: 0,
      type: 'MANUAL',
      description: ''
    }
  });

  const watchedType = form.watch('type');

  const onSubmit = async (data: BonusAwardFormData) => {
    try {
      setLoading(true);

      const response = await fetch(`/api/projects/${projectId}/users/${userId}/bonuses`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка начисления бонусов');
      }

      // TODO: логгер
      // console.log('Бонусы успешно начислены:', data);

      toast({
        title: 'Успех',
        description: `Начислено ${data.amount}₽ бонусов пользователю ${userName}`,
      });

      onSuccess();
      onOpenChange(false);
      form.reset();

    } catch (error: any) {
      console.error('Ошибка начисления бонусов:', error);
      toast({
        title: 'Ошибка',
        description: error.message || 'Не удалось начислить бонусы',
        variant: 'destructive',
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

  const handleTypeChange = (type: 'PURCHASE' | 'BIRTHDAY' | 'MANUAL' | 'REFERRAL') => {
    form.setValue('type', type);
    // Автоматически заполняем описание в зависимости от типа
    if (type === 'MANUAL') {
      form.setValue('description', 'Ручное начисление администратором');
    } else if (type === 'BIRTHDAY') {
      form.setValue('description', 'Поздравление с днем рождения! 🎉');
    } else if (type === 'REFERRAL') {
      form.setValue('description', 'Бонусы за приведенного друга');
    } else {
      form.setValue('description', '');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Gift className="h-5 w-5 text-green-500" />
            <span>Начислить бонусы</span>
          </DialogTitle>
          <DialogDescription className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>
              Пользователь: <strong>{userName}</strong> ({userContact})
            </span>
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
              {/* Сумма бонусов */}
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Gift className="h-4 w-4" />
                      <span>Сумма бонусов *</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          placeholder="0"
                          min="1"
                          max="100000"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                          disabled={loading}
                          className="pr-8"
                        />
                        <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground">
                          ₽
                        </span>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Тип бонуса */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <Tag className="h-4 w-4" />
                      <span>Тип бонуса *</span>
                    </FormLabel>
                    <Select 
                      onValueChange={handleTypeChange} 
                      defaultValue={field.value}
                      disabled={loading}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Выберите тип бонуса" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(bonusTypeLabels).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            <div className="flex flex-col">
                              <span>{label}</span>
                              <span className="text-xs text-muted-foreground">
                                {bonusTypeDescriptions[value as keyof typeof bonusTypeDescriptions]}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Описание */}
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center space-x-2">
                      <MessageSquare className="h-4 w-4" />
                      <span>Описание *</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Опишите причину начисления бонусов..."
                        rows={3}
                        {...field}
                        disabled={loading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Предварительный просмотр */}
            {form.watch('amount') > 0 && (
              <div className="border rounded-lg p-4 bg-green-50 border-green-200">
                <div className="flex items-center space-x-2 text-green-700 mb-2">
                  <Gift className="h-4 w-4" />
                  <span className="font-medium">Предварительный просмотр</span>
                </div>
                <div className="text-sm space-y-1">
                  <div>
                    <strong>Сумма:</strong> {form.watch('amount')}₽
                  </div>
                  <div>
                    <strong>Тип:</strong> {bonusTypeLabels[watchedType]}
                  </div>
                  {form.watch('description') && (
                    <div>
                      <strong>Описание:</strong> {form.watch('description')}
                    </div>
                  )}
                </div>
              </div>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={handleClose}
                disabled={loading}
              >
                Отмена
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Начисление...' : `Начислить ${form.watch('amount') || 0}₽`}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 