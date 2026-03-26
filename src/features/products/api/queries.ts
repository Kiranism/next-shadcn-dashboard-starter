import { queryOptions } from '@tanstack/react-query';
import { fakeProducts, type Product } from '@/constants/mock-api';

export type { Product };

export const productsQueryOptions = (filters: {
  page?: number;
  limit?: number;
  categories?: string;
  search?: string;
  sort?: string;
}) =>
  queryOptions({
    queryKey: ['products', filters],
    queryFn: () => fakeProducts.getProducts(filters)
  });

export const productByIdOptions = (id: number) =>
  queryOptions({
    queryKey: ['products', id],
    queryFn: () => fakeProducts.getProductById(id)
  });
