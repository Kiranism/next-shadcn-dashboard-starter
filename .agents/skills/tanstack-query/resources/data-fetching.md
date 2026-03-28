# Advanced Data Fetching Patterns with TanStack Query

## Dependent Queries

Queries that depend on data from other queries:

```typescript
// First query - Get user ID
const { data: user } = useQuery({
  queryKey: ['user'],
  queryFn: fetchCurrentUser
});

// Second query - Depends on user ID
const { data: posts } = useQuery({
  queryKey: ['posts', user?.id],
  queryFn: () => fetchUserPosts(user!.id),
  enabled: !!user // Only run when user is available
});
```

## Parallel Queries

Fetch multiple independent queries simultaneously:

```typescript
function Dashboard() {
  const queries = useQueries({
    queries: [
      { queryKey: ['stats'], queryFn: fetchStats },
      { queryKey: ['recentPosts'], queryFn: fetchRecentPosts },
      { queryKey: ['notifications'], queryFn: fetchNotifications }
    ]
  });

  const [statsQuery, postsQuery, notificationsQuery] = queries;

  if (queries.some(q => q.isLoading)) return <Loading />;

  return <Dashboard
    stats={statsQuery.data}
    posts={postsQuery.data}
    notifications={notificationsQuery.data}
  />;
}
```

## Infinite Queries

For pagination and infinite scroll:

```typescript
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage
} = useInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam = 1 }) => fetchPosts(pageParam),
  getNextPageParam: (lastPage, pages) => lastPage.nextCursor,
  initialPageParam: 1
});

// Flatten pages
const allPosts = data?.pages.flatMap(page => page.posts) ?? [];

return (
  <div>
    {allPosts.map(post => <PostCard key={post.id} post={post} />)}
    {hasNextPage && (
      <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage}>
        {isFetchingNextPage ? 'Loading...' : 'Load More'}
      </button>
    )}
  </div>
);
```

## Prefetching

Preload data before it's needed:

```typescript
import { useQueryClient } from '@tanstack/react-query';

function PostLink({ postId }: { postId: string }) {
  const queryClient = useQueryClient();

  const handleMouseEnter = () => {
    queryClient.prefetchQuery({
      queryKey: ['post', postId],
      queryFn: () => fetchPost(postId)
    });
  };

  return (
    <Link to={`/posts/${postId}`} onMouseEnter={handleMouseEnter}>
      View Post
    </Link>
  );
}
```

## Suspense Mode

Use with React Suspense:

```typescript
import { useSuspenseQuery } from '@tanstack/react-query';

function PostDetails({ postId }: { postId: string }) {
  // Throws promise on loading, error on error
  const { data: post } = useSuspenseQuery({
    queryKey: ['post', postId],
    queryFn: () => fetchPost(postId)
  });

  return <div>{post.title}</div>;
}

// Wrap with Suspense
<Suspense fallback={<Loading />}>
  <PostDetails postId="123" />
</Suspense>
```

## Query Cancellation

Cancel queries when component unmounts:

```typescript
const { data, isLoading } = useQuery({
  queryKey: ['search', searchTerm],
  queryFn: async ({ signal }) => {
    const response = await fetch(`/api/search?q=${searchTerm}`, { signal });
    return response.json();
  }
});
```

## Initial Data

Provide initial data to avoid loading state:

```typescript
const { data } = useQuery({
  queryKey: ['post', postId],
  queryFn: () => fetchPost(postId),
  initialData: () => {
    // Get from cache or other source
    return queryClient.getQueryData(['posts'])?.find((post) => post.id === postId);
  }
});
```

## Placeholder Data

Show placeholder while loading:

```typescript
const { data, isPlaceholderData } = useQuery({
  queryKey: ['posts', page],
  queryFn: () => fetchPosts(page),
  placeholderData: (previousData) => previousData  // Keep previous page while loading
});

// Or provide static placeholder
placeholderData: { posts: [], total: 0 }
```

## Optimistic Updates with Queries

Update UI immediately, rollback on error:

```typescript
const queryClient = useQueryClient();

const { mutate } = useMutation({
  mutationFn: updatePost,
  onMutate: async (newPost) => {
    // Cancel outgoing queries
    await queryClient.cancelQueries({ queryKey: ['post', newPost.id] });

    // Snapshot current value
    const previousPost = queryClient.getQueryData(['post', newPost.id]);

    // Optimistically update
    queryClient.setQueryData(['post', newPost.id], newPost);

    return { previousPost };
  },
  onError: (err, newPost, context) => {
    // Rollback on error
    queryClient.setQueryData(['post', newPost.id], context?.previousPost);
  },
  onSettled: (newPost) => {
    // Refetch after success or error
    queryClient.invalidateQueries({ queryKey: ['post', newPost.id] });
  }
});
```

## Query Retries

Configure retry behavior:

```typescript
const { data } = useQuery({
  queryKey: ['post', postId],
  queryFn: () => fetchPost(postId),
  retry: 3, // Retry 3 times
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential backoff
});
```

## Error Handling

Handle query errors:

```typescript
const { data, error, isError } = useQuery({
  queryKey: ['post', postId],
  queryFn: () => fetchPost(postId),
  throwOnError: false  // Don't throw, just set error
});

if (isError) {
  return <ErrorMessage error={error} />;
}
```

## Best Practices

1. **Use Suspense** - Better loading UX with React Suspense
2. **Prefetch on Intent** - Preload data on hover/focus
3. **Enable Queries Conditionally** - Use `enabled` option
4. **Cancel on Unmount** - Use abort signals
5. **Handle Errors Gracefully** - Show error states
6. **Optimize with Placeholders** - Show previous data while loading
