'use server';

import requestAPI from './request-api.action';

interface IUpdateProductAttributeActionProps {
  data: {
    attributeValue_id: string;
    product_id?: string;
  };
  method: 'POST' | 'PATCH';
  id?: string;
}

export default async function updateProductAttribute({
  data,
  method,
  id
}: IUpdateProductAttributeActionProps) {
  return await requestAPI({
    method,
    endpoint: ['product-attribute', method === 'POST' ? '' : id].join('/'),
    authenticate: true,
    body: JSON.stringify(data),
    asFormData: true
  });
}
