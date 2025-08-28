'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

import { createTaskSchema, type CreateTaskInput } from '@/lib/validations/task';

interface TaskFormProps {
  onSubmit: (data: CreateTaskInput) => Promise<void>;
  initialData?: Partial<CreateTaskInput>;
  isLoading?: boolean;
}

export function TaskForm({ onSubmit, initialData, isLoading }: TaskFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateTaskInput>({
    resolver: zodResolver(createTaskSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      deadline:
        initialData?.deadline || new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 7 days from now
      rewardInstruction: initialData?.rewardInstruction || '',
      totalRewardAmount: initialData?.totalRewardAmount || 0,
      rewardExp: initialData?.rewardExp || 0,
      maxParticipants: initialData?.maxParticipants || undefined,
      projectName: initialData?.projectName || '',
      projectLogo: initialData?.projectLogo || '',
      startTime: initialData?.startTime || undefined
    }
  });

  const handleSubmit = async (data: CreateTaskInput) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting task:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader>
        <CardTitle>Create New Task</CardTitle>
        <CardDescription>
          Fill in the details below to create a new task.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-6'
          >
            {/* Title */}
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

            {/* Description */}
            <FormField
              control={form.control}
              name='description'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Describe the task in detail'
                      className='min-h-[100px]'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Deadline */}
            <FormField
              control={form.control}
              name='deadline'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Deadline *</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant='outline'
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a date</span>
                          )}
                          <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) =>
                          date < new Date() || date < new Date('1900-01-01')
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Start Time (Optional) */}
            <FormField
              control={form.control}
              name='startTime'
              render={({ field }) => (
                <FormItem className='flex flex-col'>
                  <FormLabel>Start Time (Optional)</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant='outline'
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP')
                          ) : (
                            <span>Pick a start date</span>
                          )}
                          <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='single'
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date('1900-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When should this task become available?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Reward Information */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='totalRewardAmount'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Reward Amount *</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        step='0.01'
                        min='0'
                        placeholder='0.00'
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseFloat(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>Amount in USDT</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='rewardExp'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Experience Points *</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='0'
                        placeholder='0'
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value) || 0)
                        }
                      />
                    </FormControl>
                    <FormDescription>EXP reward</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Reward Instructions */}
            <FormField
              control={form.control}
              name='rewardInstruction'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reward Instructions</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='How will rewards be distributed?'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Explain how participants will receive their rewards
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Project Information */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='projectName'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Name</FormLabel>
                    <FormControl>
                      <Input placeholder='Project name' {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name='projectLogo'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Project Logo URL</FormLabel>
                    <FormControl>
                      <Input
                        type='url'
                        placeholder='https://example.com/logo.png'
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Participants and Assignment */}
            <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
              <FormField
                control={form.control}
                name='maxParticipants'
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Max Participants</FormLabel>
                    <FormControl>
                      <Input
                        type='number'
                        min='1'
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
                    <FormDescription>Leave empty for unlimited</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Submit Button */}
            <div className='flex justify-end space-x-4'>
              <Button
                type='button'
                variant='outline'
                onClick={() => form.reset()}
              >
                Reset
              </Button>
              <Button type='submit' disabled={isSubmitting || isLoading}>
                {isSubmitting && (
                  <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                )}
                Create Task
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
