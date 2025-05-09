import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { postsApi } from '../api/jsonPlaceholder';
import { Post } from '../api/types';

export const postKeys = {
  all: ['posts'] as const,
  lists: () => [...postKeys.all, 'list'] as const,
  list: (filters: string) => [...postKeys.lists(), { filters }] as const,
  details: () => [...postKeys.all, 'detail'] as const,
  detail: (id: number) => [...postKeys.details(), id] as const,
  comments: (id: number) => [...postKeys.detail(id), 'comments'] as const
};

export const usePosts = () => {
  return useQuery({
    queryKey: postKeys.lists(),
    queryFn: () => postsApi.getPosts()
  });
};

export const usePost = (id: number) => {
  return useQuery({
    queryKey: postKeys.detail(id),
    queryFn: () => postsApi.getPost(id),
    enabled: !!id
  });
};

export const usePostComments = (postId: number) => {
  return useQuery({
    queryKey: postKeys.comments(postId),
    queryFn: () => postsApi.getPostComments(postId),
    enabled: !!postId
  });
};

// Mutations
export const useCreatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newPost: Omit<Post, 'id'>) => postsApi.createPost(newPost),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    }
  });
};

export const useUpdatePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, post }: { id: number; post: Partial<Post> }) =>
      postsApi.updatePost(id, post),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: postKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    }
  });
};

export const useDeletePost = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => postsApi.deletePost(id),
    onSuccess: (_, id) => {
      queryClient.removeQueries({ queryKey: postKeys.detail(id) });
      queryClient.invalidateQueries({ queryKey: postKeys.lists() });
    }
  });
};
