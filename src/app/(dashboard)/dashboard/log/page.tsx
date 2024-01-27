import BreadCrumb from "@/components/breadcrumb";
import { LogClient } from "@/components/tables/log-tables/client";
import { getAllLogs } from "@/lib/collections/log.collection";

const breadcrumbItems = [{ title: "Log", link: "/dashboard/log" }];
export default async function page() {

  const logs = await getAllLogs()

  return (
    <>
      <div className="flex-1 space-y-4  p-4 md:p-8 pt-6">
        <BreadCrumb items={breadcrumbItems} />
        <LogClient data={logs} />
      </div>
    </>
  );
}
