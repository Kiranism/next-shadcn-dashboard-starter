import { useQuery } from '@tanstack/react-query';
import { usersApi } from '../api/jsonPlaceholder';

// Query keys
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: string) => [...userKeys.lists(), { filters }] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
  posts: (id: number) => [...userKeys.detail(id), 'posts'] as const,
  todos: (id: number) => [...userKeys.detail(id), 'todos'] as const
};

// Hooks
export const useUsers = () => {
  return useQuery({
    queryKey: userKeys.lists(),
    queryFn: () => usersApi.getUsers()
  });
};

export const useUser = (id: number) => {
  return useQuery({
    queryKey: userKeys.detail(id),
    queryFn: () => usersApi.getUser(id),
    enabled: !!id
  });
};

export const useUserPosts = (userId: number) => {
  return useQuery({
    queryKey: userKeys.posts(userId),
    queryFn: () => usersApi.getUserPosts(userId),
    enabled: !!userId
  });
};

export const useUserTodos = (userId: number) => {
  return useQuery({
    queryKey: userKeys.todos(userId),
    queryFn: () => usersApi.getUserTodos(userId),
    enabled: !!userId
  });
};
