import { HydrationBoundary, dehydrate } from '@tanstack/react-query';
import { getQueryClient } from '@/lib/query-client';
import { pokemonOptions } from '@/features/react-query-demo/api/queries';
import { PokemonInfo } from '@/features/react-query-demo/components/pokemon-info';
import PageContainer from '@/components/layout/page-container';
import { Suspense } from 'react';
import { PokemonSkeleton } from '@/features/react-query-demo/components/pokemon-skeleton';
import { reactQueryInfoContent } from '@/features/react-query-demo/info-content';

export const metadata = {
  title: 'Dashboard: React Query'
};

export default function ReactQueryPage() {
  const queryClient = getQueryClient();

  // Prefetch on the server — data is ready before client JS loads
  void queryClient.prefetchQuery(pokemonOptions(25));

  return (
    <PageContainer
      scrollable
      pageTitle='React Query'
      pageDescription='Server prefetch + client hydration + suspense query pattern.'
      infoContent={reactQueryInfoContent}
    >
      <HydrationBoundary state={dehydrate(queryClient)}>
        <Suspense fallback={<PokemonSkeleton />}>
          <PokemonInfo />
        </Suspense>
      </HydrationBoundary>
    </PageContainer>
  );
}
