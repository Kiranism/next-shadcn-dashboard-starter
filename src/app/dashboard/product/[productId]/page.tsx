import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { productByIdOptions } from '@/features/products/api/queries';
import PageContainer from '@/components/layout/page-container';
import ProductViewPage from '@/features/products/components/product-view-page';
import FormCardSkeleton from '@/components/form-card-skeleton';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Product View'
};

type PageProps = { params: Promise<{ productId: string }> };

export default async function Page(props: PageProps) {
  const params = await props.params;
  const queryClient = getQueryClient();

  if (params.productId !== 'new') {
    void queryClient.prefetchQuery(
      productByIdOptions(Number(params.productId))
    );
  }

  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <Suspense fallback={<FormCardSkeleton />}>
            <ProductViewPage productId={params.productId} />
          </Suspense>
        </HydrationBoundary>
      </div>
    </PageContainer>
  );
}
