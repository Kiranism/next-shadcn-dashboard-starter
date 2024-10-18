import { fakeProducts, Product } from '@/constants/mock-api';
import ProductForm from '../product-form';
import { notFound } from 'next/navigation';

type TProductViewPageProps = {
  productId: string;
};

export default async function ProductViewPage({
  productId
}: TProductViewPageProps) {
  const data = await fakeProducts.getProductById(Number(productId));
  const product = data.product as Product;

  if (!product) {
    return notFound();
  }

  return <ProductForm initialData={product} />;
}
