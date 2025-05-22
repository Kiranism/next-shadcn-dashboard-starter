'use client';
import { Checkbox } from '@/components/ui/checkbox';
import { Employee, Department, ContractType, EmployeeStatus } from '@/types'; // Updated import
import { ColumnDef } from '@tanstack/react-table';
import { CellAction } from './cell-action';
import { Badge } from '@/components/ui/badge'; // For status visual cue
import { Button } from '@/components/ui/button'; // For expander button
import { ChevronDownIcon, ChevronRightIcon } from 'lucide-react'; // Icons for expander

export const columns: ColumnDef<Employee>[] = [
  {
    id: 'expander',
    header: () => null, // No header text or provide a generic one
    cell: ({ row }) => {
      return row.getCanExpand() ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={row.getToggleExpandedHandler()}
          className="p-1" // Reduce padding
        >
          {row.getIsExpanded() ? (
            <ChevronDownIcon className="h-4 w-4" />
          ) : (
            <ChevronRightIcon className="h-4 w-4" />
          )}
          <span className="sr-only">
            {row.getIsExpanded() ? 'Collapse row' : 'Expand row'}
          </span>
        </Button>
      ) : null;
    },
    enableSorting: false,
    enableHiding: false,
    // size: 40, // Optional: fix the size of the expander column
  },
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false
  },
  {
    accessorKey: 'EmployeeId',
    header: 'ID'
  },
  {
    accessorKey: 'FullName',
    header: 'FULL NAME'
  },
  {
    accessorKey: 'Phone',
    header: 'PHONE'
  },
  {
    accessorKey: 'department',
    header: 'DEPARTMENT',
    cell: ({ row }) => {
      const department = row.getValue('department') as Department;
      return department ? Department[department as keyof typeof Department] : 'N/A';
    }
  },
  {
    accessorKey: 'position',
    header: 'POSITION'
  },
  {
    accessorKey: 'hireDate',
    header: 'HIRE DATE',
    cell: ({ row }) => {
      const dateValue = row.getValue('hireDate');
      if (!dateValue) return 'N/A';
      // Attempt to parse if it's a string, otherwise assume it's a Date object
      const date = typeof dateValue === 'string' ? new Date(dateValue) : (dateValue as Date);
      return date.toLocaleDateString();
    }
  },
  {
    accessorKey: 'contractType',
    header: 'CONTRACT TYPE',
    cell: ({ row }) => {
      const contract = row.getValue('contractType') as ContractType;
      return contract ? ContractType[contract as keyof typeof ContractType] : 'N/A';
    }
  },
  {
    accessorKey: 'status',
    header: 'STATUS',
    cell: ({ row }) => {
      const status = row.getValue('status') as EmployeeStatus;
      const statusValue = status ? EmployeeStatus[status as keyof typeof EmployeeStatus] : 'N/A';
      let variant: 'default' | 'secondary' | 'destructive' | 'outline' = 'default';
      if (status === EmployeeStatus.ACTIVE) variant = 'secondary'; // Greenish typically
      if (status === EmployeeStatus.INACTIVE) variant = 'destructive'; // Reddish
      // Note: shadcn/ui Badge variants might need custom styling for specific colors (e.g. green for active)
      // Using 'secondary' for Active and 'destructive' for Inactive as placeholders.
      return <Badge variant={variant}>{statusValue}</Badge>;
    }
  },
  {
    id: 'actions',
    cell: ({ row }) => <CellAction data={row.original} />
  }
];
