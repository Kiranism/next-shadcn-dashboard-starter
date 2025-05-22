'use client';

import React, { useState } from 'react';
import { DataTable } from '@/components/ui/table/data-table';
import { DataTableFilterBox } from '@/components/ui/table/data-table-filter-box';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { Employee, EmployeeStatus } from '@/types'; // Updated import, added EmployeeStatus
import { columns } from '../employee-tables/columns';
import {
  useEmployeeTableFilters,
  departmentOptions,
  statusOptions,
  contractTypeOptions
} from './use-employee-table-filters';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import ConfirmDialog from '@/components/modal/confirm-dialog';
import { ChevronDownIcon, TrashIcon, CheckCircleIcon, XCircleIcon } from 'lucide-react';
import EmployeeExpandedDetail from './EmployeeExpandedDetail'; // Import the new component

export default function EmployeeTable({
  data,
  totalData
}: {
  data: Employee[];
  totalData: number;
}) {
  const {
    table,
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    setSearchQuery,
    setPage,
    departmentFilter,
    setDepartmentFilter,
    statusFilter,
    setStatusFilter,
    contractTypeFilter,
    setContractTypeFilter,
  } = useEmployeeTableFilters({ data, columns });

  const [isConfirmDeleteDialogOpen, setConfirmDeleteDialogOpen] = useState(false);
  // No separate dialog for status change for now

  const selectedRowObjects = table.getFilteredSelectedRowModel().flatRows;

  const openDeleteConfirmDialog = () => {
    if (selectedRowObjects.length > 0) {
      setConfirmDeleteDialogOpen(true);
    }
  };

  const handleBulkDelete = () => {
    console.log(
      `Deleting ${selectedRowObjects.length} employees:`,
      selectedRowObjects.map((row) => row.original.EmployeeId)
    );
    // Simulate API call then...
    table.resetRowSelection(); // or table.toggleAllRowsSelected(false)
    setConfirmDeleteDialogOpen(false);
    // Add toast notification here in a real app
  };

  const handleBulkChangeStatus = (newStatus: EmployeeStatus) => {
    if (selectedRowObjects.length > 0) {
      console.log(
        `Changing status of ${selectedRowObjects.length} employees to ${newStatus}:`,
        selectedRowObjects.map((row) => row.original.EmployeeId)
      );
      // Simulate API call then...
      table.resetRowSelection();
      // Add toast notification here in a real app
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 md:gap-4">
        <div className="flex flex-wrap items-center gap-2 md:gap-4">
          <DataTableSearch
            searchQuery={searchQuery || ''}
            setSearchQuery={setSearchQuery}
            setPage={setPage}
            placeholder="Search by name..."
          />
          <DataTableFilterBox
            filterKey="department"
            title="Department"
            options={departmentOptions}
            setFilterValue={setDepartmentFilter}
            filterValue={departmentFilter || ''}
          />
          <DataTableFilterBox
            filterKey="status"
            title="Status"
            options={statusOptions}
            setFilterValue={setStatusFilter}
            filterValue={statusFilter || ''}
          />
          <DataTableFilterBox
            filterKey="contractType"
            title="Contract Type"
            options={contractTypeOptions}
            setFilterValue={setContractTypeFilter}
            filterValue={contractTypeFilter || ''}
          />
          {isAnyFilterActive && (
            <DataTableResetFilter
              isFilterActive={isAnyFilterActive}
              onReset={resetFilters}
            />
          )}
        </div>
        
        {selectedRowObjects.length > 0 && (
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {selectedRowObjects.length} selected
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Actions <ChevronDownIcon className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Bulk Actions</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleBulkChangeStatus(EmployeeStatus.ACTIVE)}>
                  <CheckCircleIcon className="mr-2 h-4 w-4" /> Mark as Active
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleBulkChangeStatus(EmployeeStatus.INACTIVE)}>
                  <XCircleIcon className="mr-2 h-4 w-4" /> Mark as Inactive
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={openDeleteConfirmDialog} className="text-red-600 hover:!text-red-600">
                  <TrashIcon className="mr-2 h-4 w-4" /> Delete Selected
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
      </div>

      <DataTable 
        table={table} 
        columns={columns} 
        totalItems={totalData}
        renderSubComponent={(row) => <EmployeeExpandedDetail employee={row.original as Employee} />} // Pass the render function
      />

      <ConfirmDialog
        isOpen={isConfirmDeleteDialogOpen}
        onClose={() => setConfirmDeleteDialogOpen(false)}
        onConfirm={handleBulkDelete}
        title="Confirm Bulk Deletion"
        description={`Are you sure you want to delete ${selectedRowObjects.length} selected employee(s)? This action cannot be undone.`}
        confirmButtonLabel="Delete"
        confirmButtonVariant="destructive"
        isLoading={false} // Set to true during actual API call
      />
    </div>
  );
}
