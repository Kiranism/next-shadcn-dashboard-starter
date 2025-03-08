import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import ProductViewPage from '@/features/products/components/product-view-page';
import { setRequestLocale } from 'next-intl/server';
import { Metadata } from 'next';

// Define a simple static metadata that doesn't rely on translations
export const metadata: Metadata = {
  title: 'Dashboard: Product View'
};

type PageProps = {
  params: Promise<{
    locale: string;
    productId: string;
  }>;
};

export default async function Page(props: PageProps) {
  // Await the params before accessing any properties
  const params = await props.params;

  // Enable static rendering with the awaited locale
  setRequestLocale(params.locale);

  // Extract productId after awaiting params
  const { productId } = params;

  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <ProductViewPage productId={productId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
