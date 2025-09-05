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
  X,
  Users
} from 'lucide-react';
import { useBonusStore } from '../stores/bonus-store';
import { BulkBonusDialog } from './bulk-bonus-dialog';
import { RichNotificationDialog } from './rich-notification-dialog';

export function BulkActionsToolbar() {
  const { selectedUsers, clearSelection, users } = useBonusStore();
  const [showBulkBonus, setShowBulkBonus] = useState(false);
  const [showBulkNotification, setShowBulkNotification] = useState(false);
  const [showRichNotification, setShowRichNotification] = useState(false);
  const [bulkAction, setBulkAction] = useState<'ADD' | 'DEDUCT' | 'SET'>('ADD');

  const selectedUsersData = users.filter((user) =>
    selectedUsers.includes(user.id)
  );
  const selectedCount = selectedUsers.length;

  if (selectedCount === 0) {
    return null;
  }

  const handleBulkAction = (action: 'ADD' | 'DEDUCT' | 'SET') => {
    setBulkAction(action);
    setShowBulkBonus(true);
  };

  const totalSelectedBalance = selectedUsersData.reduce(
    (sum, user) => sum + user.bonusBalance,
    0
  );

  return (
    <>
      <div className='fixed bottom-6 left-1/2 z-50 -translate-x-1/2 transform'>
        <div className='bg-background flex min-w-[400px] items-center gap-3 rounded-lg border p-3 shadow-lg'>
          {/* Информация о выбранных пользователях */}
          <div className='flex flex-1 items-center gap-2'>
            <Users className='text-muted-foreground h-4 w-4' />
            <span className='text-sm font-medium'>Выбрано пользователей:</span>
            <Badge variant='secondary' className='font-bold'>
              {selectedCount}
            </Badge>
            <span className='text-muted-foreground text-xs'>
              (общий баланс: {totalSelectedBalance.toLocaleString()})
            </span>
          </div>

          {/* Действия */}
          <div className='flex items-center gap-2'>
            {/* Операции с бонусами */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant='outline' size='sm'>
                  Бонусы
                  <ChevronDown className='ml-1 h-4 w-4' />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end'>
                <DropdownMenuItem onClick={() => handleBulkAction('ADD')}>
                  <Plus className='mr-2 h-4 w-4 text-green-500' />
                  Начислить бонусы
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('DEDUCT')}>
                  <Minus className='mr-2 h-4 w-4 text-red-500' />
                  Списать бонусы
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('SET')}>
                  <Settings className='mr-2 h-4 w-4 text-blue-500' />
                  Установить баланс
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Уведомления */}
            <Button
              variant='outline'
              size='sm'
              onClick={() => setShowRichNotification(true)}
            >
              <Mail className='mr-1 h-4 w-4' />
              Уведомления
            </Button>

            {/* Очистить выбор */}
            <Button
              variant='ghost'
              size='sm'
              onClick={clearSelection}
              className='h-8 w-8 p-0'
            >
              <X className='h-4 w-4' />
            </Button>
          </div>
        </div>
      </div>

      {/* Диалоги */}
      <BulkBonusDialog
        open={showBulkBonus}
        onOpenChange={setShowBulkBonus}
        action={bulkAction}
        selectedUsers={selectedUsersData}
      />

      {showRichNotification && (
        <RichNotificationDialog
          open={showRichNotification}
          onOpenChange={setShowRichNotification}
          selectedUserIds={selectedUsers}
          projectId={''}
        />
      )}
    </>
  );
}
