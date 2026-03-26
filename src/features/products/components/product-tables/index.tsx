'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableToolbar } from '@/components/ui/table/data-table-toolbar';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { useDataTable } from '@/hooks/use-data-table';
import { useQuery } from '@tanstack/react-query';
import { parseAsInteger, parseAsString, useQueryStates } from 'nuqs';
import { getSortingStateParser } from '@/lib/parsers';
import { productsQueryOptions } from '../../api/queries';
import { columns } from './columns';

const columnIds = columns.map((c) => c.id).filter(Boolean) as string[];

export function ProductTable() {
  const [params] = useQueryStates({
    page: parseAsInteger.withDefault(1),
    perPage: parseAsInteger.withDefault(10),
    name: parseAsString,
    category: parseAsString,
    sort: getSortingStateParser(columnIds).withDefault([])
  });

  const filters = {
    page: params.page,
    limit: params.perPage,
    ...(params.name && { search: params.name }),
    ...(params.category && { categories: params.category }),
    ...(params.sort.length > 0 && { sort: JSON.stringify(params.sort) })
  };

  const { data, isLoading } = useQuery(productsQueryOptions(filters));

  const totalProducts = data?.total_products ?? 0;
  const products = data?.products ?? [];
  const pageCount = Math.ceil(totalProducts / params.perPage);

  const { table } = useDataTable({
    data: products,
    columns,
    pageCount,
    shallow: true,
    debounceMs: 500,
    initialState: {
      columnPinning: { right: ['actions'] }
    }
  });

  if (isLoading) {
    return <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />;
  }

  return (
    <DataTable table={table}>
      <DataTableToolbar table={table} />
    </DataTable>
  );
}
