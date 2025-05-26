'use client';

import { useGetRecruiterDetailById } from '@/hooks/useQuery';
import { useParams, useRouter } from 'next/navigation';
import PageContainer from '@/components/layout/page-container';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import {
  IconArrowLeft,
  IconMapPin,
  IconBriefcase,
  IconCalendar,
  IconGlobe,
  IconMail,
  IconBuilding,
  IconUsers,
  IconStar,
  IconExternalLink
} from '@tabler/icons-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import { DEFAULT_IMAGE } from '@/constants/app.const';
import Image from 'next/image';

export default function RecruiterDetailPage() {
  const params = useParams();
  const router = useRouter();
  const companyId = params.companyId as string;

  // Fetch recruiter details
  const {
    data: recruiterData,
    isLoading,
    isError
  } = useGetRecruiterDetailById(companyId, {
    refetchOnWindowFocus: false
  });

  if (isLoading) {
    return (
      <PageContainer scrollable={true}>
        <div className='flex flex-1 flex-col space-y-4'>
          <div className='animate-pulse space-y-4'>
            <div className='h-8 w-1/4 rounded bg-gray-200'></div>
            <div className='h-px bg-gray-200'></div>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
              <div className='space-y-6 md:col-span-2'>
                <div className='h-64 rounded bg-gray-200'></div>
                <div className='h-32 rounded bg-gray-200'></div>
              </div>
              <div className='space-y-6'>
                <div className='h-48 rounded bg-gray-200'></div>
                <div className='h-32 rounded bg-gray-200'></div>
              </div>
            </div>
          </div>
        </div>
      </PageContainer>
    );
  }

  if (isError || !recruiterData?.data) {
    return (
      <PageContainer scrollable={true}>
        <div className='flex flex-1 flex-col space-y-4'>
          <div className='flex items-center'>
            <Button
              variant='outline'
              size='sm'
              onClick={() => router.back()}
              className='mr-4'
            >
              <IconArrowLeft className='mr-2 h-4 w-4' />
              Back
            </Button>
            <Heading
              title='Recruiter Details'
              description='View recruiter information.'
            />
          </div>
          <Separator />
          <div className='rounded-md bg-red-50 p-4 text-red-500'>
            Failed to load recruiter details. Please try again.
          </div>
        </div>
      </PageContainer>
    );
  }

  const recruiter = recruiterData.data;

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        {/* Header */}
        <div className='flex items-center'>
          <Button
            variant='outline'
            size='sm'
            onClick={() => router.back()}
            className='mr-4'
          >
            <IconArrowLeft className='mr-2 h-4 w-4' />
            Back
          </Button>
          <Heading
            title={recruiter.companyProfile.companyName}
            description='Recruiter company details and information.'
          />
        </div>
        <Separator />

        {/* Company Header Card */}
        <Card>
          <CardContent className='pt-6'>
            <div className='flex flex-col gap-6 md:flex-row'>
              <div className='flex-shrink-0'>
                <Image
                  src={DEFAULT_IMAGE}
                  alt={recruiter.companyProfile.companyName}
                  width={120}
                  height={120}
                  className='rounded-lg object-cover'
                />
              </div>
              <div className='flex-1'>
                <h1 className='mb-2 text-2xl font-bold'>
                  {recruiter.companyProfile.companyName}
                </h1>
                <div className='text-muted-foreground grid grid-cols-1 gap-4 text-sm md:grid-cols-2'>
                  <div className='flex items-center'>
                    <IconBuilding className='mr-2 h-4 w-4' />
                    <span>
                      Company Size: {recruiter.companyProfile.companySize}
                    </span>
                  </div>
                  <div className='flex items-center'>
                    <IconCalendar className='mr-2 h-4 w-4' />
                    <span>
                      Founded:{' '}
                      {format(
                        new Date(recruiter.companyProfile.foundedDate),
                        'MMM yyyy'
                      )}
                    </span>
                  </div>
                  <div className='flex items-center'>
                    <IconMapPin className='mr-2 h-4 w-4' />
                    <span>
                      {recruiter.companyProfile.location?.formattedAddress ||
                        'Location not specified'}
                    </span>
                  </div>
                  <div className='flex items-center'>
                    <IconBriefcase className='mr-2 h-4 w-4' />
                    <span>{recruiter.activeJobs} Active Jobs</span>
                  </div>
                </div>
                <div className='mt-4 flex flex-wrap gap-2'>
                  {recruiter.companyProfile.websiteUrl && (
                    <Button variant='outline' size='sm' asChild>
                      <a
                        href={recruiter.companyProfile.websiteUrl}
                        target='_blank'
                        rel='noopener noreferrer'
                      >
                        <IconGlobe className='mr-2 h-4 w-4' />
                        Website
                        <IconExternalLink className='ml-2 h-4 w-4' />
                      </a>
                    </Button>
                  )}
                  <Button variant='outline' size='sm'>
                    <IconMail className='mr-2 h-4 w-4' />
                    {recruiter.user.email}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          {/* Main content */}
          <div className='space-y-6 md:col-span-2'>
            {/* About Company */}
            {recruiter.aboutCompany?.description && (
              <Card>
                <CardHeader>
                  <CardTitle>About Company</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='whitespace-pre-wrap'>
                    {recruiter.aboutCompany.description}
                  </div>
                  {recruiter.aboutCompany.companyVideo && (
                    <div className='mt-4'>
                      <h4 className='mb-2 text-sm font-medium'>
                        Company Video:
                      </h4>
                      <video
                        controls
                        className='w-full max-w-md rounded-lg'
                        src={recruiter.aboutCompany.companyVideo.url}
                      >
                        Your browser does not support the video tag.
                      </video>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Company Photos */}
            {recruiter.companyPhotos && recruiter.companyPhotos.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Company Photos</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='grid grid-cols-2 gap-4 md:grid-cols-3'>
                    {recruiter.companyPhotos.map((photo, index) => (
                      <div key={photo.s3Key} className='relative aspect-square'>
                        <Image
                          src={photo.url}
                          alt={`Company photo ${index + 1}`}
                          fill
                          className='rounded-lg object-cover'
                        />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Perks and Benefits */}
            {recruiter.perksAndBenefits &&
              recruiter.perksAndBenefits.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Perks & Benefits</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {recruiter.perksAndBenefits.map((perk) => (
                        <div
                          key={perk._id}
                          className='border-primary border-l-4 pl-4'
                        >
                          <h4 className='font-medium'>{perk.benefitName}</h4>
                          <p className='text-muted-foreground text-sm'>
                            {perk.benefitDescription}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Company Achievements */}
            {recruiter.companyAchievements &&
              recruiter.companyAchievements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Company Achievements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {recruiter.companyAchievements.map((achievement) => (
                        <div
                          key={achievement._id}
                          className='flex items-start space-x-4'
                        >
                          <IconStar className='mt-1 h-5 w-5 text-yellow-500' />
                          <div className='flex-1'>
                            <h4 className='font-medium'>{achievement.title}</h4>
                            <p className='text-muted-foreground text-sm'>
                              {achievement.eventOrInstitute}
                            </p>
                            <p className='text-muted-foreground text-sm'>
                              {format(new Date(achievement.date), 'MMM yyyy')}
                            </p>
                            {achievement.detail && (
                              <p className='mt-1 text-sm'>
                                {achievement.detail}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
          </div>

          {/* Sidebar */}
          <div className='space-y-6'>
            {/* Company Details */}
            <Card>
              <CardHeader>
                <CardTitle>Company Details</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <p className='text-sm font-medium'>ABN</p>
                  <p className='text-muted-foreground text-sm'>
                    {recruiter.companyProfile.abn}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium'>Email</p>
                  <p className='text-muted-foreground text-sm'>
                    {recruiter.user.email}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium'>Role</p>
                  <Badge variant='secondary'>{recruiter.user.role}</Badge>
                </div>
                <div>
                  <p className='text-sm font-medium'>Member Since</p>
                  <p className='text-muted-foreground text-sm'>
                    {format(new Date(recruiter.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Social Networks */}
            {recruiter.socialNetworks &&
              recruiter.socialNetworks.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Social Networks</CardTitle>
                  </CardHeader>
                  <CardContent className='space-y-3'>
                    {recruiter.socialNetworks.map((social) => (
                      <div key={social._id}>
                        <Button
                          variant='outline'
                          size='sm'
                          className='w-full'
                          asChild
                        >
                          <a
                            href={social.networkUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                            className='capitalize'
                          >
                            {social.networkName}
                            <IconExternalLink className='ml-2 h-4 w-4' />
                          </a>
                        </Button>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

            {/* Notification Settings */}
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>New Applications</span>
                  <Badge
                    variant={
                      recruiter.emailNotifications.newApplications
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {recruiter.emailNotifications.newApplications
                      ? 'Enabled'
                      : 'Disabled'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Application Updates</span>
                  <Badge
                    variant={
                      recruiter.emailNotifications.applicationUpdates
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {recruiter.emailNotifications.applicationUpdates
                      ? 'Enabled'
                      : 'Disabled'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Marketing Emails</span>
                  <Badge
                    variant={
                      recruiter.emailNotifications.marketingEmails
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {recruiter.emailNotifications.marketingEmails
                      ? 'Enabled'
                      : 'Disabled'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Job Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Job Preferences</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Auto Publish</span>
                  <Badge
                    variant={
                      recruiter.jobPreferences.autoPublish
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {recruiter.jobPreferences.autoPublish
                      ? 'Enabled'
                      : 'Disabled'}
                  </Badge>
                </div>
                <div>
                  <p className='text-sm font-medium'>Default Job Duration</p>
                  <p className='text-muted-foreground text-sm'>
                    {recruiter.jobPreferences.defaultJobDuration} days
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium'>
                    Default Application Deadline
                  </p>
                  <p className='text-muted-foreground text-sm'>
                    {recruiter.jobPreferences.defaultApplicationDeadline} days
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
