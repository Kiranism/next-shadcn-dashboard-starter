# Cache Management Strategies

## Cache Time Configuration

```typescript
const { data } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  staleTime: 5 * 60 * 1000, // Consider fresh for 5 minutes
  gcTime: 10 * 60 * 1000 // Keep in cache for 10 minutes (formerly cacheTime)
});
```

## Cache Invalidation

### Invalidate Specific Queries

```typescript
const queryClient = useQueryClient();

// Invalidate all post queries
queryClient.invalidateQueries({ queryKey: ['posts'] });

// Invalidate specific post
queryClient.invalidateQueries({ queryKey: ['post', postId] });

// Invalidate with exact match
queryClient.invalidateQueries({
  queryKey: ['posts'],
  exact: true // Only ['posts'], not ['posts', 'list']
});
```

### Invalidate on Mutation

```typescript
const { mutate } = useMutation({
  mutationFn: createPost,
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  }
});
```

## Manual Cache Updates

### Set Query Data

```typescript
// Update cache directly
queryClient.setQueryData(['post', postId], (oldData) => ({
  ...oldData,
  title: 'New Title'
}));

// Set new data
queryClient.setQueryData(['post', postId], newPost);
```

### Get Query Data

```typescript
// Read from cache
const cachedPost = queryClient.getQueryData(['post', postId]);

// Use in initialData
const { data } = useQuery({
  queryKey: ['post', postId],
  queryFn: () => fetchPost(postId),
  initialData: () => queryClient.getQueryData(['posts'])?.find((p) => p.id === postId)
});
```

## Refetch Strategies

### Refetch on Window Focus

```typescript
const { data } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  refetchOnWindowFocus: true // Refetch when tab regains focus
});
```

### Refetch on Reconnect

```typescript
const { data } = useQuery({
  queryKey: ['posts'],
  queryFn: fetchPosts,
  refetchOnReconnect: true // Refetch when internet reconnects
});
```

### Refetch Intervals

```typescript
const { data } = useQuery({
  queryKey: ['live-data'],
  queryFn: fetchLiveData,
  refetchInterval: 5000, // Refetch every 5 seconds
  refetchIntervalInBackground: false // Pause when tab not active
});
```

## Cache Persistence

### Persist to localStorage

```typescript
import { QueryClient } from '@tanstack/react-query';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import { createSyncStoragePersister } from '@tanstack/query-sync-storage-persister';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: 1000 * 60 * 60 * 24  // 24 hours
    }
  }
});

const persister = createSyncStoragePersister({
  storage: window.localStorage
});

<PersistQueryClientProvider
  client={queryClient}
  persister={persister}
>
  <App />
</PersistQueryClientProvider>
```

## Cache Deduplication

### Automatic Request Deduplication

```typescript
// Both components will share the same request
function Component1() {
  const { data } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts
  });
}

function Component2() {
  const { data } = useQuery({
    queryKey: ['posts'], // Same key = same request
    queryFn: fetchPosts
  });
}
```

## Cache Preloading

### Prefetch Queries

```typescript
const queryClient = useQueryClient();

// Prefetch before navigation
const handleMouseEnter = () => {
  queryClient.prefetchQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId)
  });
};

// Prefetch in loader
router.beforeEach(async (to, from, next) => {
  await queryClient.prefetchQuery({
    queryKey: ['user', to.params.userId],
    queryFn: () => fetchUser(to.params.userId)
  });
  next();
});
```

### Ensure Query Data

```typescript
// Fetch if not in cache, otherwise use cached
await queryClient.ensureQueryData({
  queryKey: ['post', postId],
  queryFn: () => fetchPost(postId)
});
```

## Selective Cache Updates

### Update Nested Data

```typescript
queryClient.setQueryData(['posts'], (oldPosts) => {
  return oldPosts.map((post) => (post.id === updatedPost.id ? updatedPost : post));
});
```

### Add to List Cache

```typescript
// After creating a post
queryClient.setQueryData(['posts'], (oldPosts = []) => {
  return [newPost, ...oldPosts];
});
```

### Remove from List Cache

```typescript
// After deleting a post
queryClient.setQueryData(['posts'], (oldPosts) => {
  return oldPosts.filter((post) => post.id !== deletedPostId);
});
```

## Cache Debugging

### React Query Devtools

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <App />
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

### Query Cache Events

```typescript
const queryCache = queryClient.getQueryCache();

queryCache.subscribe((event) => {
  console.log('Query cache event:', event.type, event.query.queryKey);
});
```

## Best Practices

1. **Set Appropriate staleTime** - Balance freshness vs performance
2. **Use Invalidation Over Refetch** - Let queries refetch when needed
3. **Prefetch Predictably** - Preload data on hover/intent
4. **Update Cache on Mutations** - Keep UI in sync
5. **Use Devtools** - Debug cache issues visually
6. **Persist Important Data** - Save to localStorage for offline support
7. **Deduplicate Requests** - Rely on automatic deduplication
