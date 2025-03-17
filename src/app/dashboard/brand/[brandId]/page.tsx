import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import getBrands from '@/app/(server)/actions/getBrands';
import getCategories from '@/app/(server)/actions/getCategories';
import BrandViewPage from '@/features/brands/components/brand-view-page';
import { SiteConfig } from '@/constants/site-config';

export const metadata = {
  title: SiteConfig.siteTitle.brand.view
};

type PageProps = {
  params: Promise<{ brandId: string }>;
  searchParams: Promise<{ preview: string }>;
};

export default async function Page(props: PageProps) {
  const params = await props.params;
  const sParams = await props.searchParams;

  // Get all brands and categories
  const [brands, categories] = await Promise.all([
    getBrands(),
    getCategories()
  ]);

  if (!brands.ok) {
    console.error(
      '[Brand by ID Page] > Failed to get the list of brands >',
      brands.error
    );
  }

  if (!categories.ok) {
    console.error(
      '[Brand by ID Page] > Failed to get the list of categories >',
      categories.error
    );
  }

  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <BrandViewPage
            categories={categories.ok ? categories.data : undefined}
            brandId={params.brandId}
          />
        </Suspense>
      </div>
    </PageContainer>
  );
}
