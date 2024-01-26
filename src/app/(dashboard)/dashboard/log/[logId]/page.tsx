import BreadCrumb from "@/components/breadcrumb";
import { Heading } from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import React from "react";

export default function Page({ params }: { params: { logId: string } }) {
  const { logId } = params;

  const breadcrumbItems = [
    { title: "Logs", link: "/dashboard/log" },
    { title: "Detail", link: `/dashboard/log/${logId}` },
  ];
  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-5">
        <BreadCrumb items={breadcrumbItems} />
        <Heading
          title="Log details"
          description={`
        Detail of log message with id ${logId}
        `}

        
        />
      </div>
    </ScrollArea>
  );
}
