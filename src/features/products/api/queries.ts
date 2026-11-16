import { mutationOptions, queryOptions } from '@tanstack/react-query';
import {
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  updateProduct
} from './service';
import type { Product, ProductFilters, ProductMutationPayload } from './types';

export type { Product };

// Reads: query key + browser fetcher in one place. Server prefetches reuse the key
// and swap in the server fetcher from data.ts: query({ ...productQueries.list(f), queryFn: ... }).
// Invalidate everything for this entity with productQueries.all().
export const productQueries = {
  all: () => ['products'] as const,
  list: (filters: ProductFilters) =>
    queryOptions({
      queryKey: [...productQueries.all(), 'list', filters] as const,
      queryFn: () => getProducts(filters)
    }),
  detail: (id: number) =>
    queryOptions({
      queryKey: [...productQueries.all(), 'detail', id] as const,
      queryFn: () => getProductById(id)
    })
};

// Writes: only the mutationFn. Components add onSuccess/onError/onSettled,
// including cache invalidation, so everything that happens after a mutation is in one place.
export const productMutations = {
  create: () =>
    mutationOptions({
      mutationFn: (data: ProductMutationPayload) => createProduct(data)
    }),
  update: () =>
    mutationOptions({
      mutationFn: ({ id, values }: { id: number; values: ProductMutationPayload }) =>
        updateProduct(id, values)
    }),
  delete: () =>
    mutationOptions({
      mutationFn: (id: number) => deleteProduct(id)
    })
};
