import { notFound } from 'next/navigation';
import {
  IAttributeGroupListResponse,
  IAttributeValueListResponse,
  IProductAttributeResponse
} from 'types/schema/product.shema';
import getProductAttribute from '@/app/(server)/actions/getProductAttribute';
import ProductAttributeForm from './product-attribute-form';

interface IProductAttributeViewPageProps {
  attributeId: string;
  values?: IAttributeValueListResponse;
  groups?: IAttributeGroupListResponse;
}

export default async function ProductAttributeViewPage({
  attributeId,
  values,
  groups
}: IProductAttributeViewPageProps) {
  let productAttr: IProductAttributeResponse | undefined;
  let pageTitle = 'Create New Product Attribute';

  if (attributeId !== 'new') {
    const data = await getProductAttribute(attributeId);
    // product = data.product as Product;
    if (!data.ok) {
      console.error(
        '[ProductAttributeViewPage] Failed to get product attribute >',
        data.error
      );
      notFound();
    }

    pageTitle = `Edit Product Attribute`;
    productAttr = data.data;
  }

  return (
    <ProductAttributeForm
      initialData={productAttr?.payload}
      pageTitle={pageTitle}
      values={values?.payload ?? []}
      groups={groups?.payload ?? []}
    />
  );
}
