'use client';

/**
 * @file: src/components/super-admin/errors-table.tsx
 * @description: Таблица системных ошибок для супер-админки
 * @project: SaaS Bonus System
 * @created: 2025-01-30
 * @author: AI Assistant
 */

import { Fragment, useState, useEffect } from 'react';
import {
  type ColumnDef,
  type SortingState,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable
} from '@tanstack/react-table';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { DataTablePagination } from '@/components/ui/table/data-table-pagination';
import {
  Loader2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Copy
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ErrorLog {
  id: string;
  level: string;
  message: string;
  source: string;
  createdAt: string;
  stack?: string | null;
  context?: Record<string, unknown> | null;
  projectId?: string | null;
  userId?: string | null;
  project: {
    id: string;
    name: string;
  } | null;
}

const formatJson = (data?: Record<string, unknown> | null) => {
  if (!data) {
    return 'Нет данных';
  }
  try {
    return JSON.stringify(data, null, 2);
  } catch {
    return String(data);
  }
};

function LogDetails({ log }: { log: ErrorLog }) {
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(
        JSON.stringify(
          {
            id: log.id,
            level: log.level,
            message: log.message,
            source: log.source,
            project: log.project?.name || 'system',
            projectId: log.projectId,
            userId: log.userId,
            stack: log.stack,
            context: log.context
          },
          null,
          2
        )
      );
      toast({
        title: 'Скопировано',
        description: 'Полная запись лога скопирована в буфер обмена'
      });
    } catch (error) {
      console.error('Clipboard error', error);
      toast({
        title: 'Не удалось скопировать',
        description: 'Попробуйте скопировать вручную',
        variant: 'destructive'
      });
    }
  };

  return (
    <div className='space-y-4 text-sm'>
      <div className='text-muted-foreground flex flex-wrap gap-4'>
        <div>
          <span className='text-foreground font-medium'>Проект:</span>{' '}
          {log.project?.name || 'Система'}
        </div>
        <div>
          <span className='text-foreground font-medium'>Источник:</span>{' '}
          {log.source}
        </div>
        {log.userId && (
          <div>
            <span className='text-foreground font-medium'>UserId:</span>{' '}
            {log.userId}
          </div>
        )}
        <Button
          variant='outline'
          size='sm'
          className='ml-auto'
          onClick={handleCopy}
        >
          <Copy className='mr-2 h-3 w-3' />
          Скопировать JSON
        </Button>
      </div>

      <div className='space-y-2'>
        <p className='text-foreground text-sm font-medium'>Stack Trace</p>
        <pre className='bg-muted max-h-72 overflow-auto rounded p-3 text-xs leading-relaxed'>
          {log.stack || '—'}
        </pre>
      </div>

      <div className='space-y-2'>
        <p className='text-foreground text-sm font-medium'>Context / Payload</p>
        <pre className='bg-muted max-h-96 overflow-auto rounded p-3 text-xs leading-relaxed'>
          {formatJson(log.context)}
        </pre>
      </div>
    </div>
  );
}

