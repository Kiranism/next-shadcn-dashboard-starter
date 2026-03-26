'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { useDataTable } from '@/hooks/use-data-table';
import { useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { usersQueryOptions } from '../../api/queries';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function UsersTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    role: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(params.role && { roles: params.role }),
    ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) })
  };

  const { data, isLoading } = useQuery(usersQueryOptions(filters));

  const totalUsers = data?.total_users ?? 0;
  const users = data?.users ?? [];
  const pageCount = Math.ceil(totalUsers / params.perPage);

  const { table } = useDataTable({
    data: users,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: {
      columnPinning: { right: ['actions'] }
    }
  });

  if (isLoading) {
    return <DataTableSkeleton columnCount={5} rowCount={10} filterCount={2} />;
  }

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}

export function UsersTableSkeleton() {
  return <DataTableSkeleton columnCount={5} rowCount={10} filterCount={2} />;
}
