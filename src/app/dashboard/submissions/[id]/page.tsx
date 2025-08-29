'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  CheckCircle,
  XCircle,
  User,
  Calendar,
  FileText,
  MessageSquare
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
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Heading } from '@/components/ui/heading';
import PageContainer from '@/components/layout/page-container';

import { TaskSubmission, SubmissionReviewStatus } from '@/types/submission';

const reviewStatusConfig = {
  pending: { label: 'Pending', variant: 'secondary' as const },
  approved: { label: 'Approved', variant: 'default' as const },
  rejected: { label: 'Rejected', variant: 'destructive' as const }
};

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const submissionId = params.id as string;

  const [submission, setSubmission] = useState<TaskSubmission | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isReviewing, setIsReviewing] = useState(false);
  const [reviewComment, setReviewComment] = useState('');

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const response = await fetch(`/api/submissions/${submissionId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch submission');
        }
        const result = await response.json();
        setSubmission(result.data);
        setReviewComment(result.data.reviewComment || '');
      } catch (error) {
        console.error('Error fetching submission:', error);
        toast.error('Failed to load submission');
      } finally {
        setIsLoading(false);
      }
    };

    if (submissionId) {
      fetchSubmission();
    }
  }, [submissionId]);

  const handleReview = async (reviewStatus: 'approved' | 'rejected') => {
    if (!submission) return;

    setIsReviewing(true);
    try {
      const response = await fetch(`/api/submissions/${submission.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reviewStatus,
          reviewComment: reviewComment.trim() || undefined
        })
      });

      if (!response.ok) {
        throw new Error('Failed to review submission');
      }

      const result = await response.json();
      setSubmission(result.data);
      toast.success(`Submission ${reviewStatus} successfully`);
    } catch (error) {
      console.error('Error reviewing submission:', error);
      toast.error('Failed to review submission');
    } finally {
      setIsReviewing(false);
    }
  };

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

  if (!submission) {
    return (
      <PageContainer>
        <div className='py-8 text-center'>
          <h3 className='text-lg font-medium text-gray-900'>
            Submission not found
          </h3>
          <p className='mt-1 text-sm text-gray-500'>
            The submission you&apos;re looking for doesn&apos;t exist or has
            been deleted.
          </p>
          <Button
            className='mt-4'
            onClick={() => router.push('/dashboard/submissions')}
          >
            Back to Submissions
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
              onClick={() => router.push('/dashboard/submissions')}
            >
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back
            </Button>
            <div>
              <Heading
                title={submission.task?.title || 'Submission Details'}
                description={`Submission ID: ${submission.id}`}
              />
            </div>
          </div>
          <Badge variant={reviewStatusConfig[submission.reviewStatus].variant}>
            {reviewStatusConfig[submission.reviewStatus].label}
          </Badge>
        </div>

        <div className='grid gap-6 md:grid-cols-2'>
          {/* Submission Details */}
          <Card>
            <CardHeader>
              <CardTitle>Submission Information</CardTitle>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div>
                <h4 className='text-muted-foreground text-sm font-medium'>
                  Content
                </h4>
                <div className='bg-muted mt-1 rounded-md p-3'>
                  <p className='text-sm whitespace-pre-wrap'>
                    {submission.submissionContent}
                  </p>
                </div>
              </div>

              <Separator />

              <div className='space-y-4'>
                <div className='flex items-center space-x-3'>
                  <Avatar className='h-10 w-10'>
                    <AvatarImage src={submission.profile?.avatarUrl || ''} />
                    <AvatarFallback>
                      {submission.profile?.fullName?.charAt(0) ||
                        submission.userId.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className='text-sm font-medium'>
                      {submission.profile?.fullName || submission.userId}
                    </p>
                    <p className='text-muted-foreground text-xs capitalize'>
                      {submission.profile?.role || 'User'}
                    </p>
                  </div>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div className='flex items-center space-x-2'>
                    <Calendar className='text-muted-foreground h-4 w-4' />
                    <div>
                      <p className='text-muted-foreground text-xs'>Submitted</p>
                      <p className='text-sm font-medium'>
                        {format(submission.submittedAt, 'PPP p')}
                      </p>
                    </div>
                  </div>

                  {submission.reviewedAt && (
                    <div className='flex items-center space-x-2'>
                      <Calendar className='text-muted-foreground h-4 w-4' />
                      <div>
                        <p className='text-muted-foreground text-xs'>
                          Reviewed
                        </p>
                        <p className='text-sm font-medium'>
                          {format(submission.reviewedAt, 'PPP p')}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {submission.reviewedBy && (
                  <div className='flex items-center space-x-2'>
                    <User className='text-muted-foreground h-4 w-4' />
                    <div>
                      <p className='text-muted-foreground text-xs'>
                        Reviewed By
                      </p>
                      <p className='text-sm font-medium'>
                        {submission.reviewedBy}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Review Management */}
          <Card>
            <CardHeader>
              <CardTitle>Review Management</CardTitle>
              <CardDescription>
                Review this submission and provide feedback
              </CardDescription>
            </CardHeader>
            <CardContent className='space-y-4'>
              <div className='space-y-2'>
                <Label>Review Comment</Label>
                <Textarea
                  placeholder='Add your review comment...'
                  value={reviewComment}
                  onChange={(e) => setReviewComment(e.target.value)}
                  disabled={isReviewing}
                  className='min-h-[100px]'
                />
              </div>

              {submission.reviewStatus === 'pending' && (
                <div className='flex space-x-2'>
                  <Button
                    onClick={() => handleReview('approved')}
                    disabled={isReviewing}
                    className='flex-1'
                  >
                    <CheckCircle className='mr-2 h-4 w-4' />
                    Approve
                  </Button>
                  <Button
                    variant='destructive'
                    onClick={() => handleReview('rejected')}
                    disabled={isReviewing}
                    className='flex-1'
                  >
                    <XCircle className='mr-2 h-4 w-4' />
                    Reject
                  </Button>
                </div>
              )}

              {submission.reviewComment && (
                <>
                  <Separator />
                  <div>
                    <h4 className='text-muted-foreground mb-2 text-sm font-medium'>
                      Previous Review Comment
                    </h4>
                    <div className='bg-muted rounded-md p-3'>
                      <p className='text-sm'>{submission.reviewComment}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Task Information */}
        {submission.task && (
          <Card>
            <CardHeader>
              <CardTitle className='flex items-center space-x-2'>
                <FileText className='h-5 w-5' />
                <span>Task Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className='space-y-4'>
                <div>
                  <h4 className='text-muted-foreground text-sm font-medium'>
                    Task Title
                  </h4>
                  <p className='text-sm font-medium'>{submission.task.title}</p>
                </div>

                <div>
                  <h4 className='text-muted-foreground text-sm font-medium'>
                    Description
                  </h4>
                  <p className='text-sm'>{submission.task.description}</p>
                </div>

                <div className='grid grid-cols-2 gap-4'>
                  <div>
                    <h4 className='text-muted-foreground text-sm font-medium'>
                      Reward
                    </h4>
                    <p className='text-sm font-medium'>
                      ${submission.task.totalRewardAmount}
                    </p>
                  </div>
                  <div>
                    <h4 className='text-muted-foreground text-sm font-medium'>
                      Experience
                    </h4>
                    <p className='text-sm font-medium'>
                      {submission.task.rewardExp} XP
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className='text-muted-foreground text-sm font-medium'>
                    Deadline
                  </h4>
                  <p className='text-sm'>
                    {format(submission.task.deadline, 'PPP')}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </PageContainer>
  );
}
