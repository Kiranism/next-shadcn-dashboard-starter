'use client';

import { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  MoreHorizontal,
  Plus,
  Minus,
  Settings,
  History,
  User,
  Mail
} from 'lucide-react';
import { useBonusStore } from '../stores/bonus-store';
import { BonusDeductionDialog } from './bonus-deduction-dialog';
import { BonusAdditionDialog } from './bonus-addition-dialog';
import { UserTransactionsDialog } from './user-transactions-dialog';
import type { User as UserType } from '../types';
import { formatDistanceToNow } from 'date-fns';
import { ru } from 'date-fns/locale';

interface UsersTableProps {
  users: UserType[];
  isLoading?: boolean;
}

export function UsersTable({ users, isLoading }: UsersTableProps) {
  const { selectedUsers, toggleUserSelection, selectAllUsers, clearSelection } =
    useBonusStore();

  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showDeductionDialog, setShowDeductionDialog] = useState(false);
  const [showAdditionDialog, setShowAdditionDialog] = useState(false);
  const [showTransactionsDialog, setShowTransactionsDialog] = useState(false);

  const isAllSelected =
    users.length > 0 && selectedUsers.length === users.length;
  const isIndeterminate =
    selectedUsers.length > 0 && selectedUsers.length < users.length;

  const handleSelectAll = () => {
    if (isAllSelected) {
      clearSelection();
    } else {
      selectAllUsers();
    }
  };

  const handleUserAction = (
    user: UserType,
    action: 'add' | 'deduct' | 'history'
  ) => {
    setSelectedUser(user);
    switch (action) {
      case 'add':
        setShowAdditionDialog(true);
        break;
      case 'deduct':
        setShowDeductionDialog(true);
        break;
      case 'history':
        setShowTransactionsDialog(true);
        break;
    }
  };

  const getBonusBalanceVariant = (balance: number) => {
    if (balance === 0) return 'secondary';
    if (balance < 100) return 'destructive';
    if (balance < 1000) return 'default';
    return 'default';
  };

  if (isLoading) {
    return (
      <div className='space-y-4'>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className='bg-muted h-16 animate-pulse rounded' />
        ))}
      </div>
    );
  }

  return (
    <>
      <div className='rounded-md border'>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className='w-12'>
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  // Note: indeterminate state handled by the component internally
                  className={
                    isIndeterminate
                      ? 'data-[state=indeterminate]:bg-primary'
                      : ''
                  }
                />
              </TableHead>
              <TableHead>Пользователь</TableHead>
              <TableHead>Баланс бонусов</TableHead>
              <TableHead>Всего заработано</TableHead>
              <TableHead>Регистрация</TableHead>
              <TableHead>Последнее обновление</TableHead>
              <TableHead className='w-12'></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className='text-muted-foreground py-8 text-center'
                >
                  Пользователи не найдены
                </TableCell>
              </TableRow>
            ) : (
              users.map((user) => {
                const isSelected = selectedUsers.includes(user.id);

                return (
                  <TableRow
                    key={user.id}
                    className={isSelected ? 'bg-muted/50' : ''}
                  >
                    <TableCell>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleUserSelection(user.id)}
                      />
                    </TableCell>

                    <TableCell>
                      <div className='flex items-center gap-3'>
                        <Avatar className='h-8 w-8'>
                          <AvatarImage src={user.avatar} alt={user.name} />
                          <AvatarFallback>
                            <User className='h-4 w-4' />
                          </AvatarFallback>
                        </Avatar>
                        <div className='min-w-0 flex-1'>
                          <p className='truncate font-medium'>{user.name}</p>
                          <p className='text-muted-foreground truncate text-sm'>
                            {user.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge
                        variant={getBonusBalanceVariant(user.bonusBalance)}
                        className='font-mono'
                      >
                        {user.bonusBalance.toLocaleString()}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <span className='text-muted-foreground font-mono'>
                        {user.totalEarned.toLocaleString()}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className='text-muted-foreground text-sm'>
                        {formatDistanceToNow(user.createdAt, {
                          addSuffix: true,
                          locale: ru
                        })}
                      </span>
                    </TableCell>

                    <TableCell>
                      <span className='text-muted-foreground text-sm'>
                        {formatDistanceToNow(user.updatedAt, {
                          addSuffix: true,
                          locale: ru
                        })}
                      </span>
                    </TableCell>

                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant='ghost'
                            size='sm'
                            className='h-8 w-8 p-0'
                          >
                            <MoreHorizontal className='h-4 w-4' />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align='end'>
                          <DropdownMenuItem
                            onClick={() => handleUserAction(user, 'add')}
                          >
                            <Plus className='mr-2 h-4 w-4 text-green-500' />
                            Начислить бонусы
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleUserAction(user, 'deduct')}
                            disabled={user.bonusBalance === 0}
                          >
                            <Minus className='mr-2 h-4 w-4 text-red-500' />
                            Списать бонусы
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => handleUserAction(user, 'history')}
                          >
                            <History className='mr-2 h-4 w-4' />
                            История транзакций
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Mail className='mr-2 h-4 w-4' />
                            Отправить уведомление
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      {/* Диалоги */}
      {selectedUser && (
        <>
          <BonusDeductionDialog
            open={showDeductionDialog}
            onOpenChange={setShowDeductionDialog}
            user={selectedUser}
          />

          <BonusAdditionDialog
            open={showAdditionDialog}
            onOpenChange={setShowAdditionDialog}
            user={selectedUser}
          />

          <UserTransactionsDialog
            open={showTransactionsDialog}
            onOpenChange={setShowTransactionsDialog}
            user={selectedUser}
          />
        </>
      )}
    </>
  );
}
