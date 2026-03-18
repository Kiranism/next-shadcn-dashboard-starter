import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import ClientListingPage from '@/features/clients/components/client-listing';
import { ClientsViewToggle } from '@/features/clients/components/clients-view-toggle';
import { ClientsColumnView } from '@/features/clients/components/clients-column-view';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Fahrgäste'
};

type PageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: PageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  // Read the view param server-side to conditionally render the correct view.
  // 'table' is the default — existing behaviour is unchanged when no param present.
  const view = (searchParams.view as string) ?? 'columns';
  const isColumnView = view === 'columns';

  return (
    <PageContainer
      // Column view manages its own scroll per-panel; table view has its own scroll.
      // Both need scrollable=false so PageContainer doesn't add a competing ScrollArea.
      scrollable={false}
      pageTitle='Fahrgäste'
      pageDescription='Fahrgäste effizient verwalten.'
      pageHeaderAction={
        <div className='flex items-center gap-2'>
          {/* "Neu hinzufügen" only shown in table view — the column view has an
              inline "+ Neuer Fahrgast" button at the bottom of the list panel. */}
          {!isColumnView && (
            <Link
              href='/dashboard/clients/new'
              className={cn(buttonVariants(), 'text-xs md:text-sm')}
            >
              <IconPlus className='mr-2 h-4 w-4' /> Neu hinzufügen
            </Link>
          )}
          {/* ClientsViewToggle is a client component — safe to pass as ReactNode */}
          <ClientsViewToggle />
        </div>
      }
    >
      {isColumnView ? (
        // Column view: full-height three-panel layout, all client-side
        <ClientsColumnView />
      ) : (
        // Table view: unchanged from before
        <Suspense
          fallback={
            <DataTableSkeleton columnCount={9} rowCount={8} filterCount={0} />
          }
        >
          <ClientListingPage searchParams={props.searchParams} />
        </Suspense>
      )}
    </PageContainer>
  );
}
