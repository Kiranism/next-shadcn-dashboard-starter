'use client';

import { useGetJobById, useGetAllEnums } from '@/hooks/useQuery';
import {
  useDeleteJob,
  useToggleJobActive,
  useToggleJobPremium,
  useToggleJobBoosted,
  useToggleJobDeleted
} from '@/hooks/useMutation';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import {
  IconArrowLeft,
  IconMapPin,
  IconBriefcase,
  IconCalendar,
  IconCoin,
  IconSchool,
  IconUser,
  IconStar,
  IconRocket,
  IconTrash,
  IconTrashOff
} from '@tabler/icons-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { toast } from 'sonner';

export default function JobDetailPage() {
  const params = useParams();
  const router = useRouter();
  const jobId = params.jobId as string;

  // Fetch job details
  const {
    data: jobData,
    isLoading,
    isError,
    refetch
  } = useGetJobById(jobId, {
    refetchOnWindowFocus: false
  });

  // Fetch enums for displaying human-readable values
  const { data: enumsData } = useGetAllEnums({
    refetchOnWindowFocus: false
  });

  const job = jobData?.data;

  // Modal state
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    action: () => void;
    confirmText: string;
    confirmVariant:
      | 'default'
      | 'destructive'
      | 'outline'
      | 'secondary'
      | 'ghost'
      | 'link';
  }>({
    isOpen: false,
    title: '',
    description: '',
    action: () => {},
    confirmText: 'Confirm',
    confirmVariant: 'default'
  });

  // Set up mutations for job status update and deletion
  const toggleJobActiveMutation = useToggleJobActive({
    onSuccess: () => {
      refetch();
    }
  });

  const deleteJobMutation = useDeleteJob({
    onSuccess: () => {
      router.push('/dashboard/all-jobs');
    }
  });

  const toggleJobPremiumMutation = useToggleJobPremium({
    onSuccess: () => {
      refetch();
    }
  });

  const toggleJobBoostedMutation = useToggleJobBoosted({
    onSuccess: () => {
      refetch();
    }
  });

  const toggleJobDeletedMutation = useToggleJobDeleted({
    onSuccess: () => {
      refetch();
    }
  });

  // Handle job status toggle
  const handleToggleJobStatus = () => {
    if (!job) return;

    setConfirmModal({
      isOpen: true,
      title: job.isJobActive ? 'Deactivate Job' : 'Activate Job',
      description: job.isJobActive
        ? 'Are you sure you want to deactivate this job? It will no longer be visible to job seekers.'
        : 'Are you sure you want to activate this job? It will be visible to job seekers.',
      action: () => {
        toggleJobActiveMutation.mutate({
          jobId,
          isJobActive: !job.isJobActive
        });
      },
      confirmText: job.isJobActive ? 'Deactivate' : 'Activate',
      confirmVariant: job.isJobActive ? 'destructive' : 'default'
    });
  };

  // Handle job deletion (permanent)
  const handleDeleteJob = () => {
    if (!job) return;

    setConfirmModal({
      isOpen: true,
      title: 'Permanently Delete Job',
      description:
        'Are you sure you want to permanently delete this job? This action cannot be undone.',
      action: () => {
        deleteJobMutation.mutate(jobId);
      },
      confirmText: 'Delete Permanently',
      confirmVariant: 'destructive'
    });
  };

  // Handle job premium status toggle
  const handleToggleJobPremium = () => {
    if (!job) return;

    setConfirmModal({
      isOpen: true,
      title:
        job.isPremium === true ? 'Remove Premium Status' : 'Mark as Premium',
      description:
        job.isPremium === true
          ? 'Are you sure you want to remove the premium status from this job?'
          : 'Are you sure you want to mark this job as premium?',
      action: () => {
        toggleJobPremiumMutation.mutate({
          jobId,
          isPremium: !(job.isPremium === true)
        });
      },
      confirmText:
        job.isPremium === true ? 'Remove Premium' : 'Mark as Premium',
      confirmVariant: 'default'
    });
  };

  // Handle job boosted status toggle
  const handleToggleJobBoosted = () => {
    if (!job) return;

    setConfirmModal({
      isOpen: true,
      title: job.isBoosted === true ? 'Remove Boost' : 'Boost Job',
      description:
        job.isBoosted === true
          ? 'Are you sure you want to remove the boost from this job?'
          : 'Are you sure you want to boost this job?',
      action: () => {
        toggleJobBoostedMutation.mutate({
          jobId,
          isBoosted: !(job.isBoosted === true)
        });
      },
      confirmText: job.isBoosted === true ? 'Remove Boost' : 'Boost Job',
      confirmVariant: 'default'
    });
  };

  // Handle job deleted status toggle
  const handleToggleJobDeleted = () => {
    if (!job) return;

    if (job.isDeleted === true) {
      setConfirmModal({
        isOpen: true,
        title: 'Restore Job',
        description: 'Are you sure you want to restore this job?',
        action: () => {
          toggleJobDeletedMutation.mutate({
            jobId,
            isDeleted: false
          });
        },
        confirmText: 'Restore Job',
        confirmVariant: 'default'
      });
    } else {
      setConfirmModal({
        isOpen: true,
        title: 'Mark Job as Deleted',
        description:
          'Are you sure you want to mark this job as deleted? (This is reversible)',
        action: () => {
          toggleJobDeletedMutation.mutate({
            jobId,
            isDeleted: true
          });
        },
        confirmText: 'Mark as Deleted',
        confirmVariant: 'outline'
      });
    }
  };

  // Go back to jobs list
  const goBack = () => {
    router.push('/dashboard/all-jobs');
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPP');
    } catch (error) {
      return 'Invalid date';
    }
  };

  // Get human-readable enum values
  const getEnumValue = (enumType: string, key: string) => {
    if (!enumsData?.data) return key;

    const enumObject = enumsData.data[enumType as keyof typeof enumsData.data];
    if (!enumObject) return key;

    return (enumObject as Record<string, string>)[key] || key;
  };

  if (isLoading) {
    return (
      <PageContainer>
        <div className='flex flex-col space-y-6'>
          <div className='flex items-center'>
            <Button variant='ghost' onClick={goBack} className='mr-4'>
              <IconArrowLeft className='mr-2 h-4 w-4' />
              Back
            </Button>
            <div className='h-8 w-64 animate-pulse rounded bg-gray-200'></div>
          </div>
          <Separator />
          <div className='grid grid-cols-1 gap-6 md:grid-cols-2'>
            <div className='h-64 animate-pulse rounded bg-gray-200'></div>
            <div className='h-64 animate-pulse rounded bg-gray-200'></div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError || !job) {
    return (
      <PageContainer>
        <div className='flex flex-col space-y-6'>
          <Button variant='ghost' onClick={goBack} className='w-fit'>
            <IconArrowLeft className='mr-2 h-4 w-4' />
            Back to Jobs
          </Button>
          <div className='rounded-md bg-red-50 p-4 text-red-500'>
            Failed to load job details. Please try again.
          </div>
        </div>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        onConfirm={confirmModal.action}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.confirmVariant}
      />
      <div className='flex flex-col space-y-6'>
        <div className='flex items-center justify-between'>
          <div className='flex items-center'>
            <Button variant='ghost' onClick={goBack} className='mr-4'>
              <IconArrowLeft className='mr-2 h-4 w-4' />
              Back
            </Button>
            <Heading
              title={job.jobTitle}
              description={`Posted by ${job.recruiterProfile.companyName}`}
            />
          </div>
          <div className='flex gap-2'>
            <Button
              variant={job.isJobActive ? 'destructive' : 'default'}
              onClick={handleToggleJobStatus}
            >
              {job.isJobActive ? 'Deactivate' : 'Activate'} Job
            </Button>

            <Button
              variant={job.isPremium === true ? 'default' : 'outline'}
              className={
                job.isPremium === true
                  ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                  : ''
              }
              onClick={handleToggleJobPremium}
            >
              <IconStar className='mr-2 h-4 w-4' />
              {job.isPremium === true ? 'Remove Premium' : 'Mark Premium'}
            </Button>

            <Button
              variant={job.isBoosted === true ? 'default' : 'outline'}
              className={
                job.isBoosted === true
                  ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                  : ''
              }
              onClick={handleToggleJobBoosted}
            >
              <IconRocket className='mr-2 h-4 w-4' />
              {job.isBoosted === true ? 'Remove Boost' : 'Boost Job'}
            </Button>

            {job.isDeleted === true ? (
              <Button
                variant='outline'
                className='border-green-200 text-green-600 hover:bg-green-50'
                onClick={handleToggleJobDeleted}
              >
                <IconTrashOff className='mr-2 h-4 w-4' />
                Restore Job
              </Button>
            ) : (
              <Button
                variant='outline'
                className='border-red-200 text-red-600 hover:bg-red-50'
                onClick={handleToggleJobDeleted}
              >
                <IconTrash className='mr-2 h-4 w-4' />
                Mark as Deleted
              </Button>
            )}

            <Button variant='destructive' onClick={handleDeleteJob}>
              Permanently Delete
            </Button>
          </div>
        </div>
        <Separator />

        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          {/* Main job details */}
          <div className='space-y-6 md:col-span-2'>
            <Card>
              <CardHeader>
                <CardTitle>Job Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='whitespace-pre-wrap'>{job.jobDescription}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Key Responsibilities</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='whitespace-pre-wrap'>
                  {job.keyResponsibilities}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills & Experience</CardTitle>
              </CardHeader>
              <CardContent>
                <div className='whitespace-pre-wrap'>
                  {job.skillsAndExperience}
                </div>
                {job.skillsTag && job.skillsTag.length > 0 && (
                  <div className='mt-4'>
                    <h4 className='mb-2 text-sm font-medium'>
                      Required Skills:
                    </h4>
                    <div className='flex flex-wrap gap-2'>
                      {job.skillsTag.map((skill, index) => (
                        <Badge key={index} variant='secondary'>
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar with job metadata */}
          <div className='space-y-6'>
            <Card>
              <CardHeader>
                <CardTitle>Job Details</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-start'>
                  <IconBriefcase className='text-muted-foreground mt-0.5 mr-2 h-5 w-5' />
                  <div>
                    <p className='text-sm font-medium'>Job Type</p>
                    <p className='text-muted-foreground text-sm'>
                      {getEnumValue('JOB_TYPE_ENUM', job.jobType)} -{' '}
                      {getEnumValue('JOB_MODE_ENUM', job.jobMode)}
                    </p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <IconCoin className='text-muted-foreground mt-0.5 mr-2 h-5 w-5' />
                  <div>
                    <p className='text-sm font-medium'>Salary</p>
                    <p className='text-muted-foreground text-sm'>
                      {getEnumValue('SALARY_TYPE_ENUM', job.salaryType)} -
                      {job.salaryRangeStart} to {job.salaryRangeEnd}
                    </p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <IconUser className='text-muted-foreground mt-0.5 mr-2 h-5 w-5' />
                  <div>
                    <p className='text-sm font-medium'>Experience & Level</p>
                    <p className='text-muted-foreground text-sm'>
                      {getEnumValue(
                        'EXPERIENCE_RANGE_ENUM',
                        job.experienceLevel
                      )}{' '}
                      -{getEnumValue('CAREER_LEVEL_ENUM', job.careerLevel)}
                    </p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <IconSchool className='text-muted-foreground mt-0.5 mr-2 h-5 w-5' />
                  <div>
                    <p className='text-sm font-medium'>Qualification</p>
                    <p className='text-muted-foreground text-sm'>
                      {getEnumValue('QUALIFICATION_ENUM', job.qualification)}
                    </p>
                  </div>
                </div>

                <div className='flex items-start'>
                  <IconCalendar className='text-muted-foreground mt-0.5 mr-2 h-5 w-5' />
                  <div>
                    <p className='text-sm font-medium'>Application Deadline</p>
                    <p className='text-muted-foreground text-sm'>
                      {formatDate(job.applicationDeadline)}
                    </p>
                  </div>
                </div>

                {job.location && job.location.formattedAddress && (
                  <div className='flex items-start'>
                    <IconMapPin className='text-muted-foreground mt-0.5 mr-2 h-5 w-5' />
                    <div>
                      <p className='text-sm font-medium'>Location</p>
                      <p className='text-muted-foreground text-sm'>
                        {job.location.formattedAddress}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Job Status</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Status</span>
                  <Badge variant={job.isJobActive ? 'default' : 'destructive'}>
                    {job.isJobActive ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Premium</span>
                  <Badge
                    variant={job.isPremium === true ? 'default' : 'secondary'}
                    className={
                      job.isPremium === true
                        ? 'border-yellow-200 bg-yellow-100 text-yellow-700'
                        : ''
                    }
                  >
                    {job.isPremium === true ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Boosted</span>
                  <Badge
                    variant={job.isBoosted === true ? 'default' : 'secondary'}
                    className={
                      job.isBoosted === true
                        ? 'border-blue-200 bg-blue-100 text-blue-700'
                        : ''
                    }
                  >
                    {job.isBoosted === true ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Deleted</span>
                  <Badge
                    variant={job.isDeleted === true ? 'outline' : 'secondary'}
                    className={
                      job.isDeleted === true
                        ? 'border-red-200 text-red-600'
                        : ''
                    }
                  >
                    {job.isDeleted === true ? 'Yes' : 'No'}
                  </Badge>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Created</span>
                  <span className='text-muted-foreground text-sm'>
                    {formatDate(job.createdAt)}
                  </span>
                </div>

                <div className='flex items-center justify-between'>
                  <span className='text-sm font-medium'>Last Updated</span>
                  <span className='text-muted-foreground text-sm'>
                    {formatDate(job.updatedAt)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
