export type QueryApiResult = {
  id: string;
  query: string;
  documents: SearchDocument[];
  timestamp: Date | number | string;
  method: string;
};

export type QueryApiRequest = {
  query: string;
  top_k: number;
};

export type ListQueryLogsApiResponse = {
  count: number;
  logs: QueryApiResult[];
};

export type DocumentMeta = {
  title: string;
  description: string;
  link: string;
  external_id: string;
  language: string;
};

export type SearchDocument = {
  id: string;
  name: string;
  item_id: string;
  content?: string;
  content_type?: string;
  meta?: DocumentMeta;
  id_hash_keys: string[];
  score: number;
  embedding?: string;
};
