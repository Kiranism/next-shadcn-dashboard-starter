import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Task } from "@/lib/store";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { cva } from "class-variance-authority";
import { GripVertical } from "lucide-react";
import { Badge } from "../ui/badge";
import Image from "next/image";

// export interface Task {
//   id: UniqueIdentifier;
//   columnId: ColumnId;
//   content: string;
// }

interface IntegrationCardProps {
  img: string;
  title: string;
  description: string;
  disabled?: boolean;
}

export function IntegrationCard({
  img,
  title,
  description,
  disabled,
}: IntegrationCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex mt-1 flex-row items justify-between">
          <div className="flex flex-col space-y-2">
            <div>
              <CardTitle>
                {title}
                <Badge className="ml-2" variant="outline">
                  Free
                </Badge>
              </CardTitle>
            </div>
            <div>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <div className="flex flex-col space-y-4">
            <div className="flex flex-row justify-end">
              <Image alt="" src={img} width={60} height={60}></Image>
            </div>
            <div>
              <Button variant={"outline"} disabled={disabled}>
                Connect
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}
