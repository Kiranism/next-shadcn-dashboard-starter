'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
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

  return (
    <DataTable
      table={table}
      getRowClassName={(row: any) => {
        if (row.group_id && groupCounts[row.group_id] > 1) {
          return 'border-l-4 border-l-emerald-500 bg-emerald-50/30 dark:bg-emerald-500/10';
        }
        return '';
      }}
    >
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
