'use client';

import { FilterBox } from '@/components/filter-box';
import { DataTable } from '@/components/ui/table/data-table';
import { parseAsString, useQueryState } from 'nuqs';
import { useCallback, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { Product } from '@/constants/data';
import { columns } from './columns';

const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' }
];

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
  { value: 'editor', label: 'Editor' }
];

export default function ProductTable({
  data,
  totalData
}: {
  data: Product[];
  totalData: number;
}) {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    parseAsString.withDefault('')
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    parseAsString.withDefault('')
  );
  const [roleFilter, setRoleFilter] = useQueryState(
    'role',
    parseAsString.withDefault('')
  );

  const isAnyFilterActive = useMemo(() => {
    return !!(searchQuery || statusFilter || roleFilter);
  }, [searchQuery, statusFilter, roleFilter]);

  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setStatusFilter(null);
    setRoleFilter(null);
  }, [setSearchQuery, setStatusFilter, setRoleFilter]);

  return (
    <div className="space-y-4 ">
      <div className="flex flex-wrap items-center gap-4">
        <DataTableSearch searchKey="Products" />
        <FilterBox filterKey="status" title="Status" options={statusOptions} />
        <FilterBox filterKey="role" title="Role" options={roleOptions} />
        {isAnyFilterActive && (
          <Button variant="outline" onClick={resetFilters}>
            Reset Filters
          </Button>
        )}
      </div>
      <DataTable columns={columns} data={data} totalItems={totalData} />
    </div>
  );
}
