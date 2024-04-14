import { promises as fs } from "fs"
import path from "path"
import { Metadata } from "next"
import Image from "next/image"
import { z } from "zod"


import { ScrollArea } from "@/components/ui/scroll-area"

import BreadCrumb from "@/components/breadcrumb"
import { taskSchema } from "@/components/tables/directory-items-table/data/schema"
import { DataTable } from "@/components/tables/directory-items-table/components/data-table"
import { columns } from "@/components/tables/directory-items-table/components/columns"

export const metadata: Metadata = {
  title: "Tasks",
  description: "A task and issue tracker build using Tanstack Table.",
}

// Simulate a database read for tasks.
async function getTasks() {
  const data = await fs.readFile(
    path.join(process.cwd(), "components/tables/directory-items-table/data/tasks.json")
  )

  const tasks = JSON.parse(data.toString())

  return z.array(taskSchema).parse(tasks)
}

export default async function TaskPage() {
  const tasks = await getTasks()
  const breadcrumbItems = [
    { title: "User", link: "/dashboard/user" },
    { title: "Create", link: "/dashboard/user/create" },
  ];
  return (
    <>
    <ScrollArea className="rounded-md border ">
    <div className="flex-1 space-y-4  p-4 md:p-8 pt-6">
        <BreadCrumb items={breadcrumbItems} />

      <div className="hidden h-full flex-1 flex-col space-y-8 md:flex">
        <DataTable data={tasks} columns={columns} />
      </div>
      </div>
      </ScrollArea>

    </>
  )
}

