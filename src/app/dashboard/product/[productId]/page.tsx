import { auth } from '@clerk/nextjs/server';
import { HydrationBoundary, dehydrate, noop } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { productQueries } from '@/features/products/api/queries';
import PageContainer from '@/components/layout/page-container';
import ProductViewPage from '@/features/products/components/product-view-page';

export const metadata = {
  title: 'Dashboard : Product View'
};

type PageProps = { params: Promise<{ productId: string }> };

export default async function Page(props: PageProps) {
  await auth.protect();

  const params = await props.params;
  const queryClient = getQueryClient();

  if (params.productId !== 'new') {
    void queryClient.query(productQueries.detail(Number(params.productId))).catch(noop);
  }

  return (
    <PageContainer>
      <div className='flex-1 space-y-4'>
        <HydrationBoundary state={dehydrate(queryClient)}>
          <ProductViewPage productId={params.productId} />
        </HydrationBoundary>
      </div>
    </PageContainer>
  );
}
