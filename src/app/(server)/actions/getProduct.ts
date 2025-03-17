'use server';

import { IProductResponse } from 'types/schema/product.shema';
import requestAPI from './request-api.action';

export default async function getProduct(id: string) {
  const prod = await requestAPI<IProductResponse>({
    endpoint: ['products', id].join('/'),
    method: 'GET'
  });

  return prod;
}
