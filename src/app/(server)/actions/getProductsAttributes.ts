'use server';

import { IProductAttributeListResponse } from 'types/schema/product.shema';
import requestAPI from './request-api.action';

interface FilterProps {
  page?: number;
  limit?: number;
  search?: string;
}

export default async function getProductAttributes({
  page = 1,
  limit = 10,
  search = ''
}: FilterProps) {
  return await requestAPI<IProductAttributeListResponse>({
    endpoint: 'product-attribute',
    method: 'GET',
    authenticate: false,
    query: [
      ['page', `${page}`],
      ['limit', `${limit}`],
      ['search', search]
    ]
  });
}
