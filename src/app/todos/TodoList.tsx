'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Skeleton } from '@/components/ui/skeleton';
import { useDeleteTodo, useTodos, useUpdateTodo } from '@/lib/hooks/useTodos';
import { toast } from 'sonner';

export default function TodoList() {
  const { data: todos, isLoading, isError, error } = useTodos();
  const updateTodoMutation = useUpdateTodo();
  const deleteTodoMutation = useDeleteTodo();

  const handleToggleComplete = async (id: number, completed: boolean) => {
    try {
      await updateTodoMutation.mutateAsync({
        id,
        todo: { completed: !completed }
      });
      toast.success(
        `Todo marked as ${!completed ? 'completed' : 'incomplete'}`
      );
    } catch (error) {
      toast.error('Failed to update todo');
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteTodoMutation.mutateAsync(id);
      toast.success('Todo deleted successfully');
    } catch (error) {
      toast.error('Failed to delete todo');
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Todo List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='space-y-4'>
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className='flex items-center justify-between rounded-md border p-4'
              >
                <div className='flex items-center gap-3'>
                  <Skeleton className='h-4 w-4 rounded-sm' />
                  <Skeleton className='h-4 w-64' />
                </div>
                <Skeleton className='h-8 w-20' />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Todo List</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='bg-destructive/10 rounded-md p-4'>
            <p className='text-destructive font-medium'>
              Error loading todos: {error.message}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Todo List</CardTitle>
      </CardHeader>
      <CardContent>
        <div className='space-y-4'>
          {todos?.slice(0, 10).map((todo) => (
            <div
              key={todo.id}
              className={`flex items-center justify-between rounded-md border p-4 ${
                todo.completed ? 'bg-green-50 dark:bg-green-900/10' : ''
              }`}
            >
              <div className='flex items-center gap-3'>
                <Checkbox
                  checked={todo.completed}
                  onCheckedChange={() =>
                    handleToggleComplete(todo.id, todo.completed)
                  }
                  id={`todo-${todo.id}`}
                />
                <label
                  htmlFor={`todo-${todo.id}`}
                  className={`text-sm ${todo.completed ? 'text-muted-foreground line-through' : ''}`}
                >
                  {todo.title}
                </label>
              </div>
              <Button
                variant='destructive'
                size='sm'
                onClick={() => handleDelete(todo.id)}
                disabled={
                  deleteTodoMutation.isPending &&
                  deleteTodoMutation.variables === todo.id
                }
              >
                {deleteTodoMutation.isPending &&
                deleteTodoMutation.variables === todo.id
                  ? 'Deleting...'
                  : 'Delete'}
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
