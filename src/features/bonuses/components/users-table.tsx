/**
 * @file: users-table.tsx
 * @description: Таблица пользователей с фильтрами и пагинацией
 * @project: SaaS Bonus System
 * @dependencies: TanStack Table, shadcn/ui, React
 * @created: 2024-12-31
 * @author: AI Assistant + User
 */

'use client';

import { useState, useEffect, useRef } from 'react';
import {
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  ChevronDown,
  MoreHorizontal,
  History,
  Eye,
  Coins,
  Gift,
  Trash2,
  Edit,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PartnerRoleBadge } from './partner-role-badge';
import { DataTablePagination } from '@/components/ui/table/data-table-pagination';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import type { DisplayUser as User } from '../types';

interface UsersTableProps {
  data: User[];
  projectId?: string;
  /**
   * Когда `true`, показывается колонка «Роль» с цветным badge
   * (b2b-referral-hierarchy Phase 2). По умолчанию `false`,
   * колонка скрыта — поведение совпадает с легаси.
   */
  enablePartnerRoles?: boolean;
  onExport?: () => void;
  onExportCSV?: () => void;
  onExportExcel?: () => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  onProfileClick?: (user: User) => void;
  onHistoryClick?: (userId: string) => void;
  onBonusAwardClick?: (user: User) => void;
  onBonusDeductClick?: (user: User) => void;
  onDeleteUser?: (user: User) => void;
  onUserUpdated?: () => void;
  loading?: boolean;
  totalCount?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  currentPage?: number;
  pageSize?: number;
}

