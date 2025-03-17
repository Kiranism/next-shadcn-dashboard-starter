'use server';

import { IBrandResponse } from 'types/schema/product.shema';
import requestAPI from './request-api.action';

export default async function getBrand(id: string) {
  const prod = await requestAPI<IBrandResponse>({
    endpoint: ['brand', id].join('/'),
    method: 'GET'
  });

  return prod;
}
