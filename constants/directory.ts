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
