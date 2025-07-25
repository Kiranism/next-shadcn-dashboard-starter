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
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { AlertTriangle, Coins, User } from 'lucide-react';
import { useBonusStore } from '../stores/bonus-store';
import type { User as UserType } from '../types';

const deductionSchema = z.object({
  amount: z.number().min(1, 'Сумма должна быть больше 0'),
  description: z.string().min(3, 'Описание должно содержать минимум 3 символа'),
});

type DeductionFormValues = z.infer<typeof deductionSchema>;

interface BonusDeductionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  user: UserType;
}

export function BonusDeductionDialog({
  open,
  onOpenChange,
  user,
}: BonusDeductionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { deductBonusFromUser } = useBonusStore();

  const form = useForm<DeductionFormValues>({
    resolver: zodResolver(deductionSchema),
    defaultValues: {
      amount: 0,
      description: '',
    },
  });

  const watchedAmount = form.watch('amount');
  const isInsufficientFunds = watchedAmount > user.bonusBalance;
  const remainingBalance = user.bonusBalance - watchedAmount;

  const onSubmit = async (data: DeductionFormValues) => {
    if (data.amount > user.bonusBalance) {
      form.setError('amount', {
        message: 'Недостаточно бонусов на балансе'
      });
      return;
    }

    setIsSubmitting(true);
    try {
      deductBonusFromUser(user.id, data.amount, data.description);
      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error deducting bonus:', error);
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
            <Coins className="h-5 w-5 text-red-500" />
            Списание бонусов
          </DialogTitle>
          <DialogDescription>
            Списать бонусы с баланса пользователя. Операция необратима.
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
                  <FormLabel>Сумма списания</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="Введите количество бонусов"
                      {...field}
                      onChange={(e) => field.onChange(Number(e.target.value))}
                      className={isInsufficientFunds ? 'border-red-500' : ''}
                    />
                  </FormControl>
                  <FormDescription>
                    Максимальная сумма: {user.bonusBalance.toLocaleString()} бонусов
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Предупреждение о недостатке средств */}
            {isInsufficientFunds && watchedAmount > 0 && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Недостаточно бонусов на балансе
                </span>
              </div>
            )}

            {/* Предварительный расчет */}
            {watchedAmount > 0 && !isInsufficientFunds && (
              <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                <div className="flex justify-between items-center text-sm">
                  <span>Баланс после списания:</span>
                  <span className="font-bold text-blue-700">
                    {remainingBalance.toLocaleString()} бонусов
                  </span>
                </div>
              </div>
            )}

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Причина списания</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Укажите причину списания бонусов..."
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
                variant="destructive"
                disabled={isSubmitting || isInsufficientFunds || watchedAmount <= 0}
                className="min-w-[100px]"
              >
                {isSubmitting ? 'Списание...' : 'Списать'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}