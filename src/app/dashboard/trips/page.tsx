import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import TripsListingPage from '@/features/trips/components/trips-listing';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { CreateTripDialogButton } from '@/features/trips/components/create-trip-dialog-button';
import { BulkUploadDialog } from '@/features/trips/components/bulk-upload-dialog';

export const metadata = {
  title: 'Dashboard: Fahrten'
};

export const dynamic = 'force-dynamic';

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Fahrten'
      pageDescription='Alle Fahrten auf einen Blick verwalten.'
      pageHeaderAction={
        <div className='flex items-center gap-2'>
          <BulkUploadDialog />
          <CreateTripDialogButton />
        </div>
      }
    >
      <Suspense
        fallback={
          <DataTableSkeleton columnCount={8} rowCount={10} filterCount={3} />
        }
      >
        <TripsListingPage searchParams={props.searchParams} />
      </Suspense>
    </PageContainer>
  );
}