export function UsersTable({
  data,
  projectId,
  enablePartnerRoles = false,
  onExport,
  onExportCSV,
  onExportExcel,
  onSelectionChange,
  onProfileClick,
  onHistoryClick,
  onBonusAwardClick,
  onBonusDeductClick,
  onDeleteUser,
  onUserUpdated,
  loading = false,
  totalCount = data.length,
  onPageChange,
  onPageSizeChange,
  currentPage = 1,
  pageSize = 50
}: UsersTableProps) {
  const { toast } = useToast();
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true }
  ]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(
    () => ({
      // По умолчанию колонка «Роль» скрыта; раскроется через эффект ниже,
      // если у проекта включён b2b-флаг.
      partnerRole: false
    })
  );
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: pageSize
  });

  // Edit dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    birthDate: '',
    isActive: false
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    // Форматируем дату рождения для input type="date"
    let birthDateStr = '';
    if ((user as any).birthDate) {
      const bd = new Date((user as any).birthDate);
      if (!isNaN(bd.getTime())) {
        birthDateStr = bd.toISOString().split('T')[0];
      }
    }
    setEditForm({
      firstName: user.firstName || '',
      lastName: user.lastName || '',
      email: user.email || '',
      phone: user.phone || '',
      birthDate: birthDateStr,
      isActive: user.isActive ?? false
    });
    setEditDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (!editingUser || !projectId) return;

    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/projects/${projectId}/users/${editingUser.id}`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(editForm)
        }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }

      toast({
        title: 'Успешно',
        description: 'Данные пользователя обновлены'
      });

      setEditDialogOpen(false);
      onUserUpdated?.();
    } catch (error) {
      toast({
        title: 'Ошибка',
        description:
          error instanceof Error ? error.message : 'Не удалось сохранить',
        variant: 'destructive'
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Обработчик изменений пагинации изнутри таблицы
  const handlePageSizeChange = (newPageSize: number) => {
    setPagination((prev) => ({ ...prev, pageSize: newPageSize, pageIndex: 0 }));
    onPageSizeChange?.(newPageSize);
  };

  const columns: ColumnDef<User>[] = [
    {
      id: 'select',
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected()
              ? true
              : table.getIsSomePageRowsSelected()
                ? 'indeterminate'
                : false
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label='Select all'
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label='Select row'
        />
      ),
      enableSorting: false,
      enableHiding: false,
      size: 40
    },
    {
      accessorKey: 'name',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Пользователь
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const user = row.original;
        const initials =
          `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() ||
          'U';

        return (
          <div className='flex items-center space-x-3'>
            <Avatar className='h-8 w-8'>
              <AvatarFallback>{initials}</AvatarFallback>
            </Avatar>
            <div>
              <div className='font-medium'>{user.name}</div>
              <div className='text-muted-foreground text-sm'>
                ID: {user.id.slice(0, 8)}...
              </div>
            </div>
          </div>
        );
      }
    },
    {
      accessorKey: 'isActive',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Статус
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Активный' : 'Неактивный'}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'partnerRole',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Роль
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const role = row.getValue('partnerRole') as string | undefined;
        return <PartnerRoleBadge role={role} />;
      },
      // Колонка скрывается через columnVisibility, когда фича отключена
      enableHiding: true
    },
    {
      accessorKey: 'email',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Email
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        );
      },
      cell: ({ row }) => (
        <div className='font-mono text-sm'>{row.getValue('email') || '-'}</div>
      )
    },
    {
      accessorKey: 'telegramUsername',
      header: 'Telegram',
      cell: ({ row }) => {
        const username = row.getValue('telegramUsername') as string | undefined;
        return <div className='text-sm'>{username ? `@${username}` : '-'}</div>;
      }
    },
    {
      accessorKey: 'phone',
      header: 'Телефон',
      cell: ({ row }) => (
        <div className='font-mono text-sm'>{row.getValue('phone') || '-'}</div>
      )
    },
    {
      accessorKey: 'bonusBalance',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Активные бонусы
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const balance = row.getValue('bonusBalance') as number;
        return (
          <Badge variant={balance > 0 ? 'default' : 'secondary'}>
            {balance.toFixed(0)} бонусов
          </Badge>
        );
      },
      filterFn: (row, id, value) => {
        const balance = row.getValue(id) as number;
        return balance >= (value as number);
      }
    },
    {
      accessorKey: 'currentLevel',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Уровень
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const level = row.getValue('currentLevel') as string | undefined;
        return (
          <Badge variant={level ? 'outline' : 'secondary'}>
            {level || 'Базовый'}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'createdAt',
      header: ({ column }) => {
        return (
          <Button
            variant='ghost'
            onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          >
            Регистрация
            <ArrowUpDown className='ml-2 h-4 w-4' />
          </Button>
        );
      },
      cell: ({ row }) => {
        const date = row.getValue('createdAt') as Date;
        return (
          <div className='text-muted-foreground text-sm'>
            {date.toLocaleDateString('ru-RU')}
          </div>
        );
      }
    },
    {
      id: 'actions',
      enableHiding: false,
      cell: ({ row }) => {
        const user = row.original;

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant='ghost' className='h-8 w-8 p-0'>
                <span className='sr-only'>Open menu</span>
                <MoreHorizontal className='h-4 w-4' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end'>
              <DropdownMenuLabel>Действия</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => handleEditUser(user)}>
                <Edit className='mr-2 h-4 w-4' />
                Редактировать
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onBonusAwardClick?.(user)}>
                <Gift className='mr-2 h-4 w-4' />
                Начислить бонусы
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onBonusDeductClick?.(user)}
                className='text-destructive focus:text-destructive'
              >
                <Coins className='mr-2 h-4 w-4' />
                Списать бонусы
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onHistoryClick?.(user.id)}>
                <History className='mr-2 h-4 w-4' />
                История бонусов
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onProfileClick?.(user)}>
                <Eye className='mr-2 h-4 w-4' />
                Просмотреть профиль
              </DropdownMenuItem>
              {onDeleteUser && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => onDeleteUser(user)}
                    className='text-destructive focus:text-destructive'
                  >
                    <Trash2 className='mr-2 h-4 w-4' />
                    Удалить пользователя
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      }
    }
  ];

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination
    },
    manualPagination: true,
    pageCount: Math.ceil(totalCount / pageSize)
  });

  // Синхронизируем пагинацию с внешними пропсами (только pageIndex, pageSize обновляется через handlePageSizeChange)
  useEffect(() => {
    setPagination((prev) => {
      const newPageIndex = currentPage - 1;
      // Обновляем pageSize только если он изменился извне (не через handlePageSizeChange)
      if (prev.pageIndex !== newPageIndex || prev.pageSize !== pageSize) {
        return {
          pageIndex: newPageIndex,
          pageSize
        };
      }
      return prev;
    });
  }, [currentPage, pageSize]);

  // Видимость колонки «Роль» зависит от `enablePartnerRoles` (b2b-фича-флаг проекта).
  useEffect(() => {
    setColumnVisibility((prev) => ({
      ...prev,
      partnerRole: Boolean(enablePartnerRoles)
    }));
  }, [enablePartnerRoles]);

  // Обработчик изменений выбора
  useEffect(() => {
    if (onSelectionChange) {
      const selectedRows = table.getSelectedRowModel().rows;
      const selectedIds = selectedRows.map((row) => row.original.id);
      onSelectionChange(selectedIds);
    }
  }, [rowSelection, table, onSelectionChange]);

  return (
    <div className='space-y-4'>
      <DataTableToolbar
        table={table}
        searchPlaceholder='Поиск пользователей...'
        searchColumn='name'
        onExport={onExport}
        onExportCSV={onExportCSV}
        onExportExcel={onExportExcel}
      />

      <div className='overflow-x-auto rounded-md border'>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              // Loading state
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell>
                    <div className='bg-muted h-4 w-4 animate-pulse rounded' />
                  </TableCell>
                  <TableCell>
                    <div className='flex items-center space-x-3'>
                      <div className='bg-muted h-8 w-8 animate-pulse rounded-full' />
                      <div className='space-y-1'>
                        <div className='bg-muted h-4 w-32 animate-pulse rounded' />
                        <div className='bg-muted h-3 w-20 animate-pulse rounded' />
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className='bg-muted h-4 w-48 animate-pulse rounded' />
                  </TableCell>
                  <TableCell>
                    <div className='bg-muted h-4 w-32 animate-pulse rounded' />
                  </TableCell>
                  <TableCell>
                    <div className='bg-muted h-4 w-16 animate-pulse rounded' />
                  </TableCell>
                  <TableCell>
                    <div className='bg-muted h-4 w-24 animate-pulse rounded' />
                  </TableCell>
                  <TableCell>
                    <div className='bg-muted h-6 w-6 animate-pulse rounded' />
                  </TableCell>
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && 'selected'}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  Пользователи не найдены.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        table={table}
        totalCount={totalCount}
        onPageChange={onPageChange}
        onPageSizeChange={handlePageSizeChange}
        pageSizeOptions={[10, 20, 50, 100, 200, 500, 1000]}
      />

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className='sm:max-w-[425px]'>
          <DialogHeader>
            <DialogTitle>Редактировать пользователя</DialogTitle>
            <DialogDescription>
              Измените данные пользователя и нажмите Сохранить
            </DialogDescription>
          </DialogHeader>
          <div className='grid gap-4 py-4'>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='firstName' className='text-right'>
                Имя
              </Label>
              <Input
                id='firstName'
                value={editForm.firstName}
                onChange={(e) =>
                  setEditForm({ ...editForm, firstName: e.target.value })
                }
                className='col-span-3'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='lastName' className='text-right'>
                Фамилия
              </Label>
              <Input
                id='lastName'
                value={editForm.lastName}
                onChange={(e) =>
                  setEditForm({ ...editForm, lastName: e.target.value })
                }
                className='col-span-3'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='email' className='text-right'>
                Email
              </Label>
              <Input
                id='email'
                type='email'
                value={editForm.email}
                onChange={(e) =>
                  setEditForm({ ...editForm, email: e.target.value })
                }
                className='col-span-3'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='phone' className='text-right'>
                Телефон
              </Label>
              <Input
                id='phone'
                value={editForm.phone}
                onChange={(e) =>
                  setEditForm({ ...editForm, phone: e.target.value })
                }
                className='col-span-3'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='birthDate' className='text-right'>
                День рождения
              </Label>
              <Input
                id='birthDate'
                type='date'
                value={editForm.birthDate}
                onChange={(e) =>
                  setEditForm({ ...editForm, birthDate: e.target.value })
                }
                className='col-span-3'
              />
            </div>
            <div className='grid grid-cols-4 items-center gap-4'>
              <Label htmlFor='isActive' className='text-right'>
                Активен
              </Label>
              <div className='col-span-3 flex items-center space-x-2'>
                <Switch
                  id='isActive'
                  checked={editForm.isActive}
                  onCheckedChange={(checked) =>
                    setEditForm({ ...editForm, isActive: checked })
                  }
                />
                <span className='text-muted-foreground text-sm'>
                  {editForm.isActive ? 'Активный' : 'Неактивный'}
                </span>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant='outline'
              onClick={() => setEditDialogOpen(false)}
              disabled={isSaving}
            >
              Отмена
            </Button>
            <Button onClick={handleSaveUser} disabled={isSaving}>
              {isSaving && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
              Сохранить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
