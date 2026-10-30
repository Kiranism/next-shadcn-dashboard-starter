// Mirrors TanStack's official Next.js App Router example:
// https://github.com/TanStack/query/blob/main/examples/react/nextjs-app-prefetching/app/get-query-client.ts
import {
  QueryClient,
  defaultShouldDehydrateQuery,
  environmentManager
} from '@tanstack/react-query';

function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000
      },
      dehydrate: {
        // include pending queries in dehydration
        shouldDehydrateQuery: (query) =>
          defaultShouldDehydrateQuery(query) || query.state.status === 'pending',
        // Next.js redacts errors itself and needs the originals to detect dynamic pages
        shouldRedactErrors: () => false
      }
    }
  });
}

let browserQueryClient: QueryClient | undefined = undefined;

export function getQueryClient() {
  if (environmentManager.isServer()) {
    // Server: always make a new query client
    return makeQueryClient();
  } else {
    // Browser: reuse one client so React suspending during the initial render
    // doesn't throw the cache away
    if (!browserQueryClient) browserQueryClient = makeQueryClient();
    return browserQueryClient;
  }
}
