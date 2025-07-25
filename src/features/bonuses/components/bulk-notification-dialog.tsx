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
import { ScrollArea } from '@/components/ui/scroll-area';
import { Mail, User, Send } from 'lucide-react';
import type { User as UserType } from '../types';

const notificationSchema = z.object({
  title: z.string().min(3, 'Заголовок должен содержать минимум 3 символа'),
  message: z.string().min(10, 'Сообщение должно содержать минимум 10 символов'),
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

interface BulkNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUsers: UserType[];
}

export function BulkNotificationDialog({
  open,
  onOpenChange,
  selectedUsers,
}: BulkNotificationDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      title: '',
      message: '',
    },
  });

  const onSubmit = async (data: NotificationFormValues) => {
    setIsSubmitting(true);
    try {
      // Здесь была бы логика отправки уведомлений
      console.log('Отправка уведомлений:', {
        ...data,
        recipients: selectedUsers.map(u => ({ id: u.id, email: u.email })),
      });

      // Симуляция отправки
      await new Promise(resolve => setTimeout(resolve, 2000));

      form.reset();
      onOpenChange(false);
    } catch (error) {
      console.error('Error sending notifications:', error);
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
            <Mail className="h-5 w-5 text-blue-500" />
            Массовая отправка уведомлений
          </DialogTitle>
          <DialogDescription>
            Отправить уведомление выбранным пользователям
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Список получателей */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="font-medium text-sm">
                Получатели ({selectedUsers.length})
              </h4>
              <Badge variant="secondary" className="text-xs">
                {selectedUsers.length} пользователей
              </Badge>
            </div>

            <ScrollArea className="h-32 w-full border rounded-md p-2">
              <div className="space-y-2">
                {selectedUsers.map((user) => (
                  <div 
                    key={user.id} 
                    className="flex items-center gap-2 p-2 rounded text-sm bg-muted/30"
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
                      <p className="text-xs text-muted-foreground">
                        {user.bonusBalance.toLocaleString()} бонусов
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Заголовок уведомления</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Введите заголовок..."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Краткий заголовок, который увидят пользователи
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="message"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Текст сообщения</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Введите текст уведомления..."
                        rows={4}
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Подробное сообщение для пользователей
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Шаблоны сообщений */}
              <div className="space-y-2">
                <FormLabel>Быстрые шаблоны</FormLabel>
                <div className="grid grid-cols-1 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      form.setValue('title', 'Не забудьте потратить бонусы!');
                      form.setValue('message', 'У вас есть бонусы, которые скоро истекут. Используйте их для получения скидок на следующие покупки!');
                    }}
                  >
                    Напоминание об истекающих бонусах
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      form.setValue('title', 'Новые бонусы начислены!');
                      form.setValue('message', 'Поздравляем! Вам начислены новые бонусы. Проверьте свой баланс и используйте их при следующей покупке.');
                    }}
                  >
                    Уведомление о начислении
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      form.setValue('title', 'Специальное предложение');
                      form.setValue('message', 'Только для вас! Специальная акция с повышенным начислением бонусов. Не упустите возможность!');
                    }}
                  >
                    Специальное предложение
                  </Button>
                </div>
              </div>

              {/* Предварительный просмотр */}
              {form.watch('title') && form.watch('message') && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
                  <div className="flex items-center gap-2 text-blue-700">
                    <Mail className="h-4 w-4" />
                    <span className="font-medium">Предварительный просмотр</span>
                  </div>
                  <div className="text-sm">
                    <div className="font-medium mb-1">{form.watch('title')}</div>
                    <div className="text-muted-foreground">{form.watch('message')}</div>
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
                  disabled={isSubmitting || selectedUsers.length === 0}
                  className="min-w-[120px]"
                >
                  {isSubmitting ? (
                    'Отправка...'
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Отправить
                    </>
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}