// ============================================================
// Product Service: browser-side API calls
// ============================================================
// Calls this app's route handlers (src/app/api/products/), the same way
// TanStack's Next.js example calls /api/todos (services/todos/api.ts).
// The requests are same-origin, so the auth cookie goes along and no token
// code is needed here. You don't change this file to connect a backend:
// edit data.ts instead.
// ============================================================

import { apiClient, toSearchParams } from '@/lib/api-client';
import type {
  ProductFilters,
  ProductsResponse,
  ProductByIdResponse,
  ProductMutationPayload
} from './types';

export async function getProducts(filters: ProductFilters): Promise<ProductsResponse> {
  return apiClient<ProductsResponse>(`/products?${toSearchParams(filters)}`);
}

export async function getProductById(id: number): Promise<ProductByIdResponse> {
  return apiClient<ProductByIdResponse>(`/products/${id}`);
}

export async function createProduct(data: ProductMutationPayload) {
  return apiClient('/products', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateProduct(id: number, data: ProductMutationPayload) {
  return apiClient(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteProduct(id: number) {
  return apiClient(`/products/${id}`, { method: 'DELETE' });
}
