"use client";
import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { Checkbox } from "@/components/ui/checkbox";
import Log from "@/lib/models/logs";

export const columns: ColumnDef<Log>[] = [
  {
    id: "select",
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
    enableHiding: false,
  },
  {
    accessorKey: "phone",
    header: "Number",
  },
  {
    accessorKey: "status",
    header: "STATUS",
  },
  {
    accessorKey: "key",
    header: "KEY",
  },
  {
    accessorKey: "timestamp",
    header: "TIMESTAMP",
  },
  {
    accessorKey: "message",
    header: "MESSAGE",
  },
  {
    accessorKey: "imageId",
    header: "IMAGE",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
