'use server';

import { IAttributeGroupListResponse } from 'types/schema/product.shema';
import requestAPI from './request-api.action';

interface FilterProps {
  page?: number;
  limit?: number;
  search?: string;
}

export default async function getProductAttributeGroups({
  page = 1,
  limit = 10,
  search = ''
}: FilterProps) {
  return await requestAPI<IAttributeGroupListResponse>({
    endpoint: 'attribute-group',
    method: 'GET',
    authenticate: false,
    query: [
      ['page', `${page}`],
      ['limit', `${limit}`],
      ['search', search]
    ]
  });
}
