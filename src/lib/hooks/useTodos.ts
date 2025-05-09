import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { todosApi } from '../api/jsonPlaceholder';
import { Todo } from '../api/types';

// Query keys
export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filters: string) => [...todoKeys.lists(), { filters }] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: number) => [...todoKeys.details(), id] as const
};

// Hooks
export const useTodos = () => {
  return useQuery({
    queryKey: todoKeys.lists(),
    queryFn: () => todosApi.getTodos()
  });
};

export const useTodo = (id: number) => {
  return useQuery({
    queryKey: todoKeys.detail(id),
    queryFn: () => todosApi.getTodo(id),
    enabled: !!id
  });
};

// Mutations
export const useCreateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newTodo: Omit<Todo, 'id'>) => todosApi.createTodo(newTodo),
    onSuccess: () => {
      // Invalidate and refetch todos list
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    }
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, todo }: { id: number; todo: Partial<Todo> }) =>
      todosApi.updateTodo(id, todo),
    onSuccess: (data) => {
      // Update the todo in the cache
      queryClient.invalidateQueries({ queryKey: todoKeys.detail(data.id) });
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    }
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => todosApi.deleteTodo(id),
    onSuccess: (_, id) => {
      // Remove the todo from the cache
      queryClient.removeQueries({ queryKey: todoKeys.detail(id) });
      // Invalidate and refetch todos list
      queryClient.invalidateQueries({ queryKey: todoKeys.lists() });
    }
  });
};
