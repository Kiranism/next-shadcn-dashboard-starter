import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import { SiteConfig } from '@/constants/site-config';
import getProductAttributeValues from '@/app/(server)/actions/getProductsAttributeValues';
import getProductAttributeGroups from '@/app/(server)/actions/getProductsAttributeGroups';
import ProductAttributeViewPage from '@/features/product-attributes/components/product-attribute-view-page';

export const metadata = {
  title: SiteConfig.siteTitle.product.view
};

type PageProps = {
  params: Promise<{ attributeId: string }>;
  searchParams: Promise<{ preview: string }>;
};

export default async function Page(props: PageProps) {
  const params = await props.params;
  const sParams = await props.searchParams;

  const [values, groups] = await Promise.all([
    getProductAttributeValues({}),
    getProductAttributeGroups({})
  ]);

  if (!values.ok) {
    console.error(
      '[ProductAttributePage] Failed to get attribute values >',
      values.error
    );
  }

  if (!groups.ok) {
    console.error(
      '[ProductAttributePage] Failed to get attribute groups >',
      groups.error
    );
  }

  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <ProductAttributeViewPage
            attributeId={params.attributeId}
            values={values.ok ? values.data : undefined}
            groups={groups.ok ? groups.data : undefined}
          />
        </Suspense>
      </div>
    </PageContainer>
  );
}
