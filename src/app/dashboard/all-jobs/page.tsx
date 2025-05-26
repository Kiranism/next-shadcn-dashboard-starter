'use client';

import PageContainer from '@/components/layout/page-container';
import { Pagination } from '@/components/Pagination';
import SearchBar from '@/components/SearchBar';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { useGetAllJobs, useGetAllEnums } from '@/hooks/useQuery';
import {
  useDeleteJob,
  useToggleJobActive,
  useToggleJobPremium,
  useToggleJobBoosted,
  useToggleJobDeleted
} from '@/hooks/useMutation';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ConfirmModal } from '@/components/ui/confirm-modal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  IconEye,
  IconTrash,
  IconCheck,
  IconX,
  IconStar,
  IconRocket,
  IconTrashOff
} from '@tabler/icons-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger
} from '@/components/ui/tooltip';

export default function AllJobsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Get search parameters from URL
  const pageParam = searchParams.get('page');
  const searchQuery = searchParams.get('search');
  const coordinatesParam = searchParams.get('coordinates');
  const jobTypeParam = searchParams.get('jobType');
  const experienceLevelParam = searchParams.get('experienceLevel');
  const qualificationParam = searchParams.get('qualification');
  const careerLevelParam = searchParams.get('careerLevel');
  const salaryTypeParam = searchParams.get('salaryType');

  // State for pagination and search
  const [page, setPage] = useState(pageParam ? parseInt(pageParam) : 1);
  const [limit] = useState(10);
  const [search, setSearch] = useState(searchQuery || '');
  const [coordinates, setCoordinates] = useState<[number, number] | undefined>(
    coordinatesParam
      ? (coordinatesParam.split(',').map(Number) as [number, number])
      : undefined
  );

  // State for filters
  const [jobType, setJobType] = useState(jobTypeParam || '');
  const [experienceLevel, setExperienceLevel] = useState(
    experienceLevelParam || ''
  );
  const [qualification, setQualification] = useState(qualificationParam || '');
  const [careerLevel, setCareerLevel] = useState(careerLevelParam || '');
  const [salaryType, setSalaryType] = useState(salaryTypeParam || '');

  // Fetch enums for filter options
  const { data: enumsData } = useGetAllEnums({
    refetchOnWindowFocus: false
  });

  // Create payload with all parameters
  const payload = {
    page,
    limit,
    ...(search && search !== '' && { search }),
    ...(coordinates && { coordinates, maxDistance: '50' }),
    ...(jobType && jobType !== 'all' && { jobType }),
    ...(experienceLevel && experienceLevel !== 'all' && { experienceLevel }),
    ...(qualification && qualification !== 'all' && { qualification }),
    ...(careerLevel && careerLevel !== 'all' && { careerLevel }),
    ...(salaryType && salaryType !== 'all' && { salaryType })
  };

  // Fetch jobs with search parameters
  const { data, isLoading, isError } = useGetAllJobs(payload, {
    refetchOnWindowFocus: false
  });

  // Extract jobs and pagination from response
  const jobs = data?.data?.allJobs || [];
  const pagination = data?.data?.pagination;

  // Update search parameters when URL changes (for browser back/forward)
  useEffect(() => {
    const newPage = searchParams.get('page');
    const newSearch = searchParams.get('search');
    const newCoordinates = searchParams.get('coordinates');
    const newJobType = searchParams.get('jobType');
    const newExperienceLevel = searchParams.get('experienceLevel');
    const newQualification = searchParams.get('qualification');
    const newCareerLevel = searchParams.get('careerLevel');
    const newSalaryType = searchParams.get('salaryType');

    if (newPage) setPage(parseInt(newPage));
    setSearch(newSearch || '');
    setCoordinates(
      newCoordinates
        ? (newCoordinates.split(',').map(Number) as [number, number])
        : undefined
    );
    setJobType(newJobType || '');
    setExperienceLevel(newExperienceLevel || '');
    setQualification(newQualification || '');
    setCareerLevel(newCareerLevel || '');
    setSalaryType(newSalaryType || '');
  }, [searchParams]);

  // Update URL when search parameters change
  useEffect(() => {
    const params = new URLSearchParams();

    if (page !== 1) params.set('page', page.toString());
    if (search) params.set('search', search);
    if (coordinates) params.set('coordinates', coordinates.join(','));
    if (jobType) params.set('jobType', jobType);
    if (experienceLevel) params.set('experienceLevel', experienceLevel);
    if (qualification) params.set('qualification', qualification);
    if (careerLevel) params.set('careerLevel', careerLevel);
    if (salaryType) params.set('salaryType', salaryType);

    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : '', { scroll: false });
  }, [
    page,
    search,
    coordinates,
    jobType,
    experienceLevel,
    qualification,
    careerLevel,
    salaryType,
    router
  ]);

  // Handle page change
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  // Handle search submission
  const handleSearch = (params: {
    search: string;
    coordinates?: [number, number];
  }) => {
    setSearch(params.search || '');
    setCoordinates(params.coordinates);
    setPage(1);

    // Update URL with search parameters
    const urlParams = new URLSearchParams();
    urlParams.set('page', '1');

    if (params.search && params.search.trim() !== '') {
      urlParams.set('search', params.search.trim());
    }

    if (params.coordinates) {
      urlParams.set('coordinates', params.coordinates.join(','));
    }

    router.push(`?${urlParams.toString()}`);
  };

  // Handle clear search filters
  const handleClearSearch = () => {
    setSearch('');
    setCoordinates(undefined);
    setPage(1);

    // Update URL to remove search parameters but preserve other filters
    const urlParams = new URLSearchParams();

    // Only set page if it's not 1
    if (page !== 1) urlParams.set('page', '1');

    // Preserve existing filter parameters
    if (jobType && jobType !== 'all') urlParams.set('jobType', jobType);
    if (experienceLevel && experienceLevel !== 'all')
      urlParams.set('experienceLevel', experienceLevel);
    if (qualification && qualification !== 'all')
      urlParams.set('qualification', qualification);
    if (careerLevel && careerLevel !== 'all')
      urlParams.set('careerLevel', careerLevel);
    if (salaryType && salaryType !== 'all')
      urlParams.set('salaryType', salaryType);

    const queryString = urlParams.toString();
    router.push(queryString ? `?${queryString}` : '/dashboard/all-jobs', {
      scroll: false
    });
  };

  // Handle filter changes
  const handleFilterChange = (filter: string, value: string) => {
    setPage(1);

    switch (filter) {
      case 'jobType':
        setJobType(value);
        break;
      case 'experienceLevel':
        setExperienceLevel(value);
        break;
      case 'qualification':
        setQualification(value);
        break;
      case 'careerLevel':
        setCareerLevel(value);
        break;
      case 'salaryType':
        setSalaryType(value);
        break;
      default:
        break;
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setJobType('');
    setExperienceLevel('');
    setQualification('');
    setCareerLevel('');
    setSalaryType('');
    setPage(1);

    // Update URL to remove filter parameters but preserve search parameters
    const urlParams = new URLSearchParams();

    // Only set page if it's not 1
    if (page !== 1) urlParams.set('page', '1');

    // Preserve existing search parameters
    if (search && search.trim() !== '') urlParams.set('search', search.trim());
    if (coordinates) urlParams.set('coordinates', coordinates.join(','));

    const queryString = urlParams.toString();
    router.push(queryString ? `?${queryString}` : '/dashboard/all-jobs', {
      scroll: false
    });
  };

  // Clear all search and filters
  const clearAllSearchAndFilters = () => {
    setSearch('');
    setCoordinates(undefined);
    setJobType('');
    setExperienceLevel('');
    setQualification('');
    setCareerLevel('');
    setSalaryType('');
    setPage(1);

    // Navigate to clean URL
    router.push('/dashboard/all-jobs', { scroll: false });
  };

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
  const toggleJobActiveMutation = useToggleJobActive();

  // const deleteJobMutation = useDeleteJob();

  const toggleJobPremiumMutation = useToggleJobPremium();

  const toggleJobBoostedMutation = useToggleJobBoosted();

  const toggleJobDeletedMutation = useToggleJobDeleted();

  // Handle job status toggle
  const handleToggleJobStatus = (jobId: string, currentStatus: boolean) => {
    setConfirmModal({
      isOpen: true,
      title: currentStatus ? 'Deactivate Job' : 'Activate Job',
      description: currentStatus
        ? 'Are you sure you want to deactivate this job? It will no longer be visible to job seekers.'
        : 'Are you sure you want to activate this job? It will be visible to job seekers.',
      action: () => {
        toggleJobActiveMutation.mutate({
          jobId,
          isJobActive: !currentStatus
        });
      },
      confirmText: currentStatus ? 'Deactivate' : 'Activate',
      confirmVariant: currentStatus ? 'destructive' : 'default'
    });
  };

  // Handle job deletion (permanent)
  // const handleDeleteJob = (jobId: string) => {
  //   setConfirmModal({
  //     isOpen: true,
  //     title: 'Permanently Delete Job',
  //     description:
  //       'Are you sure you want to permanently delete this job? This action cannot be undone.',
  //     action: () => {
  //       deleteJobMutation.mutate(jobId);
  //     },
  //     confirmText: 'Delete Permanently',
  //     confirmVariant: 'destructive'
  //   });
  // };

  // Handle job premium status toggle
  const handleToggleJobPremium = (jobId: string, currentStatus: boolean) => {
    setConfirmModal({
      isOpen: true,
      title: currentStatus ? 'Remove Premium Status' : 'Mark as Premium',
      description: currentStatus
        ? 'Are you sure you want to remove the premium status from this job?'
        : 'Are you sure you want to mark this job as premium?',
      action: () => {
        toggleJobPremiumMutation.mutate({
          jobId,
          isPremium: !currentStatus
        });
      },
      confirmText: currentStatus ? 'Remove Premium' : 'Mark as Premium',
      confirmVariant: 'default'
    });
  };

  // Handle job boosted status toggle
  const handleToggleJobBoosted = (jobId: string, currentStatus: boolean) => {
    setConfirmModal({
      isOpen: true,
      title: currentStatus ? 'Remove Boost' : 'Boost Job',
      description: currentStatus
        ? 'Are you sure you want to remove the boost from this job?'
        : 'Are you sure you want to boost this job?',
      action: () => {
        toggleJobBoostedMutation.mutate({
          jobId,
          isBoosted: !currentStatus
        });
      },
      confirmText: currentStatus ? 'Remove Boost' : 'Boost Job',
      confirmVariant: 'default'
    });
  };

  // Handle job deleted status toggle
  const handleToggleJobDeleted = (jobId: string, currentStatus: boolean) => {
    if (currentStatus) {
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

  // View job details
  const viewJobDetails = (jobId: string) => {
    router.push(`/dashboard/job/${jobId}`);
  };

  return (
    <PageContainer scrollable={true}>
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        onConfirm={confirmModal.action}
        onClose={() => setConfirmModal({ ...confirmModal, isOpen: false })}
        confirmText={confirmModal.confirmText}
        confirmVariant={confirmModal.confirmVariant}
      />
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='All Jobs'
            description='Manage job listings for your platform.'
          />
        </div>
        <Separator />

        {/* Search Bar */}
        <div className='mb-4 space-y-4'>
          <SearchBar
            onSearch={handleSearch}
            onClear={clearAllSearchAndFilters}
            initialSearch={search}
            initialLocation={
              coordinates ? `${coordinates[1]},${coordinates[0]}` : ''
            }
          />
          {(search || coordinates) && (
            <div className='flex justify-center'>
              <Button
                onClick={handleClearSearch}
                variant='outline'
                className='px-6'
              >
                Clear Search Filters
              </Button>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className='mb-4 flex flex-wrap gap-2'>
          {/* Job Type Filter */}
          <Select
            value={jobType}
            onValueChange={(value) => handleFilterChange('jobType', value)}
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Job Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Job Types</SelectItem>
              {enumsData?.data?.JOB_TYPE_ENUM &&
                Object.entries(enumsData.data.JOB_TYPE_ENUM).map(
                  ([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value as string}
                    </SelectItem>
                  )
                )}
            </SelectContent>
          </Select>

          {/* Experience Level Filter */}
          <Select
            value={experienceLevel}
            onValueChange={(value) =>
              handleFilterChange('experienceLevel', value)
            }
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Experience Level' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Experience Levels</SelectItem>
              {enumsData?.data?.EXPERIENCE_RANGE_ENUM &&
                Object.entries(enumsData.data.EXPERIENCE_RANGE_ENUM).map(
                  ([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value as string}
                    </SelectItem>
                  )
                )}
            </SelectContent>
          </Select>

          {/* Qualification Filter */}
          <Select
            value={qualification}
            onValueChange={(value) =>
              handleFilterChange('qualification', value)
            }
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Qualification' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Qualifications</SelectItem>
              {enumsData?.data?.QUALIFICATION_ENUM &&
                Object.entries(enumsData.data.QUALIFICATION_ENUM).map(
                  ([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value as string}
                    </SelectItem>
                  )
                )}
            </SelectContent>
          </Select>

          {/* Career Level Filter */}
          <Select
            value={careerLevel}
            onValueChange={(value) => handleFilterChange('careerLevel', value)}
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Career Level' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Career Levels</SelectItem>
              {enumsData?.data?.CAREER_LEVEL_ENUM &&
                Object.entries(enumsData.data.CAREER_LEVEL_ENUM).map(
                  ([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value as string}
                    </SelectItem>
                  )
                )}
            </SelectContent>
          </Select>

          {/* Salary Type Filter */}
          <Select
            value={salaryType}
            onValueChange={(value) => handleFilterChange('salaryType', value)}
          >
            <SelectTrigger className='w-[180px]'>
              <SelectValue placeholder='Salary Type' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All Salary Types</SelectItem>
              {enumsData?.data?.SALARY_TYPE_ENUM &&
                Object.entries(enumsData.data.SALARY_TYPE_ENUM).map(
                  ([key, value]) => (
                    <SelectItem key={key} value={key}>
                      {value as string}
                    </SelectItem>
                  )
                )}
            </SelectContent>
          </Select>

          {/* Clear Filters Button */}
          {(jobType ||
            experienceLevel ||
            qualification ||
            careerLevel ||
            salaryType) && (
            <Button variant='outline' onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>

        {isLoading ? (
          <DataTableSkeleton columnCount={6} rowCount={10} filterCount={5} />
        ) : isError ? (
          <div className='rounded-md bg-red-50 p-4 text-red-500'>
            Failed to load jobs. Please try again.
          </div>
        ) : jobs.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-10'>
            <p className='text-muted-foreground mb-4 text-center'>
              No jobs found matching your search criteria.
            </p>
          </div>
        ) : (
          <>
            <div className='rounded-md border'>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Job Title</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className='text-right'>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {jobs.map((job) => (
                    <TableRow
                      key={job._id}
                      className={job.isDeleted ? 'bg-red-50' : ''}
                    >
                      <TableCell className='font-medium'>
                        {job.jobTitle}
                        {job.isDeleted && (
                          <Badge
                            variant='outline'
                            className='ml-2 border-red-200 text-red-500'
                          >
                            Deleted
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {job.recruiterProfile.companyProfile.companyName}
                      </TableCell>
                      <TableCell>
                        {enumsData?.data?.JOB_CATEGORIES_ENUM?.[
                          job.jobCategory as keyof typeof enumsData.data.JOB_CATEGORIES_ENUM
                        ] || job.jobCategory}
                      </TableCell>
                      <TableCell>
                        {enumsData?.data?.JOB_TYPE_ENUM?.[
                          job.jobType as keyof typeof enumsData.data.JOB_TYPE_ENUM
                        ] || job.jobType}
                      </TableCell>
                      <TableCell>
                        <div className='flex flex-col gap-1'>
                          <Badge
                            variant={
                              job.isJobActive ? 'default' : 'destructive'
                            }
                          >
                            {job.isJobActive ? 'Active' : 'Inactive'}
                          </Badge>

                          {job.isPremium === true && (
                            <Badge
                              variant='outline'
                              className='border-yellow-200 text-yellow-600'
                            >
                              Premium
                            </Badge>
                          )}

                          {job.isBoosted === true && (
                            <Badge
                              variant='outline'
                              className='border-blue-200 text-blue-600'
                            >
                              Boosted
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className='text-right'>
                        <div className='flex justify-end gap-2'>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='outline'
                                size='sm'
                                onClick={() => viewJobDetails(job._id)}
                              >
                                <IconEye className='h-4 w-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>View job details</TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={
                                  job.isJobActive ? 'destructive' : 'default'
                                }
                                size='sm'
                                onClick={() =>
                                  handleToggleJobStatus(
                                    job._id,
                                    job.isJobActive
                                  )
                                }
                              >
                                {job.isJobActive ? (
                                  <IconX className='h-4 w-4' />
                                ) : (
                                  <IconCheck className='h-4 w-4' />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {job.isJobActive
                                ? 'Deactivate job'
                                : 'Activate job'}
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={
                                  job.isPremium === true ? 'default' : 'outline'
                                }
                                size='sm'
                                className={
                                  job.isPremium === true
                                    ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                    : ''
                                }
                                onClick={() =>
                                  handleToggleJobPremium(
                                    job._id,
                                    job.isPremium === true
                                  )
                                }
                              >
                                <IconStar className='h-4 w-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {job.isPremium === true
                                ? 'Remove premium status'
                                : 'Mark as premium'}
                            </TooltipContent>
                          </Tooltip>

                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant={
                                  job.isBoosted === true ? 'default' : 'outline'
                                }
                                size='sm'
                                className={
                                  job.isBoosted === true
                                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                    : ''
                                }
                                onClick={() =>
                                  handleToggleJobBoosted(
                                    job._id,
                                    job.isBoosted === true
                                  )
                                }
                              >
                                <IconRocket className='h-4 w-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              {job.isBoosted === true
                                ? 'Remove boosted status'
                                : 'Boost job'}
                            </TooltipContent>
                          </Tooltip>

                          {job.isDeleted === true ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  className='border-green-200 text-green-600 hover:bg-green-50'
                                  onClick={() =>
                                    handleToggleJobDeleted(job._id, true)
                                  }
                                >
                                  <IconTrashOff className='h-4 w-4' />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Restore job</TooltipContent>
                            </Tooltip>
                          ) : (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant='outline'
                                  size='sm'
                                  className='border-red-200 text-red-600 hover:bg-red-50'
                                  onClick={() =>
                                    handleToggleJobDeleted(job._id, false)
                                  }
                                >
                                  <IconTrash className='h-4 w-4' />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>Mark as deleted</TooltipContent>
                            </Tooltip>
                          )}

                          {/* <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant='destructive'
                                size='sm'
                                onClick={() => handleDeleteJob(job._id)}
                              >
                                <IconTrash className='h-4 w-4' />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>Permanently delete</TooltipContent>
                          </Tooltip> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {pagination && (
              <div className='mt-6 flex justify-center'>
                <Pagination
                  currentPage={pagination.currentPage}
                  totalPages={pagination.pages}
                  onPageChange={handlePageChange}
                />
              </div>
            )}
          </>
        )}
      </div>
    </PageContainer>
  );
}
