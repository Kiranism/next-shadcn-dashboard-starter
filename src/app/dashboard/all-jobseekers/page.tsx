'use client';

import CandidateCard from '@/components/CandidateCard';
import PageContainer from '@/components/layout/page-container';
import { Pagination } from '@/components/Pagination';
import SearchBar from '@/components/SearchBar';
import { Heading } from '@/components/ui/heading';
import { Separator } from '@/components/ui/separator';
import { DataTableSkeleton } from '@/components/ui/table/data-table-skeleton';
import { DEFAULT_IMAGE } from '@/constants/app.const';
import { useGetAllJobSeekers } from '@/hooks/useQuery';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function AllJobSeekersPage() {
  const searchParams = useSearchParams();

  // Get search parameters from URL
  const pageParam = searchParams.get('page');
  const searchQuery = searchParams.get('search');
  const coordinatesParam = searchParams.get('coordinates');

  const [page, setPage] = useState(pageParam ? parseInt(pageParam) : 1);
  const [limit] = useState(6);
  const [search, setSearch] = useState(searchQuery || '');
  const [coordinates, setCoordinates] = useState<[number, number] | undefined>(
    coordinatesParam
      ? (coordinatesParam.split(',').map(Number) as [number, number])
      : undefined
  );

  // Update search parameters when URL changes
  useEffect(() => {
    const newPage = searchParams.get('page');
    const newSearch = searchParams.get('search');
    const newCoordinates = searchParams.get('coordinates');

    if (newPage) setPage(parseInt(newPage));

    // If search param is not in URL, set search to empty string
    // This ensures the search state is cleared when the param is removed
    setSearch(newSearch || '');

    // If coordinates param is not in URL, set coordinates to undefined
    // This ensures the coordinates state is cleared when the param is removed
    setCoordinates(
      newCoordinates
        ? (newCoordinates.split(',').map(Number) as [number, number])
        : undefined
    );
  }, [searchParams]);

  // Create payload with only the required parameters
  const payload: {
    page: number;
    limit: number;
    search?: string;
    coordinates?: [number, number];
    maxDistance?: string;
  } = {
    page,
    limit
  };

  // Only add search parameters if they are actually set
  if (search && search !== '') {
    payload.search = search;
  }

  if (coordinates) {
    payload.coordinates = coordinates;
    payload.maxDistance = '50';
  }

  // Fetch job seekers with search parameters
  const { data, isLoading, isError, refetch } = useGetAllJobSeekers(payload, {
    refetchOnWindowFocus: false
  });

  const jobSeekers = data?.data?.allJobSeekers || [];
  const pagination = data?.data?.pagination;

  const handlePageChange = (newPage: number) => {
    setPage(newPage);

    // Update URL with new page
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    window.history.pushState({}, '', `?${params.toString()}`);
  };

  // Handle search submission
  const handleSearch = (params: {
    search: string;
    coordinates?: [number, number];
  }) => {
    setSearch(params.search || '');
    setCoordinates(params.coordinates);
    setPage(1);
    refetch();
  };

  return (
    <PageContainer scrollable={true}>
      <div className='flex flex-1 flex-col space-y-4'>
        <div className='flex items-start justify-between'>
          <Heading
            title='All Job Seekers'
            description='Browse and manage job seekers.'
          />
        </div>
        <Separator />

        {/* Search Bar */}
        <div className='mb-4'>
          <SearchBar onSearch={handleSearch} />
        </div>

        {isLoading ? (
          <DataTableSkeleton columnCount={5} rowCount={8} filterCount={2} />
        ) : isError ? (
          <div className='rounded-md bg-red-50 p-4 text-red-500'>
            Failed to load job seekers. Please try again.
          </div>
        ) : jobSeekers.length === 0 ? (
          <div className='flex flex-col items-center justify-center py-10'>
            <p className='text-muted-foreground mb-4 text-center'>
              No job seekers found matching your search criteria.
            </p>
          </div>
        ) : (
          <>
            <div className='grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3'>
              {jobSeekers.map((jobSeeker) => (
                <CandidateCard
                  key={jobSeeker._id}
                  candidateImage={
                    jobSeeker.userProfile.profilePicture || DEFAULT_IMAGE
                  }
                  candidateName={`${jobSeeker.userProfile?.firstName || ''} ${
                    jobSeeker.userProfile?.lastName || ''
                  }`}
                  candidateProfessional={jobSeeker.userProfile.designation}
                  candidateLocation={
                    jobSeeker.userProfile?.location?.formattedAddress
                  }
                  candidateDescription={jobSeeker.userProfile.shortBio}
                  link={`/dashboard/profile/${jobSeeker._id}`}
                  isProMember={jobSeeker.userProfile.isProMember}
                />
              ))}
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
