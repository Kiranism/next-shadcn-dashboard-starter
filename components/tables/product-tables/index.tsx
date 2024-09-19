'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { FilterBox } from '@/components/filter-box';
import { columns } from '../user-tables/columns';
import { users } from '@/constants/data';
import { DataTableSearch } from '@/components/ui/table/data-table-search';

export default function ProductTable() {
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

  return (
    <div className="space-y-4">
      <div className="flex space-x-2">
        <DataTableSearch searchKey="name" />
        <FilterBox filterKey="status" title="Status" options={statusOptions} />
        <FilterBox filterKey="role" title="Role" options={roleOptions} />
      </div>
      <DataTable columns={columns} data={users} totalItems={users.length} />
    </div>
  );
}
