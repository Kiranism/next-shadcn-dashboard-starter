import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import getBrands from '@/app/(server)/actions/getBrands';
import getCategories from '@/app/(server)/actions/getCategories';
import { SiteConfig } from '@/constants/site-config';
import ProductViewPage from '@/features/products/components/product-view-page';
import getProductAttributes from '@/app/(server)/actions/getProductsAttributes';

export const metadata = {
  title: SiteConfig.siteTitle.product.view
};

type PageProps = {
  params: Promise<{ productId: string }>;
  searchParams: Promise<{ preview: string }>;
};

export default async function Page(props: PageProps) {
  const params = await props.params;
  const sParams = await props.searchParams;

  // Get all brands and categories
  const [brands, categories, attributes] = await Promise.all([
    getBrands(),
    getCategories(),
    getProductAttributes({})
  ]);

  if (!brands.ok) {
    console.error(
      '[Product by ID Page] > Failed to get the list of brands >',
      brands.error
    );
  }

  if (!categories.ok) {
    console.error(
      '[Product by ID Page] > Failed to get the list of categories >',
      categories.error
    );
  }

  if (!attributes.ok) {
    console.error(
      '[Product by ID Page] > Failed to get the list of attributes >',
      attributes.error
    );
  }

  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <ProductViewPage
            productId={params.productId}
            brands={brands.ok ? brands.data : undefined}
            categories={categories.ok ? categories.data : undefined}
            attributes={attributes.ok ? attributes.data : undefined}
          />
        </Suspense>
      </div>
    </PageContainer>
  );
}
