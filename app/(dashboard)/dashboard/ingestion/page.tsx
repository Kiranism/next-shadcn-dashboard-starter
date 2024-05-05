import BreadCrumb from "@/components/breadcrumb";
import { Icons } from "@/components/icons";
import { IntegrationCard } from "@/components/integrations/integration-card";
import { UserClient } from "@/components/tables/user-tables/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { users } from "@/constants/data";
import { ScrollArea } from "@/components/ui/scroll-area";
import Image from "next/image";

export default function page() {
  const notionDescription =
    "Single space where you can think, write, and plan.";
  return (
    <>
      <ScrollArea className="h-full">
        <div className="flex-1 space-y-4  p-4 md:p-8 pt-6">
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <IntegrationCard
              img="/sources/ic_files.png"
              title="File Upload"
              description={notionDescription}
            ></IntegrationCard>
            <IntegrationCard
              img="/sources/ic_notion.png"
              title="Notion"
              description={notionDescription}
              disabled
            ></IntegrationCard>
            <IntegrationCard
              img="/sources/ic_drive.svg"
              title="Drive"
              description={notionDescription}
              disabled
            ></IntegrationCard>
            <IntegrationCard
              img="/sources/ic_youtube.webp"
              title="Youtube"
              description={notionDescription}
              disabled
            ></IntegrationCard>
            <IntegrationCard
              img="/sources/ic_web_crawler.png"
              title="Web Page"
              description={notionDescription}
              disabled
            ></IntegrationCard>
            <IntegrationCard
              img="/sources/ic_slack.png"
              title="Slack"
              description={notionDescription}
              disabled
            ></IntegrationCard>
          </div>
        </div>
      </ScrollArea>
    </>
  );
}
