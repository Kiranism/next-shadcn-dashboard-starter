/**
 * @file: src/components/super-admin/subscriptions-table.tsx
 * @description: Таблица подписок для супер-админки
 * @project: SaaS Bonus System
 * @created: 2025-01-30
 * @author: AI Assistant
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  type ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable
} from '@tanstack/react-table';
import {
  ArrowUpDown,
  Loader2,
  CreditCard,
  Calendar,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  MoreHorizontal,
  RefreshCw,
  Ban,
  History,
  Plus,
  Repeat
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { DataTablePagination } from '@/components/ui/table/data-table-pagination';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { ChangePlanDialog } from './change-plan-dialog';
import { CancelSubscriptionDialog } from './cancel-subscription-dialog';
import { SubscriptionDialog } from './subscription-dialog';
import { AutoRenewDialog } from './auto-renew-dialog';
import { toast } from 'sonner';

interface Subscription {
  id: string;
  status: 'active' | 'cancelled' | 'expired' | 'trial';
  startDate: string;
  endDate: string | null;
  nextPaymentDate?: string | null;
  autoRenewEnabled?: boolean;
  paymentMethod?: string | null;
  adminAccount: {
    id: string;
    email: string;
  };
  plan: {
    id: string;
    name: string;
    slug: string;
    price: number;
    currency: string;
  };
  promoCode?: {
    code: string;
    discountValue: number;
    discountType: string;
  } | null;
  createdAt: string;
}

const columns: ColumnDef<Subscription>[] = [
  {
    accessorKey: 'adminAccount.email',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          <User className='mr-2 h-4 w-4' />
          Пользователь
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => (
      <div className='font-medium'>{row.original.adminAccount.email}</div>
    )
  },
  {
    accessorKey: 'plan.name',
    header: 'Тариф',
    cell: ({ row }) => (
      <div className='flex items-center gap-2'>
        <CreditCard className='text-muted-foreground h-4 w-4' />
        <span className='font-medium'>{row.original.plan.name}</span>
        <Badge variant='outline'>{row.original.plan.slug}</Badge>
      </div>
    )
  },
  {
    accessorKey: 'plan.price',
    header: 'Цена',
    cell: ({ row }) => (
      <div>
        {Number(row.original.plan.price).toLocaleString('ru-RU')}{' '}
        {row.original.plan.currency}
      </div>
    )
  },
  {
    accessorKey: 'status',
    header: 'Статус',
    cell: ({ row }) => {
      const status = row.getValue('status') as string;
      const variants: Record<
        string,
        {
          label: string;
          variant: 'default' | 'secondary' | 'destructive' | 'outline';
        }
      > = {
        active: { label: 'Активна', variant: 'default' },
        cancelled: { label: 'Отменена', variant: 'secondary' },
        expired: { label: 'Истекла', variant: 'destructive' },
        trial: { label: 'Пробная', variant: 'outline' }
      };
      const config = variants[status] || variants.active;
      return (
        <Badge variant={config.variant}>
          {status === 'active' && <CheckCircle2 className='mr-1 h-3 w-3' />}
          {status === 'cancelled' && <XCircle className='mr-1 h-3 w-3' />}
          {status === 'expired' && <XCircle className='mr-1 h-3 w-3' />}
          {status === 'trial' && <Clock className='mr-1 h-3 w-3' />}
          {config.label}
        </Badge>
      );
    }
  },
  {
    accessorKey: 'autoRenewEnabled',
    header: 'Автопродление',
    cell: ({ row }) => {
      const sub = row.original;
      if (!sub.paymentMethod && !sub.autoRenewEnabled) {
        return <span className='text-muted-foreground'>—</span>;
      }
      return (
        <div className='flex flex-col gap-0.5'>
          <Badge variant={sub.autoRenewEnabled ? 'default' : 'secondary'}>
            {sub.autoRenewEnabled ? 'Вкл.' : 'Выкл.'}
          </Badge>
          {sub.paymentMethod && (
            <span className='text-muted-foreground text-xs'>
              карта сохранена
            </span>
          )}
        </div>
      );
    }
  },
  {
    accessorKey: 'promoCode',
    header: 'Промокод',
    cell: ({ row }) => {
      const promoCode = row.original.promoCode;
      if (!promoCode) return <span className='text-muted-foreground'>-</span>;
      return (
        <Badge variant='outline'>
          {promoCode.code} (-{promoCode.discountValue}
          {promoCode.discountType === 'percent' ? '%' : '₽'})
        </Badge>
      );
    }
  },
  {
    accessorKey: 'startDate',
    header: ({ column }) => {
      return (
        <Button
          variant='ghost'
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          <Calendar className='mr-2 h-4 w-4' />
          Начало
          <ArrowUpDown className='ml-2 h-4 w-4' />
        </Button>
      );
    },
    cell: ({ row }) => {
      const date = new Date(row.getValue('startDate'));
      return <div>{date.toLocaleDateString('ru-RU')}</div>;
    }
  },
  {
    accessorKey: 'endDate',
    header: 'Окончание',
    cell: ({ row }) => {
      const date = row.getValue('endDate') as string | null;
      if (!date)
        return <span className='text-muted-foreground'>Бессрочно</span>;
      return <div>{new Date(date).toLocaleDateString('ru-RU')}</div>;
    }
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row, table }) => {
      const subscription = row.original;
      // Получаем функцию обновления из контекста таблицы через замыкание
      const updateFn = (table.options.meta as any)?.refreshData;
      return (
        <SubscriptionActions
          subscription={subscription}
          onUpdate={updateFn || (() => window.location.reload())}
        />
      );
    }
  }
];

function SubscriptionActions({
  subscription,
  onUpdate
}: {
  subscription: Subscription;
  onUpdate: () => void;
}) {
  const [showChangePlan, setShowChangePlan] = useState(false);
  const [showCancel, setShowCancel] = useState(false);
  const [showAutoRenew, setShowAutoRenew] = useState(false);

  const handleSuccess = () => {
    onUpdate();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant='ghost' className='h-8 w-8 p-0'>
            <span className='sr-only'>Открыть меню</span>
            <MoreHorizontal className='h-4 w-4' />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end'>
          <DropdownMenuLabel>Действия</DropdownMenuLabel>
          {subscription.status === 'active' && (
            <>
              <DropdownMenuItem onClick={() => setShowChangePlan(true)}>
                <RefreshCw className='mr-2 h-4 w-4' />
                Изменить план
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setShowCancel(true)}>
                <Ban className='mr-2 h-4 w-4' />
                Отменить подписку
              </DropdownMenuItem>
            </>
          )}
          <DropdownMenuItem onClick={() => setShowAutoRenew(true)}>
            <Repeat className='mr-2 h-4 w-4' />
            Автопродление / карта
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <History className='mr-2 h-4 w-4' />
            История изменений
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {showChangePlan && (
        <ChangePlanDialog
          open={showChangePlan}
          onOpenChange={setShowChangePlan}
          subscription={subscription}
          onSuccess={handleSuccess}
        />
      )}

      {showCancel && (
        <CancelSubscriptionDialog
          open={showCancel}
          onOpenChange={setShowCancel}
          subscription={subscription}
          onSuccess={handleSuccess}
        />
      )}

      {showAutoRenew && (
        <AutoRenewDialog
          open={showAutoRenew}
          onOpenChange={setShowAutoRenew}
          subscription={subscription}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}

export function SubscriptionsTable() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value);
  }, 500);

  useEffect(() => {
    debouncedSetSearch(search);
  }, [search, debouncedSetSearch]);

  const fetchSubscriptions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(statusFilter && statusFilter !== 'all' && { status: statusFilter })
      });

      const res = await fetch(`/api/super-admin/subscriptions?${params}`);
      if (!res.ok) {
        throw new Error('Failed to fetch subscriptions');
      }

      const data = await res.json();
      setSubscriptions(data.subscriptions || []);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching subscriptions:', error);
      setSubscriptions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [page, limit, debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchSubscriptions();
  }, [fetchSubscriptions]);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, statusFilter]);

  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10
  });

  useEffect(() => {
    setPagination({
      pageIndex: page - 1,
      pageSize: limit
    });
  }, [page, limit]);

  const table = useReactTable({
    data: subscriptions,
    columns,
    getCoreRowModel: getCoreRowModel(),
    state: { pagination },
    onPaginationChange: setPagination,
    pageCount: Math.ceil(total / limit) || 1,
    manualPagination: true,
    meta: {
      refreshData: fetchSubscriptions
    }
  });

  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between gap-4'>
        <div className='flex flex-1 items-center gap-2'>
          <Input
            placeholder='Поиск по email...'
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className='max-w-sm'
          />
        </div>
        <div className='flex items-center gap-2'>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className='mr-2 h-4 w-4' />
            Создать подписку
          </Button>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Статус' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>Все статусы</SelectItem>
              <SelectItem value='active'>Активные</SelectItem>
              <SelectItem value='cancelled'>Отмененные</SelectItem>
              <SelectItem value='expired'>Истекшие</SelectItem>
              <SelectItem value='trial'>Пробные</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

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
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  <Loader2 className='mx-auto h-6 w-6 animate-spin' />
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
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
                  <div className='text-muted-foreground flex flex-col items-center gap-2'>
                    <CreditCard className='h-8 w-8' />
                    <div>
                      <p className='font-medium'>Подписки не найдены</p>
                      <p className='mt-1 text-sm'>
                        В системе пока нет подписок.
                      </p>
                    </div>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <DataTablePagination
        table={table}
        totalCount={total}
        onPageChange={(newPage) => {
          setPage(newPage);
          setPagination({ pageIndex: newPage - 1, pageSize: limit });
        }}
        onPageSizeChange={(newLimit) => {
          setLimit(newLimit);
          setPage(1);
          setPagination({ pageIndex: 0, pageSize: newLimit });
        }}
      />

      {showCreateDialog && (
        <SubscriptionDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={() => {
            fetchSubscriptions();
            setShowCreateDialog(false);
          }}
        />
      )}
    </div>
  );
}
