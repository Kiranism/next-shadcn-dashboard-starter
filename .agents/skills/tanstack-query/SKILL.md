---
name: tanstack-query
description: TanStack Query v5 data fetching patterns including useSuspenseQuery, useQuery, mutations, cache management, and API service integration. Use when fetching data, managing server state, or working with TanStack Query hooks.
---

# TanStack Query Patterns

## Purpose

Modern data fetching with TanStack Query v5 (latest: 5.90.5, November 2025), emphasizing Suspense-based queries, cache-first strategies, and centralized API services.

**Note**: v5 (released October 2023) has breaking changes from v4:

- `isLoading` → `isPending` for status
- `cacheTime` → `gcTime` (garbage collection time)
- React 18.0+ required
- Callbacks removed from useQuery (onError, onSuccess, onSettled)
- `keepPreviousData` replaced with `placeholderData` function

## When to Use This Skill

- Fetching data with TanStack Query
- Using useSuspenseQuery or useQuery
- Managing mutations
- Cache invalidation and updates
- API service patterns

---

## Quick Start

### Primary Pattern: useSuspenseQuery

For **all new components**, use `useSuspenseQuery`:

```typescript
import { useSuspenseQuery } from '@tanstack/react-query';
import { postsApi } from '~/features/posts/api/postsApi';

function PostList() {
  const { data: posts } = useSuspenseQuery({
    queryKey: ['posts'],
    queryFn: postsApi.getAll,
  });

  return (
    <div>
      {posts.map(post => (
        <PostCard key={post.id} post={post} />
      ))}
    </div>
  );
}

// Wrap with Suspense
<Suspense fallback={<PostsSkeleton />}>
  <PostList />
</Suspense>
```

**Benefits:**

- No `isLoading` checks needed
- Integrates with Suspense boundaries
- Cleaner component code
- Consistent loading UX

---

## useSuspenseQuery Patterns

### Basic Usage

```typescript
const { data } = useSuspenseQuery({
  queryKey: ['user', userId],
  queryFn: () => userApi.get(userId),
});

// data is never undefined - guaranteed by Suspense
return <div>{data.name}</div>;
```

### With Parameters

```typescript
function UserPosts({ userId }: { userId: string }) {
  const { data: posts } = useSuspenseQuery({
    queryKey: ['users', userId, 'posts'],
    queryFn: () => postsApi.getByUser(userId),
  });

  return <div>{posts.length} posts</div>;
}
```

### Dependent Queries

```typescript
function PostDetails({ postId }: { postId: string }) {
  // First query
  const { data: post } = useSuspenseQuery({
    queryKey: ['posts', postId],
    queryFn: () => postsApi.get(postId),
  });

  // Second query depends on first
  const { data: author } = useSuspenseQuery({
    queryKey: ['users', post.authorId],
    queryFn: () => userApi.get(post.authorId),
  });

  return <div>{author.name} wrote {post.title}</div>;
}
```

---

## useQuery (Legacy Pattern)

Use `useQuery` only when you need loading/error states in the component:

```typescript
import { useQuery } from '@tanstack/react-query';

function Component() {
  const { data, isPending, error } = useQuery({
    queryKey: ['posts'],
    queryFn: postsApi.getAll,
  });

  if (isPending) return <Spinner />;
  if (error) return <Error error={error} />;

  return <div>{data.map(...)}</div>;
}
```

**When to use `useQuery` vs `useSuspenseQuery`:**

- Use `useSuspenseQuery` by default (preferred)
- Use `useQuery` only when you need component-level loading states
- Most cases should use `useSuspenseQuery` + Suspense boundaries

---

## Mutations

### Basic Mutation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function CreatePostButton() {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: postsApi.create,
    onSuccess: () => {
      // Invalidate and refetch
      queryClient.invalidateQueries({ queryKey: ['posts'] });
    },
  });

  const handleCreate = () => {
    mutation.mutate({
      title: 'New Post',
      content: 'Content here',
    });
  };

  return (
    <button onClick={handleCreate} disabled={mutation.isPending}>
      {mutation.isPending ? 'Creating...' : 'Create Post'}
    </button>
  );
}
```

### Optimistic Updates

```typescript
const mutation = useMutation({
  mutationFn: postsApi.update,
  onMutate: async (updatedPost) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['posts', updatedPost.id] });

    // Snapshot previous value
    const previousPost = queryClient.getQueryData(['posts', updatedPost.id]);

    // Optimistically update
    queryClient.setQueryData(['posts', updatedPost.id], updatedPost);

    // Return context with snapshot
    return { previousPost };
  },
  onError: (err, updatedPost, context) => {
    // Rollback on error
    queryClient.setQueryData(['posts', updatedPost.id], context.previousPost);
  },
  onSettled: (data, error, variables) => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: ['posts', variables.id] });
  }
});
```

---

## Cache Management

### Invalidation

```typescript
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();

// Invalidate all posts queries
queryClient.invalidateQueries({ queryKey: ['posts'] });

// Invalidate specific post
queryClient.invalidateQueries({ queryKey: ['posts', postId] });

// Invalidate all queries
queryClient.invalidateQueries();
```

### Manual Updates

```typescript
// Update cache directly
queryClient.setQueryData(['posts', postId], newPost);

