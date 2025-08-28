'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import { toast } from 'sonner';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Heading } from '@/components/ui/heading';
import PageContainer from '@/components/layout/page-container';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from '@/components/ui/form';

import { Task, TaskStatus } from '@/types/task';

const editTaskSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  deadline: z.string().min(1, 'Deadline is required'),
  startTime: z.string().optional(),
  rewardInstruction: z.string().optional(),
  totalRewardAmount: z.number().min(0, 'Reward amount must be positive'),
  rewardExp: z.number().min(0, 'Experience must be positive'),
  status: z.nativeEnum(TaskStatus),
  maxParticipants: z.number().optional(),
  projectName: z.string().optional(),
  projectLogo: z.string().optional()
});

type EditTaskFormData = z.infer<typeof editTaskSchema>;

export default function EditTaskPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<EditTaskFormData>({
    resolver: zodResolver(editTaskSchema),
    defaultValues: {
      title: '',
      description: '',
      deadline: '',
      startTime: '',
      rewardInstruction: '',
      totalRewardAmount: 0,
      rewardExp: 0,
      status: TaskStatus.DRAFT,
      maxParticipants: undefined,
      projectName: '',
      projectLogo: ''
    }
  });

  const fetchTask = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();

      if (data.success) {
        const taskData = data.data;
        setTask(taskData);

        // Format dates for input fields
        const deadline = new Date(taskData.deadline).toISOString().slice(0, 16);
        const startTime = taskData.startTime
          ? new Date(taskData.startTime).toISOString().slice(0, 16)
          : '';

        // Update form with task data
        form.reset({
          title: taskData.title || '',
          description: taskData.description || '',
          deadline,
          startTime,
          rewardInstruction: taskData.rewardInstruction || '',
          totalRewardAmount: taskData.totalRewardAmount || 0,
          rewardExp: taskData.rewardExp || 0,
          status: taskData.status,
          maxParticipants: taskData.maxParticipants || undefined,
          projectName: taskData.projectName || '',
          projectLogo: taskData.projectLogo || ''
        });
      } else {
        toast.error(data.error || 'Failed to fetch task');
        router.push('/dashboard/tasks');
      }
    } catch (error) {
      console.error('Error fetching task:', error);
      toast.error('Failed to fetch task');
      router.push('/dashboard/tasks');
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = async (data: EditTaskFormData) => {
    try {
      setIsSaving(true);

      // Convert string dates back to Date objects
      const updateData = {
        ...data,
        deadline: new Date(data.deadline),
        startTime: data.startTime ? new Date(data.startTime) : undefined,
        maxParticipants: data.maxParticipants || undefined
      };

      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Task updated successfully');
        router.push(`/dashboard/tasks/${taskId}`);
      } else {
        toast.error(result.error || 'Failed to update task');
      }
    } catch (error) {
      console.error('Error updating task:', error);
      toast.error('Failed to update task');
    } finally {
      setIsSaving(false);
    }
  };

  useEffect(() => {
    if (taskId) {
      fetchTask();
    }
  }, [taskId]);

  if (isLoading) {
    return (
      <PageContainer>
        <div className='space-y-4'>
          <div className='flex items-center space-x-4'>
            <Skeleton className='h-8 w-8' />
            <Skeleton className='h-8 w-48' />
          </div>
          <Skeleton className='h-96' />
        </div>
      </PageContainer>
    );
  }

  if (!task) {
    return (
      <PageContainer>
        <div className='py-8 text-center'>
          <h3 className='text-lg font-medium text-gray-900'>Task not found</h3>
          <p className='mt-1 text-sm text-gray-500'>
            The task you&apos;re looking for doesn&apos;t exist or has been
            deleted.
          </p>
          <Button
            className='mt-4'
            onClick={() => router.push('/dashboard/tasks')}
          >
            Back to Tasks
          </Button>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <div className='space-y-6'>
        {/* Header */}
        <div className='flex items-start justify-between'>
          <div className='flex items-center space-x-4'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => router.push(`/dashboard/tasks/${taskId}`)}
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back
            </Button>
            <div>
              <Heading
                title='Edit Task'
                description={`Editing: ${task.title}`}
              />
            </div>
          </div>
        </div>

        {/* Edit Form */}
        <Card>
          <CardHeader>
            <CardTitle>Task Details</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className='space-y-6'
              >
                <div className='grid gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='title'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Title *</FormLabel>
                        <FormControl>
                          <Input placeholder='Enter task title' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='projectName'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Project Name</FormLabel>
                        <FormControl>
                          <Input placeholder='Enter project name' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='description'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Enter task description'
                          className='min-h-[100px]'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='grid gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='deadline'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Deadline *</FormLabel>
                        <FormControl>
                          <Input type='datetime-local' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='startTime'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type='datetime-local' {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid gap-4 md:grid-cols-3'>
                  <FormField
                    control={form.control}
                    name='status'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Status</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder='Select status' />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={TaskStatus.DRAFT}>
                              Draft
                            </SelectItem>
                            <SelectItem value={TaskStatus.PUBLISHED}>
                              Published
                            </SelectItem>
                            <SelectItem value={TaskStatus.ACTIVE}>
                              Active
                            </SelectItem>
                            <SelectItem value={TaskStatus.ENDED}>
                              Ended
                            </SelectItem>
                            <SelectItem value={TaskStatus.CANCELLED}>
                              Cancelled
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='maxParticipants'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Max Participants</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='Unlimited'
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  ? parseInt(e.target.value)
                                  : undefined
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className='grid gap-4 md:grid-cols-2'>
                  <FormField
                    control={form.control}
                    name='totalRewardAmount'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Reward Amount ($)</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            step='0.01'
                            placeholder='0.00'
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name='rewardExp'
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Experience Points</FormLabel>
                        <FormControl>
                          <Input
                            type='number'
                            placeholder='0'
                            {...field}
                            onChange={(e) =>
                              field.onChange(parseInt(e.target.value) || 0)
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name='rewardInstruction'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Reward Instructions</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder='Enter reward instructions'
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className='flex justify-end space-x-2'>
                  <Button
                    type='button'
                    variant='outline'
                    onClick={() => router.push(`/dashboard/tasks/${taskId}`)}
                  >
                    Cancel
                  </Button>
                  <Button type='submit' disabled={isSaving}>
                    <Save className='mr-2 h-4 w-4' />
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
