import PageContainer from '@/components/layout/page-container';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import TripsListingPage from '@/features/trips/components/trips-listing';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';
import { BulkUploadDialog } from '@/features/trips/components/bulk-upload-dialog';
import { PrintTripsButton } from '@/features/trips/components/print-trips-button';
import { TripsRealtimeSync } from '@/features/trips/components/trips-realtime-sync';

export const metadata = {
  title: 'Dashboard: Fahrten'
};

export const dynamic = 'force-dynamic';

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  /** Ensure nuqs cache is tied to this navigation (Promise must be parsed here for RSC). */
  await searchParamsCache.parse(props.searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Fahrten'
      pageDescription='Alle Fahrten auf einen Blick verwalten.'
      pageHeaderAction={
        <div className='flex shrink-0 flex-nowrap items-center justify-end gap-2'>
          <PrintTripsButton />
          <BulkUploadDialog />
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
      <TripsRealtimeSync />
    </PageContainer>
  );
}
