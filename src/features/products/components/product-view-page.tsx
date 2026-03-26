'use client';

import { useQuery } from '@tanstack/react-query';
import { Product } from '@/constants/mock-api';
import { notFound } from 'next/navigation';
import ProductForm from './product-form';
import { productByIdOptions } from '../api/queries';
import FormCardSkeleton from '@/components/form-card-skeleton';

type TProductViewPageProps = {
  productId: string;
};

export default function ProductViewPage({ productId }: TProductViewPageProps) {
  if (productId === 'new') {
    return <ProductForm initialData={null} pageTitle='Create New Product' />;
  }

  return <EditProductView productId={Number(productId)} />;
}

function EditProductView({ productId }: { productId: number }) {
  const { data, isLoading } = useQuery(productByIdOptions(productId));

  if (isLoading) {
    return <FormCardSkeleton />;
  }

  if (!data?.success || !data?.product) {
    notFound();
  }

  return (
    <ProductForm
      initialData={data.product as Product}
      pageTitle='Edit Product'
    />
  );
}