// Update with function
queryClient.setQueryData(['posts'], (oldPosts) => [...oldPosts, newPost]);
```

### Prefetching

```typescript
// Prefetch data
await queryClient.prefetchQuery({
  queryKey: ['posts', postId],
  queryFn: () => postsApi.get(postId),
});

// In a component
const prefetchPost = (postId: string) => {
  queryClient.prefetchQuery({
    queryKey: ['posts', postId],
    queryFn: () => postsApi.get(postId),
  });
};

<Link
  to={`/posts/${post.id}`}
  onMouseEnter={() => prefetchPost(post.id)}
>
  {post.title}
</Link>
```

---

## API Service Pattern

### Centralized API Service

```typescript
// features/posts/api/postsApi.ts
import { apiClient } from '@/lib/apiClient';
import type { Post, CreatePostDto, UpdatePostDto } from '~/types/post';

export const postsApi = {
  getAll: async (): Promise<Post[]> => {
    const response = await apiClient.get('/posts');
    return response.data;
  },

  get: async (id: string): Promise<Post> => {
    const response = await apiClient.get(`/posts/${id}`);
    return response.data;
  },

  create: async (data: CreatePostDto): Promise<Post> => {
    const response = await apiClient.post('/posts', data);
    return response.data;
  },

  update: async (id: string, data: UpdatePostDto): Promise<Post> => {
    const response = await apiClient.put(`/posts/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await apiClient.delete(`/posts/${id}`);
  },

  getByUser: async (userId: string): Promise<Post[]> => {
    const response = await apiClient.get(`/users/${userId}/posts`);
    return response.data;
  }
};
```

### Usage in Components

```typescript
import { postsApi } from '~/features/posts/api/postsApi';

// In query
const { data } = useSuspenseQuery({
  queryKey: ['posts'],
  queryFn: postsApi.getAll
});

// In mutation
const mutation = useMutation({
  mutationFn: postsApi.create
});
```

---

## Query Keys

### Key Structure

```typescript
// List queries
['posts'][('posts', { status: 'published' })][ // All posts // Filtered posts
  // Detail queries
  ('posts', postId)
][('posts', postId, 'comments')][ // Single post // Post comments
  // Nested resources
  ('users', userId, 'posts')
][('users', userId, 'posts', postId)]; // User's posts // Specific user post
```

### Key Factories

```typescript
// features/posts/api/postKeys.ts
export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: string) => [...postKeys.lists(), { filters }] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: string) => [...postKeys.details(), id] as const,
  comments: (id: string) => [...postKeys.detail(id), 'comments'] as const
};

// Usage
const { data } = useSuspenseQuery({
  queryKey: postKeys.detail(postId),
  queryFn: () => postsApi.get(postId)
});

// Invalidate all post lists
queryClient.invalidateQueries({ queryKey: postKeys.lists() });
```

---

## Error Handling

### With Error Boundaries

```typescript
import { ErrorBoundary } from 'react-error-boundary';

<ErrorBoundary fallback={<ErrorFallback />}>
  <Suspense fallback={<Loading />}>
    <DataComponent />
  </Suspense>
</ErrorBoundary>

// In component
function DataComponent() {
  const { data } = useSuspenseQuery({
    queryKey: ['data'],
    queryFn: fetchData,
    // Errors automatically caught by ErrorBoundary
  });

  return <div>{data}</div>;
}
```

### Retry and Cache Configuration

```typescript
const { data } = useQuery({
  queryKey: ['posts'],
  queryFn: postsApi.getAll,
  retry: 3, // Retry 3 times
  retryDelay: 1000, // Wait 1s between retries
  gcTime: 5 * 60 * 1000 // Garbage collection time: 5 minutes (v5: was 'cacheTime')
});
```

---

## Best Practices

### 1. Use Suspense by Default

```typescript
// ✅ Good: useSuspenseQuery + Suspense
<Suspense fallback={<Skeleton />}>
  <DataComponent />
</Suspense>

function DataComponent() {
  const { data } = useSuspenseQuery({...});
  return <div>{data}</div>;
}

// ❌ Avoid: useQuery with manual loading
function DataComponent() {
  const { data, isPending } = useQuery({...});
  if (isPending) return <Spinner />;
  return <div>{data}</div>;
}
```

### 2. Consistent Query Keys

```typescript
// ✅ Good: Use key factories
const { data } = useSuspenseQuery({
  queryKey: postKeys.detail(id),
  queryFn: () => postsApi.get(id)
});

// ❌ Avoid: Inconsistent keys
const { data } = useSuspenseQuery({
  queryKey: ['post', id], // Different format
  queryFn: () => postsApi.get(id)
});
```

### 3. Centralized API Services

```typescript
// ✅ Good: API service
const { data } = useSuspenseQuery({
  queryKey: ['posts'],
  queryFn: postsApi.getAll
});

// ❌ Avoid: Inline fetching
const { data } = useSuspenseQuery({
  queryKey: ['posts'],
  queryFn: async () => {
    const res = await fetch('/api/posts');
    return res.json();
  }
});
```

---

## Additional Resources

For more patterns, see:

- [data-fetching.md](resources/data-fetching.md) - Advanced patterns
- [cache-strategies.md](resources/cache-strategies.md) - Cache management
- [mutation-patterns.md](resources/mutation-patterns.md) - Complex mutations
