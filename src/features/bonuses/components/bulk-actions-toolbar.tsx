'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
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
import { BulkNotificationDialog } from './bulk-notification-dialog';

export function BulkActionsToolbar() {
  const { selectedUsers, clearSelection, users } = useBonusStore();
  const [showBulkBonus, setShowBulkBonus] = useState(false);
  const [showBulkNotification, setShowBulkNotification] = useState(false);
  const [bulkAction, setBulkAction] = useState<'ADD' | 'DEDUCT' | 'SET'>('ADD');

  const selectedUsersData = users.filter(user => selectedUsers.includes(user.id));
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
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-background border rounded-lg shadow-lg p-3 flex items-center gap-3 min-w-[400px]">
          {/* Информация о выбранных пользователях */}
          <div className="flex items-center gap-2 flex-1">
            <Users className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              Выбрано пользователей:
            </span>
            <Badge variant="secondary" className="font-bold">
              {selectedCount}
            </Badge>
            <span className="text-xs text-muted-foreground">
              (общий баланс: {totalSelectedBalance.toLocaleString()})
            </span>
          </div>

          {/* Действия */}
          <div className="flex items-center gap-2">
            {/* Операции с бонусами */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  Бонусы
                  <ChevronDown className="h-4 w-4 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleBulkAction('ADD')}>
                  <Plus className="h-4 w-4 mr-2 text-green-500" />
                  Начислить бонусы
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('DEDUCT')}>
                  <Minus className="h-4 w-4 mr-2 text-red-500" />
                  Списать бонусы
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkAction('SET')}>
                  <Settings className="h-4 w-4 mr-2 text-blue-500" />
                  Установить баланс
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Уведомления */}
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setShowBulkNotification(true)}
            >
              <Mail className="h-4 w-4 mr-1" />
              Уведомления
            </Button>

            {/* Очистить выбор */}
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearSelection}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
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

      <BulkNotificationDialog
        open={showBulkNotification}
        onOpenChange={setShowBulkNotification}
        selectedUsers={selectedUsersData}
      />
    </>
  );
}