'use client';

/**
 * Driver table wrapper — uses TanStack Table and DataTable.
 * Renders the drivers table in table view at /dashboard/drivers.
 */

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { useDataTable } from '@/hooks/use-data-table';
import type { DriverWithProfile } from '@/features/driver-management/types';
import { type ColumnDef } from '@tanstack/react-table';
import { parseAsInteger, useQueryState } from 'nuqs';
import { columns } from './columns';

interface DriverTableProps {
  data: DriverWithProfile[];
  totalItems: number;
}

export function DriverTable({ data, totalItems }: DriverTableProps) {
  const [pageSize] = useQueryState('perPage', parseAsInteger.withDefault(10));
  const pageCount = Math.ceil(totalItems / pageSize);

  const { table } = useDataTable({
    data,
    columns: columns as ColumnDef<DriverWithProfile, unknown>[],
    pageCount,
    shallow: false,
    debounceMs: 500
  });

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
