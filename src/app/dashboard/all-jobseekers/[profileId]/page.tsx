'use client';

import { useGetJobSeekerProfileById } from '@/hooks/useQuery';
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
  IconMail,
  IconPhone,
  IconStar,
  IconExternalLink,
  IconDownload,
  IconFileText
} from '@tabler/icons-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DEFAULT_IMAGE } from '@/constants/app.const';
import { UserAdminActions } from '@/components/UserAdminActions';
import Image from 'next/image';

export default function JobSeekerProfileDetailPage() {
  const params = useParams();
  const router = useRouter();
  const profileId = params.profileId as string;

  // Fetch jobseeker profile details
  const {
    data: profileData,
    isLoading,
    isError,
    refetch
  } = useGetJobSeekerProfileById(profileId);

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

  if (isError || !profileData?.data) {
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
              title='JobSeeker Profile'
              description='View jobseeker information.'
            />
          </div>
          <Separator />
          <div className='rounded-md bg-red-50 p-4 text-red-500'>
            Failed to load jobseeker profile. Please try again.
          </div>
        </div>
      </PageContainer>
    );
  }

  const profile = profileData.data;

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
            title={`${profile.userProfile.firstName} ${profile.userProfile.lastName}`}
            description='JobSeeker profile details and information.'
          />
        </div>
        <Separator />

        {/* Profile Header Card */}
        <Card>
          <CardContent className='pt-6'>
            <div className='flex flex-col gap-6 md:flex-row'>
              <div className='flex-shrink-0'>
                <Image
                  src={DEFAULT_IMAGE}
                  alt={`${profile.userProfile.firstName} ${profile.userProfile.lastName}`}
                  width={120}
                  height={120}
                  className='rounded-lg object-cover'
                />
              </div>
              <div className='flex-1'>
                <div className='mb-2 flex items-center gap-3'>
                  <h1 className='text-2xl font-bold'>
                    {profile.userProfile.firstName}{' '}
                    {profile.userProfile.lastName}
                  </h1>
                  <UserAdminActions
                    userId={profile.user._id}
                    userEmail={profile.user.email}
                    isActive={profile.user.isActive}
                    isRestricted={profile.user.isRestricted}
                    onUpdate={() => refetch()}
                    compact={true}
                  />
                </div>
                <div className='text-muted-foreground grid grid-cols-1 gap-4 text-sm md:grid-cols-2'>
                  <div className='flex items-center'>
                    <IconPhone className='mr-2 h-4 w-4' />
                    <span>{profile.userProfile.phoneNo}</span>
                  </div>
                  <div className='flex items-center'>
                    <IconMail className='mr-2 h-4 w-4' />
                    <span>{profile.user.email}</span>
                  </div>
                  <div className='flex items-center'>
                    <IconMapPin className='mr-2 h-4 w-4' />
                    <span>
                      {profile.jobPreferences.location?.formattedAddress ||
                        'Location not specified'}
                    </span>
                  </div>
                  <div className='flex items-center'>
                    <IconBriefcase className='mr-2 h-4 w-4' />
                    <span>{profile.jobPreferences.jobType}</span>
                  </div>
                </div>
                <div className='mt-4'>
                  <p className='text-sm text-gray-600'>
                    {profile.userProfile.shortBio}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className='grid grid-cols-1 gap-6 md:grid-cols-3'>
          {/* Main content */}
          <div className='space-y-6 md:col-span-2'>
            {/* Skills */}
            {profile.skills && profile.skills.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Skills</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='flex flex-wrap gap-2'>
                    {profile.skills.map((skill, index) => (
                      <Badge key={index} variant='secondary'>
                        {skill}
                      </Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Work Experience */}
            {profile.experiences && profile.experiences.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Work Experience</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-6'>
                    {profile.experiences.map((experience) => (
                      <div
                        key={experience._id}
                        className='border-primary border-l-4 pl-4'
                      >
                        <h4 className='font-medium'>
                          {experience.designation}
                        </h4>
                        <p className='text-muted-foreground text-sm'>
                          {experience.organizationName}
                        </p>
                        <p className='text-muted-foreground text-sm'>
                          {format(new Date(experience.startDate), 'MMM yyyy')} -{' '}
                          {experience.isPresent
                            ? 'Present'
                            : experience.endDate
                              ? format(new Date(experience.endDate), 'MMM yyyy')
                              : 'N/A'}
                        </p>
                        <p className='mt-2 text-sm'>{experience.jobDetails}</p>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Education */}
            {profile.academicExperiences &&
              profile.academicExperiences.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle>Education</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className='space-y-4'>
                      {profile.academicExperiences.map((education) => (
                        <div
                          key={education._id}
                          className='border-primary border-l-4 pl-4'
                        >
                          <h4 className='font-medium'>{education.degree}</h4>
                          <p className='text-muted-foreground text-sm'>
                            {education.instituteName}
                          </p>
                          <p className='text-muted-foreground text-sm'>
                            {format(new Date(education.startDate), 'yyyy')}
                            {education.endDate &&
                              ` - ${format(new Date(education.endDate), 'yyyy')}`}
                          </p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

            {/* Certificates */}
            {profile.certificates && profile.certificates.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Certificates</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className='space-y-4'>
                    {profile.certificates.map((certificate) => (
                      <div
                        key={certificate._id}
                        className='flex items-start space-x-4'
                      >
                        <IconStar className='mt-1 h-5 w-5 text-yellow-500' />
                        <div className='flex-1'>
                          <h4 className='font-medium'>
                            {certificate.certificate}
                          </h4>
                          <p className='text-muted-foreground text-sm'>
                            {certificate.instituteName}
                          </p>
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
            {/* Personal Details */}
            <Card>
              <CardHeader>
                <CardTitle>Personal Details</CardTitle>
              </CardHeader>
              <CardContent className='space-y-4'>
                <div>
                  <p className='text-sm font-medium'>Email</p>
                  <p className='text-muted-foreground text-sm'>
                    {profile.user.email}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium'>Phone</p>
                  <p className='text-muted-foreground text-sm'>
                    {profile.userProfile.phoneNo}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium'>Role</p>
                  <Badge variant='secondary'>{profile.user.role}</Badge>
                </div>
                <div>
                  <p className='text-sm font-medium'>Member Since</p>
                  <p className='text-muted-foreground text-sm'>
                    {format(new Date(profile.createdAt), 'MMM dd, yyyy')}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Admin Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Admin Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <UserAdminActions
                  userId={profile.user._id}
                  userEmail={profile.user.email}
                  isActive={profile.user.isActive}
                  isRestricted={profile.user.isRestricted}
                  onUpdate={() => refetch()}
                />
              </CardContent>
            </Card>

            {/* Job Preferences */}
            <Card>
              <CardHeader>
                <CardTitle>Job Preferences</CardTitle>
              </CardHeader>
              <CardContent className='space-y-3'>
                <div>
                  <p className='text-sm font-medium'>Job Type</p>
                  <Badge variant='secondary'>
                    {profile.jobPreferences.jobType}
                  </Badge>
                </div>
                <div>
                  <p className='text-sm font-medium'>Job Categories</p>
                  <div className='mt-1 flex flex-wrap gap-1'>
                    {profile.jobPreferences.jobCategory.map(
                      (category, index) => (
                        <Badge
                          key={index}
                          variant='outline'
                          className='text-xs'
                        >
                          {category}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
                <div>
                  <p className='text-sm font-medium'>Salary Range</p>
                  <p className='text-muted-foreground text-sm'>
                    ${profile.jobPreferences.salaryRangeStart} - $
                    {profile.jobPreferences.salaryRangeEnd}
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* CV Attachments */}
            {profile.cvAttachments && profile.cvAttachments.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>CV Attachments</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {profile.cvAttachments.map((cv, index) => (
                    <div
                      key={index}
                      className='flex items-center justify-between rounded-lg border p-3'
                    >
                      <div className='flex items-center space-x-3'>
                        <IconFileText className='h-5 w-5 text-blue-500' />
                        <div>
                          <p className='text-sm font-medium'>{cv.cvName}</p>
                          <p className='text-muted-foreground text-xs'>
                            {format(new Date(cv.uploadedDate), 'MMM dd, yyyy')}
                          </p>
                          <p className='text-muted-foreground text-xs'>
                            {(cv.fileSize / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <div className='flex items-center space-x-2'>
                        {cv.isActive && (
                          <Badge variant='default' className='text-xs'>
                            Active
                          </Badge>
                        )}
                        <Button variant='outline' size='sm' asChild>
                          <a
                            href={cv.cvUrl}
                            target='_blank'
                            rel='noopener noreferrer'
                          >
                            <IconDownload className='h-4 w-4' />
                          </a>
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Social Networks */}
            {profile.socialNetworks && profile.socialNetworks.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Social Networks</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {profile.socialNetworks.map((social) => (
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
                  <span className='text-sm'>Desktop Notifications</span>
                  <Badge
                    variant={
                      profile.notificationSettings.desktopNotification
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {profile.notificationSettings.desktopNotification
                      ? 'Enabled'
                      : 'Disabled'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Email Notifications</span>
                  <Badge
                    variant={
                      profile.notificationSettings.emailNotification
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {profile.notificationSettings.emailNotification
                      ? 'Enabled'
                      : 'Disabled'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Job Alerts</span>
                  <Badge
                    variant={
                      profile.notificationSettings.jobAlerts
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {profile.notificationSettings.jobAlerts
                      ? 'Enabled'
                      : 'Disabled'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Application Updates</span>
                  <Badge
                    variant={
                      profile.notificationSettings.applicationStatusUpdates
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {profile.notificationSettings.applicationStatusUpdates
                      ? 'Enabled'
                      : 'Disabled'}
                  </Badge>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-sm'>Announcements</span>
                  <Badge
                    variant={
                      profile.notificationSettings.announcementsAndUpdates
                        ? 'default'
                        : 'secondary'
                    }
                  >
                    {profile.notificationSettings.announcementsAndUpdates
                      ? 'Enabled'
                      : 'Disabled'}
                  </Badge>
                </div>
              </CardContent>
            </Card>

            {/* Achievements */}
            {profile.achievements && profile.achievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Achievements</CardTitle>
                </CardHeader>
                <CardContent className='space-y-3'>
                  {profile.achievements.map((achievement) => (
                    <div
                      key={achievement._id}
                      className='flex items-start space-x-4'
                    >
                      <IconStar className='mt-1 h-5 w-5 text-yellow-500' />
                      <div className='flex-1'>
                        <h4 className='font-medium'>{achievement.title}</h4>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  );
}
