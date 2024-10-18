import { Breadcrumbs } from '@/components/breadcrumbs';
import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { ProductViewPage } from '@/sections/product/view';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard : Product View'
};

const breadcrumbItems = [
  { title: 'Dashboard', link: '/dashboard' },
  { title: 'Product', link: '/dashboard/product' },
  { title: 'Create', link: '/dashboard/product/create' }
];

type PageProps = { params: { productId: string } };

export default function Page({ params }: PageProps) {
  return (
    <PageContainer scrollable>
      <div className="flex-1 space-y-4">
        <Breadcrumbs items={breadcrumbItems} />
        <Suspense fallback={<FormCardSkeleton />}>
          <ProductViewPage productId={params.productId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
