'use client';

/**
 * @file: src/components/super-admin/projects-table.tsx
 * @description: Таблица проектов для супер-админки
 * @project: SaaS Bonus System
 * @created: 2025-01-30
 * @author: AI Assistant
 */

import { useState, useEffect } from 'react';
import { useDebouncedCallback } from '@/hooks/use-debounced-callback';
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
import { Input } from '@/components/ui/input';
import { DataTablePagination } from '@/components/ui/table/data-table-pagination';
import { Search, Loader2, FolderKanban, Info } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle
} from '@/components/ui/sheet';

interface ProjectIntegrations {
  inSales: boolean;
  moySklad: boolean;
  retailCrm: boolean;
}

interface ProjectData {
  id: string;
  name: string;
  domain: string | null;
  isActive: boolean;
  usersCount: number;
  botActive: boolean;
  createdAt: string;
  updatedAt: string;
  bonusPercentage: string;
  bonusExpiryDays: number;
  bonusBehavior: string;
  bonusMode: string;
  operationMode: string;
  welcomeBonus: string;
  welcomeRewardType: string;
  firstPurchaseDiscountPercent: number;
  maxPaymentPercentage: string;
  widgetVersion: string;
  botStatus: string;
  workflowMaxSteps: number;
  workflowTimeoutMs: number;
  owner: {
    id: string;
    email: string;
  } | null;
  integrations: ProjectIntegrations;
}

const bonusBehaviorLabels: Record<string, string> = {
  SPEND_AND_EARN: 'Тратить и начислять',
  SPEND_ONLY: 'Только трата',
  EARN_ONLY: 'Только начисление'
};

const bonusModeLabels: Record<string, string> = {
  SIMPLE: 'Простой %',
  LEVELS: 'Уровни'
};

const operationModeLabels: Record<string, string> = {
  WITH_BOT: 'С ботом',
  WITHOUT_BOT: 'Без бота'
};

const botStatusLabels: Record<string, string> = {
  INACTIVE: 'Неактивен',
  ACTIVE: 'Активен',
  ERROR: 'Ошибка'
};

const welcomeRewardLabels: Record<string, string> = {
  BONUS: 'Бонусы',
  DISCOUNT: 'Скидка'
};

function IntegrationBadges({
  integrations
}: {
  integrations: ProjectIntegrations;
}) {
  return (
    <div className='flex flex-wrap gap-1'>
      {integrations.inSales && (
        <Badge variant='outline' className='text-xs'>
          InSales
        </Badge>
      )}
      {integrations.moySklad && (
        <Badge variant='outline' className='text-xs'>
          МойСклад
        </Badge>
      )}
      {integrations.retailCrm && (
        <Badge variant='outline' className='text-xs'>
          RetailCRM
        </Badge>
      )}
      {!integrations.inSales &&
        !integrations.moySklad &&
        !integrations.retailCrm && (
          <span className='text-muted-foreground text-xs'>—</span>
        )}
    </div>
  );
}

