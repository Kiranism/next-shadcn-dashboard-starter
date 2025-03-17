'use server';

import { IBrandListResponse } from 'types/schema/product.shema';
import requestAPI from './request-api.action';

export default async function getBrands() {
  return await requestAPI<IBrandListResponse>({
    method: 'GET',
    endpoint: 'brand'
  });
}
