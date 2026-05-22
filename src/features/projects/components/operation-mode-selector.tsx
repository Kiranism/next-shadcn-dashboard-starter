/**
 * @file: src/features/projects/components/operation-mode-selector.tsx
 * @description: Компонент выбора режима работы проекта (WITH_BOT / WITHOUT_BOT)
 * @project: SaaS Bonus System
 * @dependencies: React, Shadcn UI
 * @created: 2025-12-05
 * @author: AI Assistant + User
 */

'use client';

import { Bot } from 'lucide-react';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';

export type OperationMode = 'WITH_BOT' | 'WITHOUT_BOT';

interface OperationModeSelectorProps {
  value: OperationMode;
  onChange: (mode: OperationMode) => void;
  hasExistingUsers?: boolean;
  disabled?: boolean;
}

export function OperationModeSelector({
  value,
  onChange,
  hasExistingUsers = false,
  disabled = false
}: OperationModeSelectorProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className='text-lg'>Режим работы проекта</CardTitle>
        <CardDescription>
          Выберите, как пользователи будут активировать свои профили для траты
          бонусов
        </CardDescription>
      </CardHeader>
      <CardContent>
        <RadioGroup
          value={value}
          onValueChange={(val) => onChange(val as OperationMode)}
          disabled={disabled}
          className='space-y-4'
        >
          {/* WITH_BOT option */}
          <div
            className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors ${
              value === 'WITH_BOT'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            onClick={() => !disabled && onChange('WITH_BOT')}
          >
            <RadioGroupItem value='WITH_BOT' id='with-bot' className='mt-1' />
            <div className='flex-1 space-y-1'>
              <Label
                htmlFor='with-bot'
                className='flex cursor-pointer items-center text-base font-medium'
              >
                <Bot className='mr-2 h-4 w-4 text-blue-500' />С активацией через
                бота
              </Label>
              <p className='text-muted-foreground text-sm'>
                Пользователи должны активировать профиль через бота (Telegram
                или MAX) для траты бонусов. Подходит для проектов с активным
                использованием мессенджеров.
              </p>
              <ul className='text-muted-foreground mt-2 list-inside list-disc text-xs'>
                <li>Требуется настройка бота в разделе "Интеграции"</li>
                <li>Пользователи активируются через бота</li>
                <li>Неактивные пользователи не могут тратить бонусы</li>
              </ul>
            </div>
          </div>

          {/* WITHOUT_BOT option */}
          <div
            className={`flex items-start space-x-3 rounded-lg border p-4 transition-colors ${
              value === 'WITHOUT_BOT'
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            } ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
            onClick={() => !disabled && onChange('WITHOUT_BOT')}
          >
            <RadioGroupItem
              value='WITHOUT_BOT'
              id='without-bot'
              className='mt-1'
            />
            <div className='flex-1 space-y-1'>
              <Label
                htmlFor='without-bot'
                className='flex cursor-pointer items-center text-base font-medium'
              >
                Без активации через бота
              </Label>
              <p className='text-muted-foreground text-sm'>
                Пользователи автоматически активируются при регистрации и могут
                сразу тратить бонусы. Подходит для проектов без интеграции с
                мессенджерами.
              </p>
              <ul className='text-muted-foreground mt-2 list-inside list-disc text-xs'>
                <li>Подключение бота не требуется</li>
                <li>Автоматическая активация при регистрации</li>
                <li>Все пользователи могут тратить бонусы сразу</li>
              </ul>
            </div>
          </div>
        </RadioGroup>

        {hasExistingUsers && (
          <div className='mt-4 rounded-md border border-yellow-200 bg-yellow-50 p-3 dark:border-yellow-800 dark:bg-yellow-950'>
            <p className='text-sm text-yellow-700 dark:text-yellow-300'>
              <strong>Внимание:</strong> В проекте уже есть пользователи.
              Изменение режима работы может повлиять на их возможность тратить
              бонусы.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