function ProjectDetailSheet({
  project,
  open,
  onOpenChange
}: {
  project: ProjectData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!project) return null;

  const rows: { label: string; value: string }[] = [
    { label: 'ID', value: project.id },
    { label: 'Название', value: project.name },
    { label: 'Домен', value: project.domain || '—' },
    { label: 'Владелец', value: project.owner?.email || '—' },
    { label: 'Проект активен', value: project.isActive ? 'Да' : 'Нет' },
    { label: 'Пользователей', value: String(project.usersCount) },
    {
      label: 'Бот (настройки)',
      value: project.botActive ? 'Включён' : 'Выключен'
    },
    {
      label: 'Статус бота (поле)',
      value: botStatusLabels[project.botStatus] ?? project.botStatus
    },
    {
      label: 'Режим работы',
      value: operationModeLabels[project.operationMode] ?? project.operationMode
    },
    {
      label: 'Поведение бонусов',
      value: bonusBehaviorLabels[project.bonusBehavior] ?? project.bonusBehavior
    },
    {
      label: 'Режим бонусов',
      value: bonusModeLabels[project.bonusMode] ?? project.bonusMode
    },
    { label: '% начисления', value: `${project.bonusPercentage}%` },
    {
      label: 'Срок жизни бонусов (дн.)',
      value: String(project.bonusExpiryDays)
    },
    { label: 'Приветственный бонус', value: project.welcomeBonus },
    {
      label: 'Тип приветственной награды',
      value:
        welcomeRewardLabels[project.welcomeRewardType] ??
        project.welcomeRewardType
    },
    {
      label: 'Скидка на первую покупку %',
      value: String(project.firstPurchaseDiscountPercent)
    },
    {
      label: 'Макс. оплата бонусами %',
      value: `${project.maxPaymentPercentage}%`
    },
    { label: 'Версия виджета', value: project.widgetVersion },
    { label: 'Workflow: макс. шагов', value: String(project.workflowMaxSteps) },
    {
      label: 'Workflow: таймаут (мс)',
      value: String(project.workflowTimeoutMs)
    },
    {
      label: 'Интеграции',
      value:
        [
          project.integrations.inSales ? 'InSales' : null,
          project.integrations.moySklad ? 'МойСклад' : null,
          project.integrations.retailCrm ? 'RetailCRM' : null
        ]
          .filter(Boolean)
          .join(', ') || '—'
    },
    {
      label: 'Создан / обновлён',
      value: `${new Date(project.createdAt).toLocaleString('ru-RU')} → ${new Date(project.updatedAt).toLocaleString('ru-RU')}`
    }
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className='w-full overflow-y-auto sm:max-w-lg'>
        <SheetHeader>
          <SheetTitle>Настройки проекта</SheetTitle>
          <SheetDescription>
            Ключевые поля из БД (токены и секреты webhook в списке не
            показываются).
          </SheetDescription>
        </SheetHeader>
        <dl className='mt-6 grid gap-3 text-sm'>
          {rows.map(({ label, value }) => (
            <div
              key={label}
              className='border-border/60 grid gap-0.5 border-b pb-3 last:border-0'
            >
              <dt className='text-muted-foreground font-medium'>{label}</dt>
              <dd className='font-mono text-xs break-words sm:text-sm'>
                {value}
              </dd>
            </div>
          ))}
        </dl>
      </SheetContent>
    </Sheet>
  );
}

