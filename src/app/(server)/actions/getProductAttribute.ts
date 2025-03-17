'use server';

import { IProductAttributeResponse } from 'types/schema/product.shema';
import requestAPI from './request-api.action';

export default async function getProductAttribute(id: string) {
  const prod = await requestAPI<IProductAttributeResponse>({
    endpoint: ['product-attribute', id].join('/'),
    method: 'GET'
  });

  return prod;
}
