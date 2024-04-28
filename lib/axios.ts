import axios, { AxiosRequestConfig } from "axios";

// import { HOST_API } from "src/config-global";

// ----------------------------------------------------------------------

const axiosInstance = axios.create({ baseURL: "localhost:8080" });

axiosInstance.interceptors.response.use(
  (res) => res,
  (error) => Promise.reject(error || "Something went wrong"),
);

export default axiosInstance;

// ----------------------------------------------------------------------

export const fetcher = async (args: string | [string, AxiosRequestConfig]) => {
  const [url, config] = Array.isArray(args) ? args : [args];

  const res = await axiosInstance.get(url, { ...config });

  return res.data;
};

// ----------------------------------------------------------------------

export const endpoints = {
  chat: "/api/chat",
  kanban: "/api/kanban",
  calendar: "/api/calendar",
  auth: {
    me: "/api/auth/me",
    login: "/api/auth/login",
    register: "/api/auth/register",
  },
  assets: {
    files: {
      upload: "/api/assets/files/upload",
    },
  },
  directory: {
    list: (limit: number, offset: number, parent_id?: string) => {
      const parentIdQueryParam = parent_id ? `&parent_id=${parent_id}` : "";
      return (
        `/api/directory/items?limit=${limit}&offset=${offset}` +
        parentIdQueryParam
      );
    },
    item: {
      root: "/api/directory/item",
      id: (item_id: string) => `/api/directory/item/${item_id}`,
      path: (item_id: string) => `/api/directory/item/${item_id}/path`,
    },
  },
  search: {
    query: "/api/search/query",
    list: (limit: number, offset: number, query_like?: string) => {
      const queryLikeParam = query_like ? `&query_like=${query_like}` : "";
      return (
        `/api/search/logs?limit=${limit}&offset=${offset}` + queryLikeParam
      );
    },
  },
  product: {
    list: "/api/product/list",
    details: "/api/product/details",
    search: "/api/product/search",
  },
};
