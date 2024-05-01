import { promises as fs } from "fs";
import path from "path";
import { Metadata } from "next";
import Image from "next/image";
import { z } from "zod";

import { columns } from "./components/columns";
import { DataTable } from "./components/data-table";

import { dirItem } from "./data/schema";
import { directoryItemsApi } from "@/app/api/api";
import { DirItem } from "@/app/api/types/api.types";

export const metadata: Metadata = {
  title: "Tasks",
  description: "A task and issue tracker build using Tanstack Table.",
};

export default async function TaskPage() {
  const items = directoryItemsApi.useListDirectoryItemsQuery({
    limit: 10,
    offset: 0,
    parent_id: undefined,
  });

  const dirItems: DirItem[] = items.data?.items ?? [];

  return (
    <>
      <div className="hidden h-full flex-1 flex-col space-y-8 p-8 md:flex">
        <DataTable data={dirItems} columns={columns} />
      </div>
    </>
  );
}
