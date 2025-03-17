'use server';

import { ICategoryListResponse } from 'types/schema/product.shema';
import requestAPI from './request-api.action';

export default async function getCategories() {
  return await requestAPI<ICategoryListResponse>({
    method: 'GET',
    endpoint: 'category'
  });
}
