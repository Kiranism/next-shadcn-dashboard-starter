'use client';

import { DataTable } from '@/components/ui/table/data-table';
import { DataTableResetFilter } from '@/components/ui/table/data-table-reset-filter';
import { DataTableSearch } from '@/components/ui/table/data-table-search';
import { Blogs } from '@/constants/data';
import { columns } from './columns';
import { useEmployeeTableFilters } from './use-employee-table-filters';

export default function BlogsTable({
  data,
  totalData,
  search,
  page,
  limit,
  setSearch,
  setPage,
  setLimit
}: {
  data: Blogs[];
  totalData: number;
  search: string;
  page: number;
  limit: number;
  setSearch: React.Dispatch<React.SetStateAction<string>>;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setLimit: React.Dispatch<React.SetStateAction<number>>;
}) {
  const {
    genderFilter,
    setGenderFilter,
    isAnyFilterActive,
    resetFilters,
    searchQuery,
    // setPage,
    setSearchQuery
  } = useEmployeeTableFilters();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <DataTableSearch
          searchKey="name"
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          // setPage={setPage}
          search={search}
          setSearch={setSearch}
        />
        {/* <DataTableFilterBox
          filterKey="gender"
          title="Gender"
          options={GENDER_OPTIONS}
          setFilterValue={setGenderFilter}
          filterValue={genderFilter}
        /> */}
        <DataTableResetFilter
          isFilterActive={isAnyFilterActive}
          onReset={resetFilters}
        />
      </div>
      <DataTable
        columns={columns}
        data={data}
        totalItems={totalData}
        page={page}
        limit={limit}
        setPage={setPage}
        setLimit={setLimit}
        url="/dashboard/blogs/edit"
      />
    </div>
  );
}
