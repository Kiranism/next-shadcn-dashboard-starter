'use client';

import { searchParams } from '@/lib/searchparams';
import { useQueryState } from 'nuqs';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Department, EmployeeStatus, ContractType, Employee } from '@/types';
import {
  ColumnDef,
  ColumnFiltersState,
  getCoreRowModel,
  getFilteredRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getPaginationRowModel,
  getExpandedRowModel, // Import getExpandedRowModel
  useReactTable,
  Table,
} from '@tanstack/react-table';

// Helper to generate options from enums
const getOptionsFromEnum = (enumObject: any) => {
  return Object.entries(enumObject).map(([_, value]) => ({
    value: value as string, // Use enum value directly as filter value
    label: value as string,
  }));
};

export const departmentOptions = getOptionsFromEnum(Department);
export const statusOptions = getOptionsFromEnum(EmployeeStatus);
export const contractTypeOptions = getOptionsFromEnum(ContractType);


interface UseEmployeeTableFiltersProps<TData, TValue> {
  data: TData[];
  columns: ColumnDef<TData, TValue>[];
  initialPageSize?: number;
}

export function useEmployeeTableFilters<TData extends Employee, TValue>({
  data,
  columns,
  initialPageSize = 10,
}: UseEmployeeTableFiltersProps<TData, TValue>) {
  const [searchQuery, setSearchQuery] = useQueryState(
    'q',
    searchParams.q.withOptions({ shallow: false, throttleMs: 1000 }).withDefault('')
  );

  const [departmentFilter, setDepartmentFilter] = useQueryState(
    'department',
    searchParams.string.withOptions({ shallow: false }).withDefault('') // dot-separated string
  );
  const [statusFilter, setStatusFilter] = useQueryState(
    'status',
    searchParams.string.withOptions({ shallow: false }).withDefault('') // dot-separated string
  );
  const [contractTypeFilter, setContractTypeFilter] = useQueryState(
    'contractType',
    searchParams.string.withOptions({ shallow: false }).withDefault('') // dot-separated string
  );

  const [page, setPage] = useQueryState('page', searchParams.page.withDefault(1));
  const [pageSize, setPageSize] = useQueryState('pageSize', searchParams.pageSize.withDefault(initialPageSize));


  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);

  // Sync URL filters to table's columnFilters state
  useEffect(() => {
    const newColumnFilters: ColumnFiltersState = [];
    if (searchQuery) {
      // Assuming global filter is handled by a 'FullName' column search or similar
      // For react-table, global filter is a separate concept.
      // Here, we'll add it as a filter on 'FullName' for simplicity.
      // Or, you might have a dedicated globalFilter state for the table.
      newColumnFilters.push({ id: 'FullName', value: searchQuery });
    }
    if (departmentFilter) {
      newColumnFilters.push({ id: 'department', value: departmentFilter.split('.').filter(Boolean) });
    }
    if (statusFilter) {
      newColumnFilters.push({ id: 'status', value: statusFilter.split('.').filter(Boolean) });
    }
    if (contractTypeFilter) {
      newColumnFilters.push({ id: 'contractType', value: contractTypeFilter.split('.').filter(Boolean) });
    }
    setColumnFilters(newColumnFilters);
  }, [searchQuery, departmentFilter, statusFilter, contractTypeFilter]);


  const table = useReactTable({
    data,
    columns,
    state: {
      columnFilters,
      pagination: {
        pageIndex: page - 1,
        pageSize,
      },
    },
    onColumnFiltersChange: setColumnFilters, // Allow table to update its own filters if needed
    onPaginationChange: (updater) => {
      if (typeof updater === 'function') {
        const newPaginationState = updater({ pageIndex: page -1, pageSize });
        setPage(newPaginationState.pageIndex + 1);
        setPageSize(newPaginationState.pageSize);
      } else {
        setPage(updater.pageIndex + 1);
        setPageSize(updater.pageSize);
      }
    },
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(), // For client-side filtering
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedRowModel: getFacetedRowModel(), // Enable faceted filtering
    getFacetedUniqueValues: getFacetedUniqueValues(), // Get unique values for facets
    getExpandedRowModel: getExpandedRowModel(), // Enable row expansion
    manualPagination: false, // Assuming client-side pagination for now
    manualFiltering: false, // Assuming client-side filtering
    enableExpanding: true, // Explicitly enable expanding
  });

  // Update URL when table's columnFilters change (e.g., by table's own UI like clear filter button)
  // This creates a two-way sync if the table itself can modify columnFilters
  useEffect(() => {
    const currentFullNameFilter = columnFilters.find(f => f.id === 'FullName')?.value as string | undefined;
    if ((currentFullNameFilter || '') !== (searchQuery || '')) {
       // setSearchQuery(currentFullNameFilter || null); // This might cause loops if not careful
    }

    const getFilterValueFromTable = (id: string) => (columnFilters.find(f => f.id === id)?.value as string[] | undefined)?.join('.') || '';
    
    if (getFilterValueFromTable('department') !== departmentFilter) {
        // setDepartmentFilter(getFilterValueFromTable('department') || null); // Loop risk
    }
    // Similar for status and contractType. Be cautious with two-way syncs like this.
    // For now, priotizing URL to table sync.

  }, [columnFilters, searchQuery, departmentFilter, statusFilter, contractTypeFilter, setSearchQuery, setDepartmentFilter, setStatusFilter, setContractTypeFilter]);


  const resetFilters = useCallback(() => {
    setSearchQuery(null);
    setDepartmentFilter(null);
    setStatusFilter(null);
    setContractTypeFilter(null);
    setPage(1);
    // table.resetColumnFilters(); // This would also clear filters
  }, [setSearchQuery, setDepartmentFilter, setStatusFilter, setContractTypeFilter, setPage]);

  const isAnyFilterActive = useMemo(() => {
    return !!searchQuery || !!departmentFilter || !!statusFilter || !!contractTypeFilter;
  }, [searchQuery, departmentFilter, statusFilter, contractTypeFilter]);
  
  // Expose page count for pagination UI
  const pageCount = table.getPageCount();

  return {
    table,
    searchQuery,
    setSearchQuery,
    departmentFilter,
    setDepartmentFilter,
    statusFilter,
    setStatusFilter,
    contractTypeFilter,
    setContractTypeFilter,
    departmentOptions,
    statusOptions,
    contractTypeOptions,
    page,
    setPage,
    pageSize,
    setPageSize,
    pageCount,
    resetFilters,
    isAnyFilterActive,
  };
}
