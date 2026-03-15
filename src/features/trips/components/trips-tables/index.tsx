'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import { cn } from '@/lib/utils';
import * as React from 'react';
import { ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import { columns } from './columns';

export { columns };

interface TripsTableParams<TData, TValue> {
  data: TData[];
  totalItems: number;
  columns: ColumnDef<TData, TValue>[];
}

export function TripsTable<TData, TValue>({
  data,
  totalItems,
  columns
}: TripsTableParams<TData, TValue>) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const pageCount = Math.ceil(totalItems / pageSize);

  const { table } = useDataTable({
    data,
    columns,
    pageCount: pageCount,
    shallow: false,
    debounceMs: 500
  });

  // Calculate groups for visual indicators
  const groupCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    data.forEach((item: any) => {
      if (item.group_id) {
        counts[item.group_id] = (counts[item.group_id] || 0) + 1;
      }
    });
    return counts;
  }, [data]);

  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getFullYear() === today.getFullYear() &&
      date.getMonth() === today.getMonth() &&
      date.getDate() === today.getDate()
    );
  };

  const isNowWindow = (date: Date, windowMinutes = 30) => {
    const now = new Date();
    if (!isToday(date)) return false;
    const diffMinutes = Math.abs(date.getTime() - now.getTime()) / 60000;
    return diffMinutes <= windowMinutes;
  };

  return (
    <DataTable
      table={table}
      getRowClassName={(row: any) => {
        const classes: string[] = [];

        const scheduledAt = row.scheduled_at
          ? new Date(row.scheduled_at)
          : undefined;

        if (row.group_id && groupCounts[row.group_id] > 1) {
          classes.push(
            'border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/10'
          );
        }

        if (scheduledAt && isToday(scheduledAt)) {
          classes.push('bg-slate-50/80 dark:bg-slate-900/40');
        }

        if (scheduledAt && isNowWindow(scheduledAt)) {
          classes.push(
            'border-l-4 border-l-primary bg-primary/5 dark:bg-primary/10'
          );
        }

        return cn(classes);
      }}
    >
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
