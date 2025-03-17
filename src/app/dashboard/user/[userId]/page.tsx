import FormCardSkeleton from '@/components/form-card-skeleton';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import { SiteConfig } from '@/constants/site-config';
import UserViewPage from '@/features/user/components/user-view-page';

type PageProps = {
  params: Promise<{ userId: string }>;
  searchParams: Promise<{ preview: string }>;
};

// export async function generateMetadata(props: PageProps): Promise<Metadata> {
//   const params = await props.params
//   const user = await getUser(params.userId)
//   return {
//     title: SiteConfig.siteTitle.user.getUserViewTitle()
//   }
// }

export const metadata = {
  title: SiteConfig.siteTitle.user.view
};

export default async function Page(props: PageProps) {
  const params = await props.params;
  const sParams = await props.searchParams;

  return (
    <PageContainer scrollable>
      <div className='flex-1 space-y-4'>
        <Suspense fallback={<FormCardSkeleton />}>
          <UserViewPage userId={params.userId} />
        </Suspense>
      </div>
    </PageContainer>
  );
}