export function ProjectsTable() {
  const [projects, setProjects] = useState<ProjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [detailProject, setDetailProject] = useState<ProjectData | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const debouncedSetSearch = useDebouncedCallback((value: string) => {
    setDebouncedSearch(value);
  }, 400);

  useEffect(() => {
    debouncedSetSearch(search);
  }, [search, debouncedSetSearch]);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(debouncedSearch && { search: debouncedSearch }),
        ...(activeFilter &&
          activeFilter !== 'all' && { isActive: activeFilter })
      });

      const res = await fetch(`/api/super-admin/projects?${params}`);
      const data = await res.json();

      setProjects(data.projects || []);
      setTotal(data.pagination?.total || 0);
    } catch (error) {
      console.error('Error fetching projects:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [page, limit, debouncedSearch, activeFilter]);

  const openDetails = (p: ProjectData) => {
    setDetailProject(p);
    setSheetOpen(true);
  };

  const columns: ColumnDef<ProjectData>[] = [
    {
      accessorKey: 'name',
      header: 'Проект',
      cell: ({ row }) => (
        <div className='flex items-center gap-2'>
          <FolderKanban className='h-4 w-4 shrink-0' />
          <span className='font-medium'>{row.getValue('name')}</span>
        </div>
      )
    },
    {
      accessorKey: 'domain',
      header: 'Домен',
      cell: ({ row }) => (
        <div className='text-muted-foreground max-w-[140px] truncate text-sm sm:max-w-[200px]'>
          {(row.getValue('domain') as string | null) || '-'}
        </div>
      )
    },
    {
      accessorKey: 'owner.email',
      header: 'Владелец',
      cell: ({ row }) => (
        <div
          className='max-w-[160px] truncate text-sm'
          title={row.original.owner?.email}
        >
          {row.original.owner?.email || '-'}
        </div>
      )
    },
    {
      accessorKey: 'bonusPercentage',
      header: '% бонуса',
      cell: ({ row }) => (
        <div className='text-sm whitespace-nowrap'>
          {row.original.bonusPercentage}%
        </div>
      )
    },
    {
      id: 'operationMode',
      header: 'Режим',
      cell: ({ row }) => (
        <span className='text-sm'>
          {operationModeLabels[row.original.operationMode] ??
            row.original.operationMode}
        </span>
      )
    },
    {
      id: 'integrations',
      header: 'Интеграции',
      cell: ({ row }) => (
        <IntegrationBadges integrations={row.original.integrations} />
      )
    },
    {
      accessorKey: 'usersCount',
      header: 'Польз.',
      cell: ({ row }) => (
        <div className='text-center text-sm tabular-nums'>
          {row.getValue('usersCount')}
        </div>
      )
    },
    {
      accessorKey: 'botActive',
      header: 'Бот',
      cell: ({ row }) => {
        const botActive = row.getValue('botActive') as boolean;
        return (
          <Badge variant={botActive ? 'default' : 'secondary'}>
            {botActive ? 'Активен' : 'Неактивен'}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'isActive',
      header: 'Статус',
      cell: ({ row }) => {
        const isActive = row.getValue('isActive') as boolean;
        return (
          <Badge variant={isActive ? 'default' : 'secondary'}>
            {isActive ? 'Активен' : 'Неактивен'}
          </Badge>
        );
      }
    },
    {
      accessorKey: 'widgetVersion',
      header: 'Виджет',
      cell: ({ row }) => (
        <Badge variant='outline' className='font-mono text-xs'>
          {row.getValue('widgetVersion')}
        </Badge>
      )
    },
    {
      accessorKey: 'createdAt',
      header: 'Создан',
      cell: ({ row }) => {
        const date = new Date(row.getValue('createdAt'));
        return (
          <div className='text-sm whitespace-nowrap'>
            {date.toLocaleDateString('ru-RU')}
          </div>
        );
      }
    },
    {
      id: 'actions',
      header: '',
      cell: ({ row }) => (
        <Button
          type='button'
          variant='ghost'
          size='sm'
          className='gap-1'
          onClick={() => openDetails(row.original)}
        >
          <Info className='h-4 w-4' />
          <span className='hidden sm:inline'>Подробнее</span>
        </Button>
      )
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
    data: projects,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onSortingChange: setSorting,
    state: { sorting, pagination },
    onPaginationChange: setPagination,
    manualPagination: true,
    pageCount: Math.ceil(total / limit) || 1
  });

  return (
    <div className='space-y-4'>
      <div className='flex items-center gap-2'>
        <div className='relative max-w-sm flex-1'>
          <Search className='text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2' />
          <Input
            placeholder='Поиск по названию или домену...'
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className='pl-9'
          />
        </div>
        <Select
          value={activeFilter}
          onValueChange={(value) => {
            setActiveFilter(value);
            setPage(1);
          }}
        >
          <SelectTrigger className='w-[180px]'>
            <SelectValue placeholder='Все статусы' />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>Все статусы</SelectItem>
            <SelectItem value='true'>Активные</SelectItem>
            <SelectItem value='false'>Неактивные</SelectItem>
          </SelectContent>
        </Select>
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
                  Нет данных
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

      <ProjectDetailSheet
        project={detailProject}
        open={sheetOpen}
        onOpenChange={(open) => {
          setSheetOpen(open);
          if (!open) {
            setDetailProject(null);
          }
        }}
      />
    </div>
  );
}
