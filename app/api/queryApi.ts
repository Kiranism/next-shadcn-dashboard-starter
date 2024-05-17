import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import {
  CreateDirItemApiRequest,
  ListDirItemsApiRequest,
  ListDirItemsApiResponse,
} from "./types/model.types";
import { api } from "./api";
import { QueryApiRequest, QueryApiResult } from "./types/query.types";

export const queryApi = api
  .enhanceEndpoints({
    addTagTypes: ["DirItems"],
  })
  .injectEndpoints({
    endpoints: (build) => ({
      // The query accepts a number and returns a Post
      query: build.mutation<QueryApiResult, QueryApiRequest>({
        // note: an optional `queryFn` may be used in place of `query`
        query: (request) => {
          return {
            url: "/search/query",
            method: "POST",
            body: request,
          };
        },
      }),
    }),
  });
