'use server';

import requestAPI from './request-api.action';

interface IUpdateProductAttributeValueActionProps {
  data: {
    attributeGroup_id: string;
    value: string;
  };
  method: 'POST' | 'PATCH';
  id?: string;
}

export default async function updateProductAttributeValue({
  data,
  method,
  id
}: IUpdateProductAttributeValueActionProps) {
  return await requestAPI({
    method,
    endpoint: ['attribute-value', method === 'POST' ? '' : id].join('/'),
    authenticate: true,
    body: JSON.stringify(data),
    asFormData: true
  });
}
