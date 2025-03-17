import { notFound } from 'next/navigation';
import ProductForm from './product-form';
import getProduct from '@/app/(server)/actions/getProduct';
import {
  IBrandListResponse,
  ICategoryListResponse,
  IProductAttributeListResponse,
  IProductResponse
} from 'types/schema/product.shema';

interface IProductViewPageProps {
  productId: string;
  brands?: IBrandListResponse;
  categories?: ICategoryListResponse;
  attributes?: IProductAttributeListResponse;
}

export default async function ProductViewPage({
  productId,
  brands,
  categories,
  attributes
}: IProductViewPageProps) {
  let product: IProductResponse | undefined;
  let pageTitle = 'Create New Product';

  if (productId !== 'new') {
    const data = await getProduct(productId);
    // product = data.product as Product;
    if (!data.ok) {
      console.error('[ProductViewPage] Failed to get product >', data.error);
      notFound();
    }

    pageTitle = `Edit Product`;
    product = data.data;
  }

  return (
    <ProductForm
      initialData={product?.payload}
      pageTitle={pageTitle}
      categories={categories?.payload ?? []}
      brands={brands?.payload ?? []}
      attributes={attributes?.payload ?? []}
    />
  );
}
