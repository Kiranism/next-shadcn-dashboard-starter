"use client";

import { Cross2Icon, UploadIcon } from "@radix-ui/react-icons";
import { Table } from "@tanstack/react-table";

import { priorities, statuses } from "../data/data";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { DataTableViewOptions } from "./data-table-view-options";
import { UploadDialog } from "./data-table-upload-dialog";

interface DataTableToolbarProps<TData> {
  table: Table<TData>;
}

export function DataTableToolbar<TData>({
  table,
}: DataTableToolbarProps<TData>) {
  const isFiltered = table.getState().columnFilters.length > 0;

  return (
    <div className="flex items-center justify-between">
      <div className="flex flex-1 items-center space-x-2">
        <Input
          placeholder="Filter tasks..."
          value={(table.getColumn("title")?.getFilterValue() as string) ?? ""}
          onChange={(event) =>
            table.getColumn("title")?.setFilterValue(event.target.value)
          }
          className="h-8 w-[150px] lg:w-[250px]"
        />
        {table.getColumn("status") && (
          <DataTableFacetedFilter
            column={table.getColumn("status")}
            title="Status"
            options={statuses}
          />
        )}
        {table.getColumn("priority") && (
          <DataTableFacetedFilter
            column={table.getColumn("priority")}
            title="Priority"
            options={priorities}
          />
        )}
        {isFiltered && (
          <Button
            variant="ghost"
            onClick={() => table.resetColumnFilters()}
            className="h-8 px-2 lg:px-3"
          >
            Reset
            <Cross2Icon className="ml-2 h-4 w-4" />
          </Button>
        )}
      </div>
      <div className="flex items-center space-x-2">
        <UploadDialog
          categories={[
            {
              _id: "1",
              name: "45cc046b-a396-4e0b-98b5-42e042251b9345cc046b-a396-4e0b-98b5-42e042251b9345cc046b-a396-4e0b-98b5-42e042251b93",
            },
            {
              _id: "3",
              name: "1e3e6ebe-6984-4702-b161-7ba8ae66b949",
            },
          ]}
          initialData={null}
          key={null}
        />
        <DataTableViewOptions table={table} />
      </div>
    </div>
  );
}
