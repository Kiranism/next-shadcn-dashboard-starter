import { DirItem } from "./api.types";

export type ListDirItemsApiResponse = {
  items: DirItem[];
};

export type ListDirItemsApiRequest = {
  limit: number;
  offset: number;
  parent_id?: string;
};

export type CreateDirItemApiRequest = {
  name?: string;
  description?: string;
  parent_id?: string;
  file?: File;
  tags?: string[];
  is_external_integration?: boolean;
};
