import PageContainer from '@/components/layout/page-container';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import DriverTableListing from '@/features/drivers/components/driver-table-listing';
import { DriverCreateButton } from '@/features/drivers/components/driver-create-button';
import { DriversColumnView } from '@/features/drivers/components/drivers-column-view';
import { DriversViewToggle } from '@/features/drivers/components/drivers-view-toggle';
import { DriverForm } from '@/features/drivers/components/driver-form';
import { searchParamsCache } from '@/lib/searchparams';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Fahrer',
  description: 'Fahrer verwalten und neue Benutzer anlegen.'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  const view = (searchParams.view as string) ?? 'columns';
  const isColumnView = view === 'columns';

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Fahrer'
      pageDescription='Fahrer verwalten und neue Benutzer anlegen.'
      pageHeaderAction={
        <div className='flex items-center gap-2'>
          {!isColumnView && <DriverCreateButton />}
          <DriversViewToggle />
        </div>
      }
    >
      {isColumnView ? (
        <DriversColumnView />
      ) : (
        <>
          <Suspense
            fallback={
              <DataTableSkeleton columnCount={5} rowCount={8} filterCount={0} />
            }
          >
            <DriverTableListing />
          </Suspense>
          <DriverForm />
        </>
      )}
    </PageContainer>
  );
}
