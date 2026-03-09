import PageContainer from '@/components/layout/page-container';
import { buttonVariants } from '@/components/ui/button';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import ClientListingPage from '@/features/clients/components/client-listing';
import { searchParamsCache } from '@/lib/searchparams';
import { cn } from '@/lib/utils';
import { IconPlus } from '@tabler/icons-react';
import Link from 'next/link';
import { SearchParams } from 'nuqs/server';
import { Suspense } from 'react';

export const metadata = {
  title: 'Dashboard: Fahrgäste'
};

type pageProps = {
  searchParams: Promise<SearchParams>;
};

export default async function Page(props: pageProps) {
  const searchParams = await props.searchParams;
  searchParamsCache.parse(searchParams);

  return (
    <PageContainer
      scrollable={false}
      pageTitle='Fahrgäste'
      pageDescription='Fahrgäste effizient verwalten.'
      pageHeaderAction={
        <Link
          href='/dashboard/clients/new'
          className={cn(buttonVariants(), 'text-xs md:text-sm')}
        >
          <IconPlus className='mr-2 h-4 w-4' /> Neu hinzufügen
        </Link>
      }
    >
      <Suspense
        fallback={
          <DataTableSkeleton columnCount={9} rowCount={8} filterCount={0} />
        }
      >
        <ClientListingPage searchParams={props.searchParams} />
      </Suspense>
    </PageContainer>
  );
}
