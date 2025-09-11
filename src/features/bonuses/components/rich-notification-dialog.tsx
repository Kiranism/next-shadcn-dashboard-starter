/**
 * @file: rich-notification-dialog.tsx
 * @description: Расширенный диалог для массовых уведомлений с медиа и кнопками
 * @project: SaaS Bonus System
 * @dependencies: React, UI components
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Mail,
  User,
  Send,
  Image as ImageIcon,
  Plus,
  Trash2,
  Eye,
  ExternalLink,
  MessageSquare
} from 'lucide-react';
import { toast } from 'sonner';
import { Progress } from '@/components/ui/progress';

const buttonSchema = z
  .object({
    text: z
      .string()
      .min(1, 'Текст кнопки обязателен')
      .max(64, 'Максимум 64 символа'),
    url: z.string().url('Неверный формат URL').optional(),
    callback_data: z.string().max(64, 'Максимум 64 символа').optional()
  })
  .refine((data) => data.url || data.callback_data, {
    message: 'Укажите либо URL, либо данные для обратного вызова'
  });

const notificationSchema = z.object({
  message: z
    .string()
    .min(10, 'Сообщение должно содержать минимум 10 символов')
    .max(4000, 'Максимум 4000 символов'),
  imageUrl: z.string().url('Неверный формат URL').optional().or(z.literal('')),
  buttons: z.array(buttonSchema).max(6, 'Максимум 6 кнопок').optional(),
  parseMode: z.enum(['Markdown', 'HTML']).default('Markdown')
});

type NotificationFormValues = z.infer<typeof notificationSchema>;

interface RichNotificationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedUserIds: string[];
  projectId: string;
}

export function RichNotificationDialog({
  open,
  onOpenChange,
  selectedUserIds,
  projectId
}: RichNotificationDialogProps) {
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [progress, setProgress] = useState<number>(0);
  const [inFlight, setInFlight] = useState<boolean>(false);

  const form = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationSchema),
    defaultValues: {
      message: '',
      imageUrl: '',
      buttons: [],
      parseMode: 'HTML'
    }
  });

  const buttons = form.watch('buttons') || [];
  const message = form.watch('message');
  const imageUrl = form.watch('imageUrl');
  const parseMode = form.watch('parseMode');

  const addButton = () => {
    const currentButtons = form.getValues('buttons') || [];
    if (currentButtons.length < 6) {
      form.setValue('buttons', [...currentButtons, { text: '', url: '' }]);
    }
  };

  const removeButton = (index: number) => {
    const currentButtons = form.getValues('buttons') || [];
    const newButtons = currentButtons.filter((_, i) => i !== index);
    form.setValue('buttons', newButtons);
  };

  const onSubmit = async (values: NotificationFormValues) => {
    setLoading(true);
    setInFlight(true);
    setProgress(10);

    try {
      // Фильтруем пустые кнопки - оставляем только с текстом
      const validButtons =
        values.buttons?.filter((button) => button.text.trim()) || [];

      const payload = {
        type: 'system_announcement',
        title: 'Системное уведомление',
        message: values.message,
        channel: 'telegram',
        priority: 'normal',
        metadata: {
          imageUrl: values.imageUrl || undefined,
          buttons: validButtons.length > 0 ? validButtons : undefined,
          parseMode: values.parseMode
        }
      };

      const response = await fetch(`/api/projects/${projectId}/notifications`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Обновим прогресс по факту результата
        const total = Number(result.total || selectedUserIds.length || 1);
        const sent = Number(result.sentCount || 0);
        const failed = Number(result.failedCount || 0);
        const pct = Math.min(100, Math.round(((sent + failed) / total) * 100));
        setProgress(pct);
        toast.success(
          `✅ Уведомления отправлены!\n\n` +
            `📤 Отправлено: ${result.sentCount}\n` +
            `❌ Ошибок: ${result.failedCount}\n\n` +
            `${result.message}`
        );

        if (result.errors && result.errors.length > 0) {
          console.warn('Ошибки отправки:', result.errors);
        }

        form.reset();
        onOpenChange(false);
      } else {
        // Обработка ошибок валидации
        if (result.details && Array.isArray(result.details)) {
          const errorMessages = result.details
            .map((detail: any) => `${detail.field}: ${detail.message}`)
            .join('\n');
          toast.error(`Ошибка валидации:\n${errorMessages}`);
        } else {
          toast.error(result.error || 'Ошибка отправки уведомлений');
        }
      }
    } catch (error) {
      toast.error('Ошибка отправки уведомлений');
      console.error('Error sending notifications:', error);
    } finally {
      setLoading(false);
      setTimeout(() => {
        setInFlight(false);
        setProgress(0);
      }, 400);
    }
  };

  const formatPreviewMessage = (text: string, mode: 'Markdown' | 'HTML') => {
    if (mode === 'HTML') {
      return text
        .replace(/<b>(.*?)<\/b>/g, '**$1**')
        .replace(/<i>(.*?)<\/i>/g, '*$1*')
        .replace(/<code>(.*?)<\/code>/g, '`$1`');
    }
    return text;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        size='full'
        className='max-h-[95vh] w-full overflow-y-auto'
      >
        <DialogHeader>
          <DialogTitle className='flex items-center gap-2'>
            <MessageSquare className='h-5 w-5' />
            Отправка расширенных уведомлений
          </DialogTitle>
          <DialogDescription>
            Отправка уведомлений с поддержкой изображений и кнопок{' '}
            {selectedUserIds.length} выбранным пользователям
          </DialogDescription>
        </DialogHeader>

        <div className='grid grid-cols-1 gap-6 lg:grid-cols-5'>
          {/* Форма */}
          <div className='lg:col-span-3'>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
                {/* Текст сообщения */}
                <FormField
                  control={form.control}
                  name='message'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Текст сообщения</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Введите текст уведомления...'
                          className='min-h-[120px]'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Поддерживается {parseMode} разметка. Максимум 4000
                        символов.
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Режим разметки */}
                <FormField
                  control={form.control}
                  name='parseMode'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Режим разметки</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder='Выберите режим разметки' />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value='Markdown'>Markdown</SelectItem>
                          <SelectItem value='HTML'>HTML</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* URL изображения */}
                <FormField
                  control={form.control}
                  name='imageUrl'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className='flex items-center gap-2'>
                        <ImageIcon className='h-4 w-4' />
                        URL изображения (необязательно)
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder='https://example.com/image.jpg'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Прямая ссылка на изображение (JPG, PNG, GIF)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Кнопки */}
                <div className='space-y-6'>
                  <div className='flex items-center justify-between'>
                    <FormLabel>Кнопки (необязательно)</FormLabel>
                    <Button
                      type='button'
                      variant='outline'
                      size='sm'
                      onClick={addButton}
                      disabled={buttons.length >= 6}
                    >
                      <Plus className='mr-1 h-4 w-4' />
                      Добавить кнопку
                    </Button>
                  </div>

                  {buttons.map((_, index) => (
                    <Card key={index} className='p-4'>
                      <div className='space-y-4'>
                        <div className='flex items-center justify-between'>
                          <span className='text-sm font-medium'>
                            Кнопка {index + 1}
                          </span>
                          <Button
                            type='button'
                            variant='ghost'
                            size='sm'
                            onClick={() => removeButton(index)}
                          >
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>

                        <div className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
                          <FormField
                            control={form.control}
                            name={`buttons.${index}.text`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Текст кнопки</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder='Текст кнопки'
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name={`buttons.${index}.url`}
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>URL</FormLabel>
                                <FormControl>
                                  <Input
                                    placeholder='https://example.com'
                                    {...field}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </form>
            </Form>
          </div>

          {/* Превью */}
          <div className='lg:col-span-2'>
            <div className='sticky top-0'>
              <div className='mb-3 flex items-center gap-2'>
                <Eye className='h-4 w-4' />
                <span className='font-medium'>Превью</span>
              </div>

              <Card className='bg-muted/50 p-4'>
                <div className='space-y-3'>
                  {inFlight && (
                    <div className='bg-background rounded border p-3'>
                      <div className='text-muted-foreground mb-2 text-xs'>
                        Отправка рассылки...
                      </div>
                      <Progress value={progress} />
                    </div>
                  )}
                  {imageUrl && (
                    <div className='overflow-hidden rounded border bg-white'>
                      <Image
                        src={imageUrl}
                        alt='Preview'
                        width={400}
                        height={128}
                        className='h-32 w-full object-cover'
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    </div>
                  )}

                  <div className='bg-background rounded border p-3'>
                    <div className='text-sm whitespace-pre-wrap'>
                      {message
                        ? formatPreviewMessage(message, parseMode)
                        : 'Введите текст сообщения...'}
                    </div>
                  </div>

                  {buttons.length > 0 && (
                    <div className='space-y-2'>
                      {buttons.map(
                        (button, index) =>
                          button.text && (
                            <Button
                              key={index}
                              variant='outline'
                              size='sm'
                              className='w-full justify-start'
                              disabled
                            >
                              {button.url && (
                                <ExternalLink className='mr-2 h-3 w-3' />
                              )}
                              {button.text || `Кнопка ${index + 1}`}
                            </Button>
                          )
                      )}
                    </div>
                  )}
                </div>
              </Card>

              <div className='text-muted-foreground mt-3 text-xs'>
                Получатели: {selectedUserIds.length} пользователей
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={() => onOpenChange(false)}
          >
            Отмена
          </Button>
          <Button
            type='submit'
            onClick={form.handleSubmit(onSubmit)}
            disabled={loading || !message.trim()}
          >
            {loading ? (
              <>
                <div className='mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent' />
                Отправка...
              </>
            ) : (
              <>
                <Send className='mr-2 h-4 w-4' />
                Отправить уведомления
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
