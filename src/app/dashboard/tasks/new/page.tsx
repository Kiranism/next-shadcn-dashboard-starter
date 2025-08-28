'use client';

import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { Heading } from '@/components/ui/heading';
import PageContainer from '@/components/layout/page-container';

import { TaskForm } from '@/features/tasks/components/task-form';
import { CreateTaskInput } from '@/lib/validations/task';

export default function NewTaskPage() {
  const router = useRouter();

  const handleSubmit = async (data: CreateTaskInput) => {
    try {
      const response = await fetch('/api/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Task created successfully!');
        router.push('/dashboard/tasks');
      } else {
        toast.error(result.error || 'Failed to create task');
      }
    } catch (error) {
      console.error('Error creating task:', error);
      toast.error('Failed to create task');
    }
  };

  return (
    <PageContainer>
      <div className='space-y-4'>
        <Heading
          title='Create New Task'
          description='Fill in the details to create a new task'
        />

        <TaskForm onSubmit={handleSubmit} />
      </div>
    </PageContainer>
  );
}
