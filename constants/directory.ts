export type CreateDirItemRequest = {
  name?: string;
  description?: string;
  parent_id?: string;
  file?: File;
  tags?: string[];
  is_external_integration?: boolean;
};

export type DirItem = {
  id: string;
  org_id: string;
  parent_id?: string;
  name: string;
  tags: string[];
  created_at: Date | number | string;
  updated_at: Date | number | string;
  description: string;
  item_type: string;
  media_type: string;
  content?: string;
  url: string;
  documents_count?: number;
  chunk_config?: any;
  index_config?: any;
  is_external_integration: boolean;
  size: number;
  totalFiles?: number;
  isFavorited?: boolean;
};

export type ItemType =
  | "folder"
  | "file"
  | "link"
  | "note"
  | "image"
  | "video"
  | "audio"
  | "pdf"
  | "spreadsheet"
  | "ppt"
  | "text"
  | "json"
  | "other";

export type MimeType =
  | "application/pdf"
  | "application/xlsx"
  | "application/vnd.ms-excel"
  | "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  | "application/msword"
  | "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  | "application/vnd.ms-powerpoint"
  | "application/vnd.openxmlformats-officedocument.presentationml.presentation"
  | "text/plain"
  | "text/csv"
  | "text/html";
