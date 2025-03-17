'use server';

import { IProductListResponse } from 'types/schema/product.shema';
import requestAPI from './request-api.action';

interface FilterProps {
  page?: number;
  limit?: number;
  categories?: string;
  search?: string;
}

export default async function getProducts({
  page = 1,
  limit = 10,
  categories = '',
  search = ''
}: FilterProps) {
  return await requestAPI<IProductListResponse>({
    endpoint: 'products',
    method: 'GET',
    authenticate: false,
    query: [
      ['page', `${page}`],
      ['limit', `${limit}`],
      ['categories', categories],
      ['search', search]
    ]
  });
}
