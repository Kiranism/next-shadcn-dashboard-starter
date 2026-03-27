// ============================================================
// Product Service — Data Access Layer
// ============================================================
// This is the ONLY file you modify when connecting to your backend.
// Queries (queries.ts) and components import from here — they never change.
//
// Pick your pattern and replace the function bodies below:
//
// 1. Server Actions + ORM (Prisma / Drizzle / Supabase)
//    → Add 'use server' at the top of this file
//    → Call your ORM directly in each function
//
// 2. Route Handlers + ORM
//    → import { apiClient } from '@/lib/api-client'
//    → return apiClient<ProductsResponse>('/products?...')
//    → Replace mock calls in route handlers (src/app/api/products/) with ORM
//
// 3. BFF — Route Handlers proxy to external backend (Laravel, Go, etc.)
//    → import { apiClient } from '@/lib/api-client'
//    → return apiClient<ProductsResponse>('/products?...')
//    → Route handlers proxy requests to your external backend service
//
// 4. Direct external API (frontend-only, no Next.js backend)
//    → const res = await fetch('https://your-api.com/products?...')
//    → return res.json()
//
// Current: Mock (in-memory fake data for demo/prototyping)
// ============================================================

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
