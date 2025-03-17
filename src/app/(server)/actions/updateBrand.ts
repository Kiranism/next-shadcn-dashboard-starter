'use server';

import requestAPI from './request-api.action';

interface IUpdateBrandActionProps {
  data: {
    name: string;
    slug: string;
    metaTitle?: string;
    metaDescription?: string;
    category_ids?: string[];
  };
  method: 'POST' | 'PATCH';
  id?: string;
}

export default async function updateBrand({
  data,
  method,
  id
}: IUpdateBrandActionProps) {
  return await requestAPI({
    method,
    endpoint: ['brand', method === 'POST' ? '' : id].join('/'),
    authenticate: true,
    body: JSON.stringify(data)
  });
}
