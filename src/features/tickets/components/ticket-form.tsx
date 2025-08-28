'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, X, Plus } from 'lucide-react';

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
import { Badge } from '@/components/ui/badge';

import {
  createTicketSchema,
  type CreateTicketInput
} from '@/lib/validations/ticket';
import { TicketPriority } from '@/types/ticket';

interface TicketFormProps {
  onSubmit: (data: CreateTicketInput) => Promise<void>;
  initialData?: Partial<CreateTicketInput>;
  isLoading?: boolean;
}

export function TicketForm({
  onSubmit,
  initialData,
  isLoading
}: TicketFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [tagInput, setTagInput] = useState('');

  const form = useForm<CreateTicketInput>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: {
      submitterId: initialData?.submitterId || '',
      title: initialData?.title || '',
      content: initialData?.content || '',
      priority: initialData?.priority || 'medium',
      tags: initialData?.tags || [],
      assignedTo: initialData?.assignedTo || ''
    }
  });

  const handleSubmit = async (data: CreateTicketInput) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error('Error submitting ticket:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !form.getValues('tags')?.includes(trimmedTag)) {
      const currentTags = form.getValues('tags') || [];
      form.setValue('tags', [...currentTags, trimmedTag]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags') || [];
    form.setValue(
      'tags',
      currentTags.filter((tag) => tag !== tagToRemove)
    );
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  return (
    <Card className='mx-auto w-full max-w-2xl'>
      <CardHeader>
        <CardTitle>Create Support Ticket</CardTitle>
        <CardDescription>
          Submit a support request or report an issue.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className='space-y-6'
          >
            {/* Submitter ID */}
            <FormField
              control={form.control}
              name='submitterId'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Submitter Email *</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='your.email@example.com'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Your email address for follow-up communication
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Title */}
            <FormField
              control={form.control}
              name='title'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title *</FormLabel>
                  <FormControl>
                    <Input
                      placeholder='Brief description of the issue'
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Content */}
            <FormField
              control={form.control}
              name='content'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description *</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder='Provide detailed information about your issue or request...'
                      className='min-h-[120px]'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Please include as much detail as possible to help us assist
                    you better
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Tags */}
            <FormField
              control={form.control}
              name='tags'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <div className='space-y-2'>
                    <div className='flex space-x-2'>
                      <Input
                        placeholder='Add a tag'
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={handleTagInputKeyDown}
                      />
                      <Button
                        type='button'
                        variant='outline'
                        size='sm'
                        onClick={addTag}
                        disabled={!tagInput.trim()}
                      >
                        <Plus className='h-4 w-4' />
                      </Button>
                    </div>
                    {field.value && field.value.length > 0 && (
                      <div className='flex flex-wrap gap-2'>
                        {field.value.map((tag) => (
                          <Badge
                            key={tag}
                            variant='secondary'
                            className='flex items-center gap-1'
                          >
                            {tag}
                            <Button
                              type='button'
                              variant='ghost'
                              size='sm'
                              className='text-muted-foreground hover:text-foreground h-auto p-0'
                              onClick={() => removeTag(tag)}
                            >
                              <X className='h-3 w-3' />
                            </Button>
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                  <FormDescription>
                    Add relevant tags to help categorize your ticket (e.g., bug,
                    feature-request, login)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Assigned To */}
            <FormField
              control={form.control}
              name='assignedTo'
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Assign To (Optional)</FormLabel>
                  <FormControl>
                    <Input
                      type='email'
                      placeholder='support@example.com'
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Assign to a specific team member or leave empty for
                    automatic assignment
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

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
                Submit Ticket
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
