'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import BreadCrumb from '@/components/breadcrumb';
import { ProductForm } from '@/components/forms/product-form';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getProduct } from '@/data/products';
import { Product } from '@/types/product';

export default function Page() {
  const params = useParams();
  const productId = params.productId as string;
  const [initialProduct, setInitialProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadProduct() {
      if (productId) {
        try {
          setIsLoading(true);
          const product = await getProduct(Number(productId));
          setInitialProduct(product);
        } catch (error) {
          console.error('Failed to fetch product:', error);
          // Handle error (e.g., show error message to user)
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    }

    loadProduct();
  }, [productId]);

  const breadcrumbItems = [
    { title: 'Product', link: '/dashboard/product' },
    {
      title: productId ? 'Edit' : 'Create',
      link: `/dashboard/product/${productId || 'create'}`
    }
  ];

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex-1 space-y-4 p-8">
        <BreadCrumb items={breadcrumbItems} />
        <ProductForm initialData={initialProduct} />
      </div>
    </ScrollArea>
  );
}
