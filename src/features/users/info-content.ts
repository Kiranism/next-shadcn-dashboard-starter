import type { InfobarContent } from '@/components/ui/infobar';

export const usersInfoContent: InfobarContent = {
  title: 'Users — React Query + nuqs Pattern',
  sections: [
    {
      title: 'Overview',
      description:
        'This page demonstrates client-side data fetching with React Query combined with nuqs URL search params — as an alternative to the Products page which uses server-side RSC fetching. Both patterns use the same DataTable, useDataTable hook, and nuqs URL state.',
      links: [
        {
          title: 'TanStack Query SSR Docs',
          url: 'https://tanstack.com/query/latest/docs/framework/react/guides/advanced-ssr'
        }
      ]
    },
    {
      title: 'Server Prefetch + Client Hydration',
      description:
        'The server component reads search params via searchParamsCache, builds filters, and calls queryClient.prefetchQuery(). The dehydrated state is passed to HydrationBoundary so the client starts with cached data. The client component reads the same search params via useQueryState and calls useSuspenseQuery with matching filters.',
      links: []
    },
    {
      title: 'URL State with nuqs',
      description:
        'Pagination, search, and role filters are synced to the URL via nuqs. The useDataTable hook manages the TanStack Table state and debounces filter changes before updating the URL. When the URL changes, React Query automatically refetches because the query key includes the filters.',
      links: [
        {
          title: 'nuqs Documentation',
          url: 'https://nuqs.47ng.com'
        }
      ]
    },
    {
      title: 'Products vs Users Pattern',
      description:
        'Products: searchParams → RSC fetch → pass data as props to client table. Users: searchParams → server prefetch → HydrationBoundary → client useSuspenseQuery. The Users pattern enables background refetching, cache sharing across components, and optimistic mutations.',
      links: []
    }
  ]
};
