"use client";
import { ColumnDef } from "@tanstack/react-table";
import { CellAction } from "./cell-action";
import { User } from "@/constants/data";

export const columns: ColumnDef<User>[] = [
  {
    accessorKey: "name",
    header: "NAME",
  },
  {
    accessorKey: "company",
    header: "COMPANY",
  },
  {
    accessorKey: "role",
    header: "ROLE",
  },
  {
    accessorKey: "status",
    header: "STATUS",
  },
  {
    id: "actions",
    cell: ({ row }) => <CellAction data={row.original} />,
  },
];
