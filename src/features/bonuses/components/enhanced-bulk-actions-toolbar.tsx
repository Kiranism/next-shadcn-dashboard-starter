/**
 * @file: enhanced-bulk-actions-toolbar.tsx
 * @description: Улучшенный toolbar для массовых действий с расширенными уведомлениями
 * @project: SaaS Bonus System
 * @dependencies: React, UI components
 * @created: 2025-01-31
 * @author: AI Assistant + User
 */

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  ChevronDown,
  Plus,
  Minus,
  Settings,
  Mail,
  MessageSquare,
  X,
  Users
} from 'lucide-react';

interface EnhancedBulkActionsToolbarProps {
  selectedUserIds: string[];
  selectedCount: number;
  onClearSelection: () => void;
  onShowRichNotifications: () => void;
  onShowBasicNotifications?: () => void;
  onBulkBonusAction?: (action: 'ADD' | 'DEDUCT' | 'SET') => void;
}

export function EnhancedBulkActionsToolbar({
  selectedUserIds,
  selectedCount,
  onClearSelection,
  onShowRichNotifications,
  onShowBasicNotifications,
  onBulkBonusAction
}: EnhancedBulkActionsToolbarProps) {
  if (selectedCount === 0) {
    return null;
  }

  return (
    <div className='bg-background/95 pointer-events-auto fixed bottom-6 left-1/2 z-[60] -translate-x-1/2 transform backdrop-blur-sm'>
      <div className='bg-background rounded-lg border p-4 shadow-lg'>
        <div className='flex items-center gap-4'>
          {/* Информация о выборе */}
          <div className='flex items-center gap-2 text-sm font-medium'>
            <Users className='h-4 w-4 text-blue-500' />
            <span className='text-gray-700'>Выбрано пользователей:</span>
            <Badge variant='secondary' className='px-3 py-1 text-base'>
              {selectedCount}
            </Badge>
          </div>

          {/* Действия с бонусами */}
          {onBulkBonusAction && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm'>
                  Бонусы
                  <ChevronDown className='ml-1 h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => onBulkBonusAction('ADD')}>
                  <Plus className='mr-2 h-4 w-4 text-green-500' />
                  Начислить бонусы
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkBonusAction('DEDUCT')}>
                  <Minus className='mr-2 h-4 w-4 text-red-500' />
                  Списать бонусы
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onBulkBonusAction('SET')}>
                  <Settings className='mr-2 h-4 w-4 text-blue-500' />
                  Установить баланс
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Уведомления */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='outline' size='sm'>
                <Mail className='mr-1 h-4 w-4' />
                Уведомления
                <ChevronDown className='ml-1 h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuItem onClick={onShowRichNotifications}>
                <MessageSquare className='mr-2 h-4 w-4 text-blue-500' />
                📢 Расширенные уведомления
                <Badge variant='default' className='ml-2 bg-green-500'>
                  РАССЫЛКИ
                </Badge>
              </DropdownMenuItem>
              {onShowBasicNotifications && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={onShowBasicNotifications}>
                    <Mail className='mr-2 h-4 w-4 text-gray-500' />
                    Простые уведомления
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Очистить выбор */}
          <Button
            variant='ghost'
            size='sm'
            onClick={onClearSelection}
            className='h-8 w-8 p-0'
          >
            <X className='h-4 w-4' />
          </Button>
        </div>
      </div>
    </div>
  );
}
