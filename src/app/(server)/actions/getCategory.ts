'use server';

import { ICategoryResponse } from 'types/schema/product.shema';
import requestAPI from './request-api.action';

export default async function getCategory(id: string) {
  const prod = await requestAPI<ICategoryResponse>({
    endpoint: ['category', id].join('/'),
    method: 'GET'
  });

  return prod;
}