export function ErrorsTable() {
  const [logs, setLogs] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [total, setTotal] = useState(0);
  const [levelFilter, setLevelFilter] = useState('all');
  const [sourceFilter, setSourceFilter] = useState('all');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [expandedRows, setExpandedRows] = useState<Record<string, boolean>>({});

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(levelFilter && levelFilter !== 'all' && { level: levelFilter }),
        ...(sourceFilter && sourceFilter !== 'all' && { source: sourceFilter })
      });

      const res = await fetch(`/api/super-admin/errors?${params}`);
      const data = await res.json();

      setLogs(data.logs || []);
      setTotal(data.pagination?.total || 0);
      setStats(data.stats || {});
    } catch (error) {
      console.error('Error fetching logs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
    // Auto-refresh каждые 30 секунд
    const interval = setInterval(fetchLogs, 30000);
    return () => clearInterval(interval);
  }, [page, limit, levelFilter, sourceFilter]);

  const getLevelBadgeVariant = (level: string) => {
    switch (level) {
      case 'error':
        return 'destructive';
      case 'warn':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const columns: ColumnDef<ErrorLog>[] = [
    {
      accessorKey: 'level',
      header: 'Уровень',
      cell: ({ row }) => {
        const level = row.getValue('level') as string;
        return (
          <Badge variant={getLevelBadgeVariant(level)}>
            {level.toUpperCase()}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'message',
      header: 'Сообщение',
      cell: ({ row }) => {
        const message = row.getValue('message') as string;
        return (
          <div className='max-w-md truncate' title={message}>
            {message}
          </div>
        );
      }
    },
    {
      accessorKey: 'source',
      header: 'Источник',
      cell: ({ row }) => (
        <Badge variant='outline'>{row.getValue('source')}</Badge>
      )
    },
    {
      accessorKey: 'project.name',
      header: 'Проект',
      cell: ({ row }) => (
        <div className='text-sm'>{row.original.project?.name || 'Система'}</div>
      )
    },
    {
      accessorKey: 'createdAt',
      header: 'Дата',
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return (
          <div className='text-sm'>
            {date.toLocaleString('ru-RU', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => {
        const log = row.original;
        const isExpanded = expandedRows[log.id];
        return (
          <Button
            variant='ghost'
            size='sm'
            onClick={() =>
              setExpandedRows((prev) => ({
                ...prev,
                [log.id]: !prev[log.id]
              }))
            }
          >
            {isExpanded ? (
              <>
                Скрыть <ChevronUp className='ml-1 h-4 w-4' />
              </>
            ) : (
              <>
                Детали <ChevronDown className='ml-1 h-4 w-4' />
              </>
            )}
          </Button>
        );
      }
    }
  ];

  const [pagination, setPagination] = useState({
    pageIndex: page - 1,
    pageSize: limit
  });

  useEffect(() => {
    setPagination({
      pageIndex: page - 1,
      pageSize: limit
    });
  }, [page, limit]);

  const table = useReactTable({
    data: logs,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting, pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: Math.ceil(total / limit)
  });

  return (
    <div className='space-y-4'>
      {/* Статистика */}
      {Object.keys(stats).length > 0 && (
        <div className='grid gap-4 md:grid-cols-4'>
          {Object.entries(stats).map(([level, count]) => (
            <Card key={level}>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <CardTitle className='text-sm font-medium'>
                  {level.toUpperCase()}
                </CardTitle>
                <AlertTriangle className='text-muted-foreground h-4 w-4' />
              </CardHeader>
              <CardContent>
                <div className='text-2xl font-bold'>{count}</div>
                <p className='text-muted-foreground text-xs'>
                  За последние 24 часа
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Фильтры */}
      <div className='flex items-center gap-2'>
        <Select
          value={levelFilter}
          onValueChange={(value) => {
            setLevelFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Все уровни' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Все уровни</SelectItem>
            <SelectItem value='error'>Error</SelectItem>
            <SelectItem value='warn'>Warning</SelectItem>
            <SelectItem value='info'>Info</SelectItem>
            <SelectItem value='debug'>Debug</SelectItem>
          </SelectContent>
        </Select>
        <Select
          value={sourceFilter}
          onValueChange={(value) => {
            setSourceFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Все источники' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Все источники</SelectItem>
            <SelectItem value='bot'>Bot</SelectItem>
            <SelectItem value='webhook'>Webhook</SelectItem>
            <SelectItem value='api'>API</SelectItem>
            <SelectItem value='client'>Client</SelectItem>
            <SelectItem value='workflow'>Workflow</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Таблица */}
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
              table.getRowModel().rows.map((row) => {
                const log = row.original;
                const isExpanded = expandedRows[log.id];
                return (
                  <Fragment key={row.id}>
                    <TableRow>
                      {row.getVisibleCells().map((cell) => (
                        <TableCell key={cell.id}>
                          {flexRender(
                            cell.column.columnDef.cell,
                            cell.getContext()
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                    {isExpanded && (
                      <TableRow className='bg-muted/30'>
                        <TableCell colSpan={columns.length}>
                          <LogDetails log={log} />
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className='h-24 text-center'
                >
                  Нет ошибок
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Пагинация */}
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
        pageSizeOptions={[25, 50, 100]}
      />
    </div>
  );
}
