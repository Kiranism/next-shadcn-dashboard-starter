import { promises as fs } from "fs";
import path from "path";
import { Metadata } from "next";
import Image from "next/image";
import { z } from "zod";

import { ScrollArea } from "@/components/ui/scroll-area";

import BreadCrumb from "@/components/breadcrumb";
import { dirItem } from "@/components/tables/directory-items-table/data/schema";
import { DataTable } from "@/components/tables/directory-items-table/components/data-table";
import { columns } from "@/components/tables/directory-items-table/components/columns";
import { DirItem } from "@/constants/directory";
import { directoryItemsApi } from "@/app/api/api";
import { ItemsTable } from "@/components/tables/directory-items-table/items-table";

export const metadata: Metadata = {
  title: "Tasks",
  description: "A task and issue tracker build using Tanstack Table.",
};

export default async function TaskPage() {
  const breadcrumbItems = [
    { title: "User", link: "/dashboard/user" },
    { title: "Create", link: "/dashboard/user/create" },
  ];

  return (
    <>
      <ScrollArea className="h-full">
        <div className="flex-1 space-y-4  p-4 md:p-8 pt-6">
          {/* <BreadCrumb items={breadcrumbItems} /> */}

          <div className="h-full flex-1 flex-col space-y-8 md:flex">
            <ItemsTable />
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
