import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  CreateDirItemApiRequest,
  ListDirItemsApiRequest,
  ListDirItemsApiResponse,
} from "./types/model.types";

// const parentIdQueryParam = parent_id ? `&parent_id=${parent_id}` : "";
// return (
//   `/api/directory/items?limit=${limit}&offset=${offset}` +
//   parentIdQueryParam
export const api = createApi({
  baseQuery: fetchBaseQuery({
    baseUrl: "http://localhost:8000/api",
  }),
  endpoints: () => ({}),
});

export const directoryItemsApi = api
  .enhanceEndpoints({
    addTagTypes: ["DirItems"],
  })
  .injectEndpoints({
    endpoints: (build) => ({
      // The query accepts a number and returns a Post
      listDirectoryItems: build.query<
        ListDirItemsApiResponse,
        ListDirItemsApiRequest
      >({
        // note: an optional `queryFn` may be used in place of `query`
        query: ({ limit, offset, parent_id }) => {
          const parentIdQueryParam = parent_id ? `&parent_id=${parent_id}` : "";
          return {
            url:
              `/directory/items?limit=${limit}&offset=${offset}` +
              parentIdQueryParam,
          };
        },
        providesTags: ["DirItems"],
      }),
      deleteDirectoryItem: build.mutation<void, { id: string }>({
        query: ({ id }) => ({
          url: `/directory/item/${id}`,
          method: "DELETE",
        }),
        invalidatesTags: ["DirItems"],
      }),
      createDirectoryItem: build.mutation<void, CreateDirItemApiRequest>({
        query: (request) => {
          const formData = new FormData();
          request.file && formData.append("file", request.file);
          request.name && formData.append("name", request.name);
          request.description &&
            formData.append("description", request.description);
          request.parent_id && formData.append("parent_id", request.parent_id);
          request.tags && formData.append("tags", request.tags.toString());
          request.is_external_integration &&
            formData.append(
              "is_external_integration",
              request.is_external_integration.toString(),
            );
          return {
            url: "/directory/item",
            method: "POST",
            body: formData,
            headers: {
              "content-type": "multipart/form-data",
              "Access-Control-Allow-Origin": "*",
              "Access-Control-Allow-Methods":
                "GET,PUT,POST,DELETE,PATCH,OPTIONS",
            },
          };
        },
        invalidatesTags: ["DirItems"],
      }),
    }),
  });
