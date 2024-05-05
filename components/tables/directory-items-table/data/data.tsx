import { Icons } from "@/components/icons";
import {
  ArrowDownIcon,
  ArrowRightIcon,
  ArrowUpIcon,
  CheckCircledIcon,
  CircleIcon,
  CrossCircledIcon,
  QuestionMarkCircledIcon,
  StopwatchIcon,
} from "@radix-ui/react-icons";
import { Icon } from "@iconify-icon/react";
import { MimeType } from "@/constants/directory";
import { FileCode } from "lucide-react";

export const labels = [
  {
    value: "bug",
    label: "Bug",
  },
  {
    value: "feature",
    label: "Feature",
  },
  {
    value: "documentation",
    label: "Documentation",
  },
];

export const itemType = [
  {
    value: "folder",
    label: "Folder",
    icon: Icons.folder,
  },
  {
    value: "text",
    label: "Text",
    icon: Icons.post,
  },
];

export const mediaTypes: {
  value: MimeType;
  label: string;
  icon: React.ReactNode;
}[] = [
  {
    value: "application/pdf",
    label: "Pdf",
    icon: (
      <Icon
        icon="streamline:convert-pdf-2"
        width={20}
        height={20}
        style={{ color: "#e13333" }}
        className="color-red-500"
      />
    ),
  },
  {
    value: "text/plain",
    label: "Text",
    icon: (
      <Icon
        icon="tabler:file-type-txt"
        width={23}
        height={23}
        className="color-gray-500 dark:text-gray-200"
      />
    ),
    // <iconify-icon icon="bxs:file-txt" width="24" height="24"  style="color: #e13333"></iconify-icon>
  },
  {
    value: "text/html",
    label: "HTML",
    icon: (
      <FileCode
        width={22}
        height={22}
        className="color-gray-500 dark:text-gray-200"
      />
    ),
  },

  {
    value: "text/csv",
    label: "CSV",
    icon: (
      <Icon
        icon="tabler:file-type-csv"
        width={23}
        height={23}
        className="color-gray-500 dark:text-gray-200"
      />
    ),
  },
  {
    value: "text/plain",
    label: "Google Drive",
    icon: (
      <Icon
        icon="logos:google-drive"
        width={20}
        height={20}
        className="text-muted-foreground"
      />
    ),
  },
  {
    value: "text/plain",
    label: "Google Drive",
    icon: (
      <Icon
        icon="devicon:notion"
        width={20}
        height={20}
        className="text-muted-foreground"
        // style="width: 24px; height: 24px;"
      />
    ),
  },
  // {
  //   value: "text",
  //   label: "Text",
  //   icon: Icons.post,
  // },
];

export const statuses = [
  {
    value: "backlog",
    label: "Backlog",
    icon: QuestionMarkCircledIcon,
  },
  {
    value: "todo",
    label: "Todo",
    icon: CircleIcon,
  },
  {
    value: "in progress",
    label: "In Progress",
    icon: StopwatchIcon,
  },
  {
    value: "done",
    label: "Done",
    icon: CheckCircledIcon,
  },
  {
    value: "canceled",
    label: "Canceled",
    icon: CrossCircledIcon,
  },
];

export const priorities = [
  {
    label: "Low",
    value: "low",
    icon: ArrowDownIcon,
  },
  {
    label: "Medium",
    value: "medium",
    icon: ArrowRightIcon,
  },
  {
    label: "High",
    value: "high",
    icon: ArrowUpIcon,
  },
];
