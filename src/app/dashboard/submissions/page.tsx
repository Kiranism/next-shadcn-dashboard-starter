import { Suspense } from 'react';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import PageContainer from '@/components/layout/page-container';
import SubmissionListingPage from '@/features/submissions/components/submission-listing';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';

export const metadata = {
  title: 'Dashboard: Submissions Management'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function SubmissionsPage(props: pageProps) {
  const searchParams = await props.searchParams;
  // Allow nested RSCs to access the search params (in a type-safe way)
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer scrollable={false}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='Submissions Management'
            description='Review and manage user task submissions'
          />
        </div>
        <Separator />
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={8} rowCount={8} filterCount={2} />
          }
        >
          <SubmissionListingPage />
        </Suspense>
      </div>
    </PageContainer>
  );
}
