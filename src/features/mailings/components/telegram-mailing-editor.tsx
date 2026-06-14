/**
 * @file: src/features/mailings/components/telegram-mailing-editor.tsx
 * @description: Редактор Telegram рассылок с поддержкой HTML, изображений и кнопок
 * @project: SaaS Bonus System
 * @dependencies: React, shadcn/ui
 * @created: 2025-01-30
 * @author: AI Assistant + User
 */

'use client';

import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Plus, Trash2, ExternalLink, MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface TelegramButton {
  text: string;
  url?: string;
  callback_data?: string;
}

interface TelegramMailingEditorProps {
  messageText: string;
  imageUrl?: string;
  buttons?: TelegramButton[];
  parseMode?: 'HTML' | 'Markdown';
  onMessageChange: (text: string) => void;
  onImageUrlChange: (url: string) => void;
  onButtonsChange: (buttons: TelegramButton[]) => void;
  onParseModeChange: (mode: 'HTML' | 'Markdown') => void;
}

export function TelegramMailingEditor({
  messageText,
  imageUrl = '',
  buttons = [],
  parseMode = 'HTML',
  onMessageChange,
  onImageUrlChange,
  onButtonsChange,
  onParseModeChange
}: TelegramMailingEditorProps) {
  const [newButtonText, setNewButtonText] = useState('');
  const [newButtonUrl, setNewButtonUrl] = useState('');
  const [newButtonCallback, setNewButtonCallback] = useState('');

  const addButton = () => {
    if (!newButtonText) return;

    const newButton: TelegramButton = {
      text: newButtonText,
      ...(newButtonUrl ? { url: newButtonUrl } : {}),
      ...(newButtonCallback ? { callback_data: newButtonCallback } : {})
    };

    if (!newButton.url && !newButton.callback_data) {
      toast.error('Укажите URL или callback_data для кнопки');
      return;
    }

    onButtonsChange([...buttons, newButton]);
    setNewButtonText('');
    setNewButtonUrl('');
    setNewButtonCallback('');
  };

  const removeButton = (index: number) => {
    onButtonsChange(buttons.filter((_, i) => i !== index));
  };

  // Валидация HTML тегов (только разрешенные)
  const allowedTags = ['b', 'i', 'u', 's', 'a', 'code', 'pre'];
  const validateHtml = (html: string): boolean => {
    // Простая валидация - проверяем что используются только разрешенные теги
    const tagRegex = /<\/?([a-z]+)[^>]*>/gi;
    const matches = html.match(tagRegex);
    if (!matches) return true;

    for (const match of matches) {
      const tagName = match.replace(/<\/?([a-z]+)[^>]*>/i, '$1').toLowerCase();
      if (!allowedTags.includes(tagName)) {
        return false;
      }
    }
    return true;
  };

  return (
    <div className='space-y-6'>
      <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
        {/* Редактор */}
        <div className='space-y-4'>
          <div>
            <Label htmlFor='parseMode'>Режим разметки</Label>
            <select
              id='parseMode'
              value={parseMode}
              onChange={(e) =>
                onParseModeChange(e.target.value as 'HTML' | 'Markdown')
              }
              className='border-input bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm'
            >
              <option value='HTML'>HTML</option>
              <option value='Markdown'>Markdown</option>
            </select>
            <p className='text-muted-foreground mt-1 text-xs'>
              HTML поддерживает: &lt;b&gt;, &lt;i&gt;, &lt;u&gt;, &lt;s&gt;,
              &lt;a&gt;, &lt;code&gt;, &lt;pre&gt;
            </p>
          </div>

          <div>
            <Label htmlFor='messageText'>
              Текст сообщения *
              {parseMode === 'HTML' && (
                <span className='text-muted-foreground ml-2 text-xs'>
                  (HTML разметка)
                </span>
              )}
            </Label>
            <Textarea
              id='messageText'
              value={messageText}
              onChange={(e) => {
                const text = e.target.value;
                if (parseMode === 'HTML' && !validateHtml(text)) {
                  toast.error(
                    'Используйте только разрешенные HTML теги: b, i, u, s, a, code, pre'
                  );
                  return;
                }
                onMessageChange(text);
              }}
              placeholder='Введите текст сообщения...'
              className='min-h-[200px] font-mono text-sm'
              required
            />
            <p className='text-muted-foreground mt-1 text-xs'>
              Максимум 4096 символов
            </p>
          </div>

          <div>
            <Label htmlFor='imageUrl'>URL изображения (необязательно)</Label>
            <Input
              id='imageUrl'
              type='url'
              value={imageUrl}
              onChange={(e) => onImageUrlChange(e.target.value)}
              placeholder='https://example.com/image.jpg'
            />
            <p className='text-muted-foreground mt-1 text-xs'>
              Прямая ссылка на изображение (JPG, PNG, GIF)
            </p>
          </div>

          <Separator />

          <div>
            <Label>Кнопки (необязательно)</Label>
            <div className='mt-2 space-y-2'>
              {buttons.map((button, index) => (
                <div
                  key={index}
                  className='flex items-center gap-2 rounded-md border p-2'
                >
                  <div className='flex-1'>
                    <div className='text-sm font-medium'>{button.text}</div>
                    <div className='text-muted-foreground text-xs'>
                      {button.url ? (
                        <span className='flex items-center gap-1'>
                          <ExternalLink className='h-3 w-3' />
                          {button.url}
                        </span>
                      ) : (
                        <span>Callback: {button.callback_data}</span>
                      )}
                    </div>
                  </div>
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    onClick={() => removeButton(index)}
                  >
                    <Trash2 className='h-4 w-4' />
                  </Button>
                </div>
              ))}

              <div className='bg-muted/50 space-y-2 rounded-md border p-3'>
                <Input
                  placeholder='Текст кнопки'
                  value={newButtonText}
                  onChange={(e) => setNewButtonText(e.target.value)}
                  className='text-sm'
                />
                <div className='grid grid-cols-2 gap-2'>
                  <Input
                    placeholder='URL (если нужна ссылка)'
                    value={newButtonUrl}
                    onChange={(e) => setNewButtonUrl(e.target.value)}
                    className='text-sm'
                  />
                  <Input
                    placeholder='Callback data (если нужен callback)'
                    value={newButtonCallback}
                    onChange={(e) => setNewButtonCallback(e.target.value)}
                    className='text-sm'
                  />
                </div>
                <Button
                  type='button'
                  variant='outline'
                  size='sm'
                  onClick={addButton}
                  disabled={!newButtonText}
                  className='w-full'
                >
                  <Plus className='mr-2 h-4 w-4' />
                  Добавить кнопку
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Превью */}
        <div>
          <Label>Превью сообщения</Label>
          <Card className='mt-2'>
            <CardHeader className='pb-3'>
              <CardTitle className='flex items-center gap-2 text-sm'>
                <MessageSquare className='h-4 w-4' />
                Telegram сообщение
              </CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              {imageUrl && (
                <div className='bg-muted flex aspect-video items-center justify-center rounded-md border-2 border-dashed'>
                  <div className='text-muted-foreground text-center text-sm'>
                    <div className='mb-2 text-2xl'>🖼️</div>
                    <div>Изображение</div>
                    <div className='mt-1 max-w-[200px] truncate text-xs'>
                      {imageUrl}
                    </div>
                  </div>
                </div>
              )}

              <div className='bg-muted/50 min-h-[150px] rounded-lg p-4'>
                {messageText ? (
                  <div
                    className='text-sm whitespace-pre-wrap'
                    dangerouslySetInnerHTML={
                      parseMode === 'HTML' ? { __html: messageText } : undefined
                    }
                  >
                    {parseMode === 'Markdown' ? messageText : undefined}
                  </div>
                ) : (
                  <div className='text-muted-foreground text-sm italic'>
                    Введите текст сообщения...
                  </div>
                )}
              </div>

              {buttons.length > 0 && (
                <div className='space-y-2'>
                  <div className='text-muted-foreground text-xs font-medium'>
                    Кнопки:
                  </div>
                  <div className='grid grid-cols-2 gap-2'>
                    {buttons.map((button, index) => (
                      <Button
                        key={index}
                        variant='outline'
                        size='sm'
                        className='h-auto justify-start py-2 text-left'
                        disabled
                      >
                        <span className='truncate'>{button.text}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {!messageText && !imageUrl && buttons.length === 0 && (
                <div className='text-muted-foreground py-8 text-center text-sm'>
                  Превью появится после заполнения полей
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
