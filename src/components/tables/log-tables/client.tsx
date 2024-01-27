"use client";

import { DataTable } from "@/components/ui/data-table";
import { Heading } from "@/components/ui/heading";
import { Separator } from "@/components/ui/separator";
import { useRouter } from "next/navigation";
import { columns } from "./columns";
import Log from "@/lib/models/logs";

interface ProductsClientProps {
  data: Log[];
}

export const LogClient: React.FC<ProductsClientProps> = ({ data }) => {
  const router = useRouter();

  return (
    <>
      <div className="flex items-start justify-between">
        <Heading
          title={`Logs Message (${data.length})`}
          description="List of all logs message"
        />
      </div>
      <Separator />
      <DataTable searchKey="phone" columns={columns} data={data} />
    </>
  );
};
