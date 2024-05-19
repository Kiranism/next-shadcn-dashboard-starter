import { FileCode } from "lucide-react";
import { Icon } from "@iconify-icon/react";
import { MimeType } from "@/constants/directory";
import { itemType } from "@/components/tables/directory-items-table/data/data";
import { Icons } from "@/components/icons";
import { ReactNode } from "react";
import { DocumentRef } from "@/components/chat/Message";

export type ItemType =
  | "pdf"
  | "txt"
  | "html"
  | "csv"
  | "google-drive"
  | "notion";

export const mediaTypeToIcon = (docRef: DocumentRef): ReactNode => {
  console.log(docRef.mediaType);
  switch (docRef.mediaType) {
    case "application/pdf":
      return Icons.pdf2;
    case "text/plain":
      return Icons.txt({ width: 20, height: 20 });
    // case "text/html":
    //     return Icons.fileCode;
    case "text/csv":
      return Icons.csv;
    case "text/plain":
      return Icons.googleDrive;
    case "text/plain":
      return Icons.notion;
    default:
      return Icons.notion;
  }
};

export const itemTypeToIcon = (itemType: ItemType): ReactNode => {
  switch (itemType) {
    case "pdf":
      return Icons.pdf2;
    // case "txt":
    //   return Icons.txt;
    // case "html":
    //   return Icons.fileCode;
    case "csv":
      return Icons.csv;
    case "google-drive":
      return Icons.googleDrive;
    case "notion":
      return Icons.notion;
    default:
      return Icons.notion;
  }
};
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
