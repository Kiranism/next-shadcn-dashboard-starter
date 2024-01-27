import { getFileUrl } from "@/app/api/uploadthing/core";
import BreadCrumb from "@/components/breadcrumb";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import { Heading } from "@/components/ui/heading";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getLogById } from "@/lib/collections/log.collection";
import { formatDateLocal } from "@/lib/helpers/formatDate";
import React from "react";

function CardInfo({
  title,
  value,
  children,
}: {
  title: string;
  value?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-sm font-semibold">{title}</span>
      {value && <span>{value}</span>}
      {children}
    </div>
  );
}

export default async function Page({ params }: { params: { logId: string } }) {
  const { logId } = params;

  const breadcrumbItems = [
    { title: "Logs", link: "/dashboard/log" },
    { title: "Detail", link: `/dashboard/log/${logId}` },
  ];

  const log = await getLogById(logId);

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-5">
        <BreadCrumb items={breadcrumbItems} />
        <Heading title="Log details" />

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">General</h3>
          </CardHeader>

          <CardContent className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <CardInfo title="ID" value={log._id} />
            <CardInfo title="Date" value={formatDateLocal(log.timestamp)} />
            <CardInfo title="Status">
              <Badge
                className="uppercase w-fit"
                color={log.status === "error" ? "red" : "green"}
              >
                {log.status}
              </Badge>
            </CardInfo>
            <CardInfo title="To" value={log.phone} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold">Message</h3>
          </CardHeader>

          <CardContent>
            <p className="leading-relaxed">{log.message}</p>
          </CardContent>
        </Card>

        {log.imageId && (
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold">Image</h3>
            </CardHeader>

            <CardContent>
              <img src={getFileUrl(log.imageId)} alt="" className="w-full" />
            </CardContent>
          </Card>
        )}
      </div>
    </ScrollArea>
  );
}
