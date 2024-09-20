'use client';

import { useState, useCallback, useMemo } from 'react';
import { useQueryState, parseAsString } from 'nuqs';
import { DataTable } from '@/components/ui/table/data-table';
import { FilterBox } from '@/components/filter-box';
import { searchParams } from '@/lib/searchparams';
import { Employee, users } from '@/constants/data';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { Button } from '@/components/ui/button';
import { columns } from '../employee-tables/columns';

export const statusOptions = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'pending', label: 'Pending' }
];

const roleOptions = [
  { value: 'admin', label: 'Admin' },
  { value: 'user', label: 'User' },
  { value: 'editor', label: 'Editor' }
];

export default function EmployeeTable({
  data,
  totalData
}: {
  data: Employee[];
  totalData: number;
}) {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q.withDefault('')
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
        <DataTableSearch searchKey="name" />
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
