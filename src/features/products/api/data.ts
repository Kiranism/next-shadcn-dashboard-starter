// ============================================================
// Product Data: server-only data access
// ============================================================
// This is the ONLY file you modify when connecting to your backend.
// Route handlers (src/app/api/products/) and the server prefetch call these
// functions. The browser reaches them through the route handlers (service.ts),
// so tokens, secrets, and database clients never leave the server.
// Same split as TanStack's Next.js example (app/api/todos/data.ts).
//
// Replace the function bodies below:
//
// ORM (Prisma / Drizzle / Supabase)
//    → return db.query.products.findMany({ ... })
//
// External backend (Laravel, Go, etc.) with a token
//    → const { getToken } = await auth(); // Clerk's server auth(), or read your own token cookie
//    → const res = await fetch(`${process.env.BACKEND_URL}/products?...`, {
//        headers: { Authorization: `Bearer ${await getToken()}` }
//      })
//    → return res.json()
//
// Current: Mock (in-memory fake data for demo/prototyping)
// ============================================================

import 'server-only';
import { fakeProducts } from '@/constants/mock-api';
import type {
  ProductFilters,
  ProductsResponse,
  ProductByIdResponse,
  ProductMutationPayload
} from './types';

export async function getProducts(filters: ProductFilters): Promise<ProductsResponse> {
  return fakeProducts.getProducts(filters);
}

export async function getProductById(id: number): Promise<ProductByIdResponse> {
  return fakeProducts.getProductById(id) as Promise<ProductByIdResponse>;
}

export async function createProduct(data: ProductMutationPayload) {
  return fakeProducts.createProduct(data);
}

export async function updateProduct(id: number, data: ProductMutationPayload) {
  return fakeProducts.updateProduct(id, data);
}

export async function deleteProduct(id: number) {
  return fakeProducts.deleteProduct(id);
}
