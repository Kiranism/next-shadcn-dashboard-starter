import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  CreateDirItemApiRequest,
  ListDirItemsApiRequest,
  ListDirItemsApiResponse,
} from "./types/model.types";
import { api } from "./api";
import {
  ListQueryLogsApiResponse,
  ListQueryLogsApiRequest,
  QueryApiRequest,
  QueryApiResult,
} from "./types/query.types";

export const queryApi = api
  .enhanceEndpoints({
    addTagTypes: ["Query"],
  })
  .injectEndpoints({
    endpoints: (build) => ({
      // The query accepts a number and returns a Post
      listQueryLogs: build.query<
        ListQueryLogsApiResponse,
        ListQueryLogsApiRequest
      >({
        // note: an optional `queryFn` may be used in place of `query`
        query: ({ limit, offset, session_id, query_like }) => {
          const queryLikeQueryParam = query_like
            ? `&query_like=${query_like}`
            : "";
          return {
            url:
              `/search/logs?limit=${limit}&offset=${offset}&session_id=${session_id}` +
              queryLikeQueryParam,
          };
        },
        providesTags: ["Query"],
      }),
      query: build.mutation<QueryApiResult, QueryApiRequest>({
        // note: an optional `queryFn` may be used in place of `query`
        query: (request) => {
          return {
            url: "/search/query",
            method: "POST",
            body: request,
          };
        },
        invalidatesTags: ["Query"],
      }),
    }),
  });
