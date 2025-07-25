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
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Plus, User, Calendar } from 'lucide-react';
import { useBonusStore } from '../stores/bonus-store';
import type { User as UserType } from '../types';

const additionSchema = z.object({
  amount: z.number().min(1, 'Сумма должна быть больше 0'),
  description: z.string().min(3, 'Описание должно содержать минимум 3 символа'),
  hasExpiration: z.boolean(),
  expirationDays: z.number().optional(),
}).refine((data) => {
  if (data.hasExpiration && (!data.expirationDays || data.expirationDays < 1)) {
    return false;
  }
  return true;
}, {
  message: 'Укажите количество дней до истечения',
  path: ['expirationDays'],
});

type AdditionFormValues = z.infer<typeof additionSchema>;

interface BonusAdditionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType;
}

export function BonusAdditionDialog({
  open,
  onOpenChange,
  user,
}: BonusAdditionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addBonusToUser } = useBonusStore();

  const form = useForm<AdditionFormValues>({
    resolver: zodResolver(additionSchema),
    defaultValues: {
      amount: 0,
      description: '',
      hasExpiration: false,
      expirationDays: 30,
    },
  });

  const watchedAmount = form.watch('amount');
  const watchedHasExpiration = form.watch('hasExpiration');
  const newBalance = user.bonusBalance + watchedAmount;

  const onSubmit = async (data: AdditionFormValues) => {
    setIsSubmitting(true);
    try {
      const expirationDays = data.hasExpiration ? data.expirationDays : undefined;
      addBonusToUser(user.id, data.amount, data.description, expirationDays);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error adding bonus:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-green-500" />
            Начисление бонусов
          </DialogTitle>
          <DialogDescription>
            Начислить бонусы пользователю. Операция будет записана в историю.
          </DialogDescription>
        </DialogHeader>

        {/* Информация о пользователе */}
        <div className="rounded-lg border p-4 bg-muted/50">
          <div className="flex items-center gap-3 mb-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={user.avatar} alt={user.name} />
              <AvatarFallback>
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h4 className="font-medium">{user.name}</h4>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Текущий баланс:</span>
            <Badge variant="secondary" className="text-lg font-bold">
              {user.bonusBalance.toLocaleString()} бонусов
            </Badge>
          </div>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Сумма начисления</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Введите количество бонусов"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    Укажите количество бонусов для начисления
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Предварительный расчет */}
            {watchedAmount > 0 && (
              <div className="p-3 rounded-lg bg-green-50 border border-green-200">
                <div className="flex justify-between items-center text-sm">
                  <span>Баланс после начисления:</span>
                  <span className="font-bold text-green-700">
                    {newBalance.toLocaleString()} бонусов
                  </span>
                </div>
              </div>
            )}

            {/* Настройка срока действия */}
            <div className="space-y-3">
              <FormField
                control={form.control}
                name="hasExpiration"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        Срок действия
                      </FormLabel>
                      <FormDescription>
                        Установить срок истечения бонусов
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

              {watchedHasExpiration && (
                <FormField
                  control={form.control}
                  name="expirationDays"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        Дней до истечения
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="Количество дней"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormDescription>
                        Бонусы истекут через указанное количество дней
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Причина начисления</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Укажите причину начисления бонусов..."
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Эта информация будет видна в истории транзакций
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Отмена
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting || watchedAmount <= 0}
                className="min-w-[100px]"
              >
                {isSubmitting ? 'Начисление...' : 'Начислить'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}