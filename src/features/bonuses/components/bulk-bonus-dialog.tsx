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
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  Plus, 
  Minus, 
  Settings, 
  User, 
  Calendar,
  AlertTriangle,
  CheckCircle
} from 'lucide-react';
import { useBonusStore } from '../stores/bonus-store';
import type { User as UserType } from '../types';

const bulkBonusSchema = z.object({
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

type BulkBonusFormValues = z.infer<typeof bulkBonusSchema>;

interface BulkBonusDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  action: 'ADD' | 'DEDUCT' | 'SET';
  selectedUsers: UserType[];
}

const actionConfig = {
  ADD: {
    title: 'Массовое начисление бонусов',
    description: 'Начислить бонусы выбранным пользователям',
    icon: Plus,
    color: 'text-green-500',
    buttonText: 'Начислить',
    buttonVariant: 'default' as const,
  },
  DEDUCT: {
    title: 'Массовое списание бонусов',
    description: 'Списать бонусы у выбранных пользователей',
    icon: Minus,
    color: 'text-red-500',
    buttonText: 'Списать',
    buttonVariant: 'destructive' as const,
  },
  SET: {
    title: 'Установка баланса',
    description: 'Установить одинаковый баланс всем выбранным пользователям',
    icon: Settings,
    color: 'text-blue-500',
    buttonText: 'Установить',
    buttonVariant: 'default' as const,
  },
};

export function BulkBonusDialog({
  open,
  onOpenChange,
  action,
  selectedUsers,
}: BulkBonusDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { bulkAddBonus, bulkDeductBonus, bulkSetBalance } = useBonusStore();

  const config = actionConfig[action];
  const IconComponent = config.icon;

  const form = useForm<BulkBonusFormValues>({
    resolver: zodResolver(bulkBonusSchema),
    defaultValues: {
      amount: 0,
      description: '',
      hasExpiration: false,
      expirationDays: 30,
    },
  });

  const watchedAmount = form.watch('amount');
  const watchedHasExpiration = form.watch('hasExpiration');

  // Подсчет пользователей, у которых недостаточно средств для списания
  const insufficientFundsUsers = action === 'DEDUCT' 
    ? selectedUsers.filter(user => user.bonusBalance < watchedAmount)
    : [];

  const validUsers = action === 'DEDUCT'
    ? selectedUsers.filter(user => user.bonusBalance >= watchedAmount)
    : selectedUsers;

  const onSubmit = async (data: BulkBonusFormValues) => {
    setIsSubmitting(true);
    try {
      const userIds = validUsers.map(user => user.id);
      const expirationDays = data.hasExpiration ? data.expirationDays : undefined;

      switch (action) {
        case 'ADD':
          bulkAddBonus(userIds, data.amount, data.description, expirationDays);
          break;
        case 'DEDUCT':
          bulkDeductBonus(userIds, data.amount, data.description);
          break;
        case 'SET':
          bulkSetBalance(userIds, data.amount, data.description);
          break;
      }

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error in bulk operation:', error);
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
      <DialogContent className="sm:max-w-[600px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <IconComponent className={`h-5 w-5 ${config.color}`} />
            {config.title}
          </DialogTitle>
          <DialogDescription>
            {config.description}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Список выбранных пользователей */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">
                Выбранные пользователи ({selectedUsers.length})
              </h4>
              {insufficientFundsUsers.length > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {insufficientFundsUsers.length} с недостатком средств
                </Badge>
              )}
            </div>

            <ScrollArea className="h-32 w-full border rounded-md p-2">
              <div className="space-y-2">
                {selectedUsers.map((user) => {
                  const hasInsufficientFunds = insufficientFundsUsers.includes(user);
                  
                  return (
                    <div 
                      key={user.id} 
                      className={`flex items-center gap-2 p-2 rounded text-sm ${
                        hasInsufficientFunds ? 'bg-red-50 border border-red-200' : 'bg-muted/30'
                      }`}
                    >
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={user.avatar} alt={user.name} />
                        <AvatarFallback className="text-xs">
                          <User className="h-3 w-3" />
                        </AvatarFallback>
                      </Avatar>
                      
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                      </div>
                      
                      <div className="text-right">
                        <p className="font-medium">
                          {user.bonusBalance.toLocaleString()}
                        </p>
                        {hasInsufficientFunds && (
                          <div className="flex items-center gap-1 text-red-500">
                            <AlertTriangle className="h-3 w-3" />
                            <span className="text-xs">Недостаточно</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="amount"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      {action === 'SET' ? 'Новый баланс' : 'Сумма'}
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder={`Введите ${action === 'SET' ? 'баланс' : 'сумму'}`}
                        {...field}
                        onChange={(e) => field.onChange(Number(e.target.value))}
                      />
                    </FormControl>
                    <FormDescription>
                      {action === 'DEDUCT' && insufficientFundsUsers.length > 0 && (
                        <span className="text-red-500">
                          {insufficientFundsUsers.length} пользователей будут пропущены
                        </span>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {action === 'ADD' && (
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </div>
              )}

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Описание операции</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Укажите причину или описание операции..."
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

              {/* Сводка операции */}
              {watchedAmount > 0 && validUsers.length > 0 && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
                  <div className="flex items-center gap-2 text-blue-700">
                    <CheckCircle className="h-4 w-4" />
                    <span className="font-medium">Сводка операции</span>
                  </div>
                  <div className="text-sm space-y-1">
                    <div className="flex justify-between">
                      <span>Будет обработано пользователей:</span>
                      <span className="font-medium">{validUsers.length}</span>
                    </div>
                    {action !== 'SET' && (
                      <div className="flex justify-between">
                        <span>Общая сумма операции:</span>
                        <span className="font-medium">
                          {(watchedAmount * validUsers.length).toLocaleString()} бонусов
                        </span>
                      </div>
                    )}
                    {insufficientFundsUsers.length > 0 && (
                      <div className="flex justify-between text-red-600">
                        <span>Пропущено пользователей:</span>
                        <span className="font-medium">{insufficientFundsUsers.length}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}

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
                  variant={config.buttonVariant}
                  disabled={isSubmitting || watchedAmount <= 0 || validUsers.length === 0}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? 'Обработка...' : config.buttonText}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}