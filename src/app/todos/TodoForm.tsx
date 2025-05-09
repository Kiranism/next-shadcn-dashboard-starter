'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useCreateTodo } from '@/lib/hooks/useTodos';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';

// Form schema
const todoFormSchema = z.object({
  title: z
    .string()
    .min(3, 'Title must be at least 3 characters')
    .max(100, 'Title must be less than 100 characters'),
  completed: z.boolean().default(false),
  userId: z.number().int().positive('User ID must be a positive number')
});

type TodoFormValues = z.infer<typeof todoFormSchema>;

export default function TodoForm() {
  const createTodoMutation = useCreateTodo();

  // Default values
  const defaultValues: Partial<TodoFormValues> = {
    title: '',
    completed: false,
    userId: 1
  };

  const form = useForm<TodoFormValues>({
    resolver: zodResolver(todoFormSchema),
    defaultValues
  });

  const onSubmit = async (data: TodoFormValues) => {
    try {
      await createTodoMutation.mutateAsync(data);
      toast.success('Todo created successfully!');
      form.reset(defaultValues);
    } catch (error) {
      toast.error('Failed to create todo');
      console.error(error);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Add New Todo</CardTitle>
        <CardDescription>Create a new todo item</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-4'>
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder='Enter todo title' {...field} />
                  </FormControl>
                  <FormDescription>The title of your todo item</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='userId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>User ID</FormLabel>
                  <FormControl>
                    <Input
                      type='number'
                      placeholder='Enter user ID'
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormDescription>
                    The ID of the user this todo belongs to
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name='completed'
              render={({ field }) => (
                <FormItem className='flex flex-row items-start space-y-0 space-x-3 rounded-md border p-4'>
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className='space-y-1 leading-none'>
                    <FormLabel>Completed</FormLabel>
                    <FormDescription>
                      Mark this todo as completed
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <CardFooter className='px-0'>
              <Button
                type='submit'
                className='w-full'
                disabled={createTodoMutation.isPending}
              >
                {createTodoMutation.isPending ? 'Creating...' : 'Create Todo'}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
