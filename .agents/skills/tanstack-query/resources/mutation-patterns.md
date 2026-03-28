# Complex Mutation Patterns

## Basic Mutations

```typescript
const { mutate, isPending, isError, error } = useMutation({
  mutationFn: (newPost: CreatePostDto) => createPost(newPost),
  onSuccess: (data) => {
    console.log('Post created:', data);
  },
  onError: (error) => {
    console.error('Failed to create post:', error);
  }
});

// Trigger mutation
mutate({ title: 'New Post', content: '...' });
```

## Optimistic Updates

Update UI immediately, rollback on error:

```typescript
const { mutate } = useMutation({
  mutationFn: updatePost,
  onMutate: async (newPost) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries({ queryKey: ['posts'] });

    // Snapshot previous value
    const previousPosts = queryClient.getQueryData(['posts']);

    // Optimistically update to the new value
    queryClient.setQueryData(['posts'], (old) =>
      old.map((post) => (post.id === newPost.id ? newPost : post))
    );

    // Return context with snapshot
    return { previousPosts };
  },
  onError: (err, newPost, context) => {
    // Rollback to previous value
    queryClient.setQueryData(['posts'], context.previousPosts);
  },
  onSettled: () => {
    // Always refetch after error or success
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  }
});
```

## Sequential Mutations

Run mutations in sequence:

```typescript
const createAndPublish = async (postData) => {
  // Create post
  const post = await createPostMutation.mutateAsync(postData);

  // Publish post
  const published = await publishPostMutation.mutateAsync(post.id);

  return published;
};
```

## Parallel Mutations

Run multiple mutations simultaneously:

```typescript
const { mutate } = useMutation({
  mutationFn: async (updates) => {
    const results = await Promise.all([
      updateProfile(updates.profile),
      updateSettings(updates.settings),
      updatePreferences(updates.preferences)
    ]);
    return results;
  }
});
```

## Mutation with Invalidation

```typescript
const { mutate } = useMutation({
  mutationFn: createPost,
  onSuccess: () => {
    // Invalidate and refetch
    queryClient.invalidateQueries({ queryKey: ['posts'] });

    // Or update cache directly
    queryClient.setQueryData(['posts'], (old) => [newPost, ...old]);
  }
});
```

## Mutation with Multiple Cache Updates

```typescript
const { mutate } = useMutation({
  mutationFn: deletePost,
  onSuccess: (_, deletedPostId) => {
    // Update posts list
    queryClient.setQueryData(['posts'], (old) => old.filter((post) => post.id !== deletedPostId));

    // Update post count
    queryClient.setQueryData(['postsCount'], (old) => old - 1);

    // Invalidate related queries
    queryClient.invalidateQueries({ queryKey: ['user', 'stats'] });
  }
});
```

## Error Handling

```typescript
const { mutate, isError, error, reset } = useMutation({
  mutationFn: createPost,
  onError: (error) => {
    if (error.code === 'VALIDATION_ERROR') {
      setFormErrors(error.fields);
    } else if (error.code === 'NETWORK_ERROR') {
      showRetryDialog();
    } else {
      showGenericError();
    }
  }
});

// Clear error state
reset();
```

## Retry Failed Mutations

```typescript
const { mutate } = useMutation({
  mutationFn: createPost,
  retry: 3, // Retry 3 times on failure
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000) // Exponential backoff
});
```

## Mutation with Loading State

```typescript
function CreatePostForm() {
  const { mutate, isPending } = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      navigate('/posts');
    }
  });

  const handleSubmit = (data) => {
    mutate(data);
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* form fields */}
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
    </form>
  );
}
```

## Mutation with Variables

```typescript
const { mutate, variables } = useMutation({
  mutationFn: updatePost
});

// Access last mutation variables
console.log('Last updated post:', variables);
```

## Mutation Callbacks

```typescript
const { mutate } = useMutation({
  mutationFn: createPost,
  onMutate: (variables) => {
    console.log('Starting mutation with:', variables);
  },
  onSuccess: (data, variables, context) => {
    console.log('Success!', data);
  },
  onError: (error, variables, context) => {
    console.error('Error!', error);
  },
  onSettled: (data, error, variables, context) => {
    console.log('Mutation finished (success or error)');
  }
});
```

## Mutation with Form Integration

```typescript
import { useForm } from 'react-hook-form';

function CreatePostForm() {
  const { register, handleSubmit, reset } = useForm();

  const { mutate, isPending, isError, error } = useMutation({
    mutationFn: createPost,
    onSuccess: () => {
      reset();  // Clear form
      toast.success('Post created!');
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const onSubmit = (data) => {
    mutate(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register('title')} />
      <textarea {...register('content')} />
      <button type="submit" disabled={isPending}>
        Submit
      </button>
      {isError && <ErrorMessage error={error} />}
    </form>
  );
}
```

## Mutation State Reset

```typescript
const { mutate, data, error, reset } = useMutation({
  mutationFn: createPost
});

// Clear mutation state
const handleReset = () => {
  reset(); // Clears data, error, status, etc.
};
```

## Global Mutation Configuration

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      retry: 3,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      onError: (error) => {
        // Global error handler
        console.error('Mutation error:', error);
      }
    }
  }
});
```

## Mutation Lifecycle

```
┌─────────────┐
│ idle        │
└──────┬──────┘
       │ mutate()
       ▼
┌─────────────┐
│ pending     │ ─── onMutate()
└──────┬──────┘
       │
       ├─ success ──► onSuccess() ──┐
       │                            │
       └─ error ────► onError() ────┤
                                    │
                                    ▼
                              onSettled()
```

## Best Practices

1. **Use Optimistic Updates** - Better UX for fast operations
2. **Always Handle Errors** - Show clear error messages
3. **Invalidate Related Queries** - Keep cache in sync
4. **Use onSettled** - For cleanup that runs regardless of success/error
5. **Reset on Unmount** - Clear mutation state when component unmounts
6. **Retry Network Errors** - Configure retry for transient failures
7. **Show Loading States** - Disable buttons during mutation
8. **Rollback on Error** - Revert optimistic updates if mutation fails

## Common Patterns

### Create with Redirect

```typescript
const { mutate } = useMutation({
  mutationFn: createPost,
  onSuccess: (newPost) => {
    navigate(`/posts/${newPost.id}`);
  }
});
```

### Update with Toast

```typescript
const { mutate } = useMutation({
  mutationFn: updatePost,
  onSuccess: () => {
    toast.success('Post updated!');
  },
  onError: () => {
    toast.error('Failed to update post');
  }
});
```

### Delete with Confirmation

```typescript
const { mutate } = useMutation({
  mutationFn: deletePost,
  onMutate: async () => {
    const confirmed = await confirm('Are you sure?');
    if (!confirmed) throw new Error('Cancelled');
  },
  onSuccess: () => {
    toast.success('Post deleted');
    navigate('/posts');
  }
});
```
