'use server';

import requestAPI from './request-api.action';

interface IUpdateProductAttributeGroupActionProps {
  data: {
    title: string;
  };
  method: 'POST' | 'PATCH';
  id?: string;
}

export default async function updateProductAttributeGroup({
  data,
  method,
  id
}: IUpdateProductAttributeGroupActionProps) {
  return await requestAPI({
    method,
    endpoint: ['attribute-group', method === 'POST' ? '' : id].join('/'),
    authenticate: true,
    body: JSON.stringify(data),
    asFormData: true
  });
}
