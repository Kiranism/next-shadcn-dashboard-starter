import type { InfobarContent } from '@/components/ui/infobar';

export const reactQueryInfoContent: InfobarContent = {
  title: 'React Query Pattern',
  sections: [
    {
      title: 'Server Prefetch',
      description:
        'Data is prefetched on the server using getQueryClient().prefetchQuery(). The dehydrated state is passed to HydrationBoundary so the client starts with cached data — no loading spinners on first load.',
      links: [
        {
          title: 'TanStack Query SSR Docs',
          url: 'https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr'
        }
      ]
    },
    {
      title: 'Query Options',
      description:
        'Query keys and fetch functions are defined in a shared queryOptions() object. This is reused across server prefetch and client hooks, keeping them in sync.',
      links: [
        {
          title: 'queryOptions API',
          url: 'https://tanstack.com/query/latest/docs/framework/react/reference/queryOptions'
        }
      ]
    },
    {
      title: 'Suspense Query',
      description:
        'The client uses useSuspenseQuery() which integrates with React Suspense. Combined with server prefetch, data is available immediately — Suspense only shows the fallback on subsequent navigations if the cache is stale.',
      links: []
    },
    {
      title: 'Optimistic Mutations',
      description:
        'Mutations use onMutate to optimistically update the cache before the request completes. On error, the previous state is rolled back. On settle, the query is invalidated to refetch fresh data.',
      links: [
        {
          title: 'Optimistic Updates Guide',
          url: 'https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates'
        }
      ]
    }
  ]
};
