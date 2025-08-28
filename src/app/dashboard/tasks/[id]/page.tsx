'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Edit,
  Trash2,
  Users,
  Calendar,
  DollarSign,
  Trophy,
  Clock,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';
import { Heading } from '@/components/ui/heading';
import PageContainer from '@/components/layout/page-container';

import { Task, TaskStatus } from '@/types/task';

const statusConfig = {
  [TaskStatus.DRAFT]: { label: 'Draft', variant: 'secondary' as const },
  [TaskStatus.PUBLISHED]: { label: 'Published', variant: 'default' as const },
  [TaskStatus.ACTIVE]: { label: 'Active', variant: 'default' as const },
  [TaskStatus.ENDED]: { label: 'Ended', variant: 'outline' as const },
  [TaskStatus.CANCELLED]: {
    label: 'Cancelled',
    variant: 'destructive' as const
  }
};

export default function TaskDetailPage() {
  const params = useParams();
  const router = useRouter();
  const taskId = params.id as string;

  const [task, setTask] = useState<Task | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchTask = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/tasks/${taskId}`);
      const data = await response.json();

      if (data.success) {
        // Convert date strings back to Date objects
        const taskWithDates = {
          ...data.data,
          deadline: new Date(data.data.deadline),
          startTime: data.data.startTime
            ? new Date(data.data.startTime)
            : undefined,
          createdAt: new Date(data.data.createdAt),
          updatedAt: new Date(data.data.updatedAt)
        };
        setTask(taskWithDates);
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

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        toast.success('Task deleted successfully');
        router.push('/dashboard/tasks');
      } else {
        toast.error(data.error || 'Failed to delete task');
      }
    } catch (error) {
      console.error('Error deleting task:', error);
      toast.error('Failed to delete task');
    } finally {
      setIsDeleting(false);
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
          <div className='grid gap-4 md:grid-cols-2'>
            <Skeleton className='h-64' />
            <Skeleton className='h-64' />
          </div>
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
              onClick={() => router.push('/dashboard/tasks')}
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back
            </Button>
            <div>
              <Heading title={task.title} description={`Task ID: ${task.id}`} />
            </div>
          </div>
          <div className='flex items-center space-x-2'>
            <Button
              variant='outline'
              onClick={() => router.push(`/dashboard/tasks/${task.id}/edit`)}
            >
              <Edit className='mr-2 h-4 w-4' />
              Edit
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant='destructive'>
                  <Trash2 className='mr-2 h-4 w-4' />
                  Delete
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete
                    the task and remove all associated data.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    disabled={isDeleting}
                    className='bg-red-600 hover:bg-red-700'
                  >
                    {isDeleting ? 'Deleting...' : 'Delete Task'}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>

        {/* Status and Priority Badges */}
        <div className='flex items-center space-x-2'>
          <Badge variant={statusConfig[task.status].variant}>
            {statusConfig[task.status].label}
          </Badge>
        </div>

        <div className='grid gap-6 md:grid-cols-2'>
          {/* Task Details */}
          <Card>
            <CardHeader>
              <CardTitle>Task Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <h4 className='text-muted-foreground text-sm font-medium'>
                  Description
                </h4>
                <p className='mt-1 text-sm'>{task.description}</p>
              </div>

              {task.projectName && (
                <div>
                  <h4 className='text-muted-foreground text-sm font-medium'>
                    Project
                  </h4>
                  <p className='mt-1 text-sm font-medium text-blue-600'>
                    {task.projectName}
                  </p>
                </div>
              )}

              {task.rewardInstruction && (
                <div>
                  <h4 className='text-muted-foreground text-sm font-medium'>
                    Reward Instructions
                  </h4>
                  <p className='mt-1 text-sm'>{task.rewardInstruction}</p>
                </div>
              )}

              <Separator />

              <div className='grid grid-cols-2 gap-4'>
                <div className='flex items-center space-x-2'>
                  <Calendar className='text-muted-foreground h-4 w-4' />
                  <div>
                    <p className='text-muted-foreground text-xs'>Deadline</p>
                    <p className='text-sm font-medium'>
                      {format(task.deadline, 'PPP')}
                    </p>
                  </div>
                </div>

                {task.startTime && (
                  <div className='flex items-center space-x-2'>
                    <Clock className='text-muted-foreground h-4 w-4' />
                    <div>
                      <p className='text-muted-foreground text-xs'>
                        Start Time
                      </p>
                      <p className='text-sm font-medium'>
                        {format(task.startTime, 'PPP')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rewards and Participants */}
          <Card>
            <CardHeader>
              <CardTitle>Rewards & Participation</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='grid grid-cols-2 gap-4'>
                <div className='flex items-center space-x-2'>
                  <DollarSign className='h-4 w-4 text-green-600' />
                  <div>
                    <p className='text-muted-foreground text-xs'>
                      Reward Amount
                    </p>
                    <p className='text-lg font-bold text-green-600'>
                      ${task.totalRewardAmount.toLocaleString()}
                    </p>
                  </div>
                </div>

                <div className='flex items-center space-x-2'>
                  <Trophy className='h-4 w-4 text-yellow-600' />
                  <div>
                    <p className='text-muted-foreground text-xs'>Experience</p>
                    <p className='text-lg font-bold text-yellow-600'>
                      {task.rewardExp} EXP
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              <div className='flex items-center space-x-2'>
                <Users className='text-muted-foreground h-4 w-4' />
                <div>
                  <p className='text-muted-foreground text-xs'>Participants</p>
                  <p className='text-sm font-medium'>
                    {task.currentParticipants}
                    {task.maxParticipants && ` / ${task.maxParticipants}`}
                    {!task.maxParticipants && ' (Unlimited)'}
                  </p>
                </div>
              </div>

              {task.assignedTo && (
                <div className='flex items-center space-x-2'>
                  <User className='text-muted-foreground h-4 w-4' />
                  <div>
                    <p className='text-muted-foreground text-xs'>Assigned To</p>
                    <p className='text-sm font-medium'>{task.assignedTo}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Metadata */}
        <Card>
          <CardHeader>
            <CardTitle>Metadata</CardTitle>
          </CardHeader>
          <CardContent>
            <div className='grid grid-cols-1 gap-4 text-sm md:grid-cols-3'>
              <div>
                <p className='text-muted-foreground'>Created By</p>
                <p className='font-medium'>{task.createdBy}</p>
              </div>
              <div>
                <p className='text-muted-foreground'>Created At</p>
                <p className='font-medium'>{format(task.createdAt, 'PPP p')}</p>
              </div>
              <div>
                <p className='text-muted-foreground'>Last Updated</p>
                <p className='font-medium'>{format(task.updatedAt, 'PPP p')}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageContainer>
  );
}
