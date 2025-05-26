import {
  useInfiniteQuery,
  useQuery,
  UseQueryOptions
} from '@tanstack/react-query';
import {
  getAllEnums,
  getAllJobs,
  getAllJobSeekers,
  getAllCompanies,
  getCompanyProfile,
  getCompanyProfileById,
  getCurrentUser,
  getJobApplicants,
  getJobById,
  getJobSeekerProfile,
  getMyJobApplications,
  getMyShortlistedApplications,
  getProfileById,
  getRecentJobs,
  getRecruitersJobs,
  getSavedCandidates,
  getSavedJobs,
  getShortlistedApplicants,
  getAllApplicants,
  getRecruiterDetailById
} from '@/service/query';
import { ApiError } from '@/types/common.types';
import {
  IGetCompanyProfileResponseDto,
  IGetCurrentUserResponse,
  IGetEnumsResponseDto,
  IGetJobSeekerProfileResponseDto,
  IGetProfileByIdResponseDto,
  ICreateJobResponseDto,
  IGetRecruiterJobResponseDto,
  IGetRecentJobsResponseDto,
  IJobSearchParams,
  IGetAllJobsResponseDto,
  IJobSeekerSearchParams,
  IGetAllJobSeekersResponseDto,
  IGetJobApplicationsResponseDto,
  IGetSavedCandidatesResponseDto,
  IGetJobApplicantsResponseDto,
  IGetAllCompaniesResponseDto,
  IGetSavedJobsResponseDto,
  IShortlistedApplicantsSearchParams,
  IGetShortlistedApplicantsResponseDto,
  IAllApplicantsSearchParams,
  IGetAllApplicantsResponseDto,
  IGetConversationsResponseDto,
  IGetConversationResponseDto,
  IGetMessagesResponseDto,
  IGetRecruiterDetailResponseDto
} from '@/types/query.types';

export function useGetCurrentUser(
  options?: Omit<
    UseQueryOptions<IGetCurrentUserResponse, ApiError, IGetCurrentUserResponse>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetCurrentUserResponse, ApiError>({
    queryKey: ['get-current-user'],
    queryFn: getCurrentUser,
    ...options
  });
}

export function useGetJobSeekerProfile(
  options?: Omit<
    UseQueryOptions<
      IGetJobSeekerProfileResponseDto,
      ApiError,
      IGetJobSeekerProfileResponseDto
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetJobSeekerProfileResponseDto, ApiError>({
    queryKey: ['get-jobseeker-profile'],
    queryFn: getJobSeekerProfile,
    ...options
  });
}
export function useGetCompanyProfile(
  options?: Omit<
    UseQueryOptions<
      IGetCompanyProfileResponseDto,
      ApiError,
      IGetCompanyProfileResponseDto
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetCompanyProfileResponseDto, ApiError>({
    queryKey: ['get-company-profile'],
    queryFn: getCompanyProfile,
    ...options
  });
}

export function useGetAllEnums(
  options?: Omit<
    UseQueryOptions<IGetEnumsResponseDto, ApiError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetEnumsResponseDto, ApiError>({
    queryKey: ['get-all-enums'],
    queryFn: getAllEnums,
    ...options
  });
}

export function useGetJobById(
  id: string,
  options?: Omit<
    UseQueryOptions<ICreateJobResponseDto, ApiError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<ICreateJobResponseDto, ApiError>({
    queryKey: ['get-job-by-id', id], // Include `id` in the queryKey
    queryFn: () => getJobById(id), // Pass `id` to the query function
    ...options
  });
}

export function useGetProfileById(
  id: string,
  options?: Omit<
    UseQueryOptions<IGetProfileByIdResponseDto, ApiError>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetProfileByIdResponseDto, ApiError>({
    queryKey: ['get-profile-by-id', id], // Include `id` in the queryKey
    queryFn: () => getProfileById(id), // Pass `id` to the query function
    ...options
  });
}

export function useGetRecruiterJobs(
  params?: {
    page?: number;
    limit?: number;
  },
  options?: Omit<
    UseQueryOptions<
      IGetRecruiterJobResponseDto,
      ApiError,
      IGetRecruiterJobResponseDto
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetRecruiterJobResponseDto, ApiError>({
    queryKey: ['get-recruiter-jobs', params],
    queryFn: () => getRecruitersJobs(params),
    ...options
  });
}

export function useGetRecentJobs(
  params?: {
    page?: number;
    limit?: number;
  },
  options?: Omit<
    UseQueryOptions<
      IGetRecentJobsResponseDto,
      ApiError,
      IGetRecentJobsResponseDto
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetRecentJobsResponseDto, ApiError>({
    queryKey: ['get-recent-jobs', params],
    queryFn: () => getRecentJobs(params),
    ...options
  });
}

export function useGetAllJobs(
  params?: IJobSearchParams,
  options?: Omit<
    UseQueryOptions<IGetAllJobsResponseDto, ApiError, IGetAllJobsResponseDto>,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetAllJobsResponseDto, ApiError>({
    queryKey: ['get-all-jobs', params],
    queryFn: () => getAllJobs(params),
    ...options
  });
}

export function useGetAllJobSeekers(
  params?: IJobSeekerSearchParams,
  options?: Omit<
    UseQueryOptions<
      IGetAllJobSeekersResponseDto,
      ApiError,
      IGetAllJobSeekersResponseDto
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetAllJobSeekersResponseDto, ApiError>({
    queryKey: ['get-all-jobseekers', params],
    queryFn: () => getAllJobSeekers(params),
    ...options
  });
}

export function useGetMyJobApplications(
  params?: {
    page?: number;
    limit?: number;
  },
  options?: Omit<
    UseQueryOptions<
      IGetJobApplicationsResponseDto,
      ApiError,
      IGetJobApplicationsResponseDto
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetJobApplicationsResponseDto, ApiError>({
    queryKey: ['get-my-job-applications', params],
    queryFn: () => getMyJobApplications(params),
    ...options
  });
}

export function useGetMyShortlistedApplications(
  params?: {
    page?: number;
    limit?: number;
  },
  options?: Omit<
    UseQueryOptions<
      IGetJobApplicationsResponseDto,
      ApiError,
      IGetJobApplicationsResponseDto
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetJobApplicationsResponseDto, ApiError>({
    queryKey: ['get-my-shortlisted-applications', params],
    queryFn: () => getMyShortlistedApplications(params),
    ...options
  });
}

export function useGetSavedCandidates(
  params?: {
    page?: number;
    limit?: number;
  },
  options?: Omit<
    UseQueryOptions<
      IGetSavedCandidatesResponseDto,
      ApiError,
      IGetSavedCandidatesResponseDto
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetSavedCandidatesResponseDto, ApiError>({
    queryKey: ['get-saved-candidates'],
    queryFn: () => getSavedCandidates(params),
    ...options
  });
}

export function useGetJobApplicants(
  jobId: string,
  options?: Omit<
    UseQueryOptions<
      IGetJobApplicantsResponseDto,
      ApiError,
      IGetJobApplicantsResponseDto
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetJobApplicantsResponseDto, ApiError>({
    queryKey: ['get-job-applicants', jobId],
    queryFn: () => getJobApplicants(jobId),
    // enabled: !!jobId,
    ...options
  });
}

export function useGetAllCompanies(
  params?: {
    page?: number;
    limit?: number;
    search?: string;
    coordinates?: [number, number];
    maxDistance?: string;
  },
  options?: Omit<
    UseQueryOptions<
      IGetAllCompaniesResponseDto,
      ApiError,
      IGetAllCompaniesResponseDto
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetAllCompaniesResponseDto, ApiError>({
    queryKey: ['get-all-companies', params],
    queryFn: () => getAllCompanies(params),
    ...options
  });
}
export function useGetSavedJobs(
  params?: {
    page?: number;
    limit?: number;
  },
  options?: Omit<
    UseQueryOptions<
      IGetSavedJobsResponseDto,
      ApiError,
      IGetSavedJobsResponseDto
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetSavedJobsResponseDto, ApiError>({
    queryKey: ['get-saved-jobs', params],
    queryFn: () => getSavedJobs(params),
    ...options
  });
}

export function useGetCompanyProfileById(
  id: string,
  options?: Omit<
    UseQueryOptions<
      IGetCompanyProfileResponseDto,
      ApiError,
      IGetCompanyProfileResponseDto
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetCompanyProfileResponseDto, ApiError>({
    queryKey: ['get-company-profile-by-id', id],
    queryFn: () => getCompanyProfileById(id),
    enabled: !!id,
    ...options
  });
}

export function useGetRecruiterDetailById(
  id: string,
  options?: Omit<
    UseQueryOptions<
      IGetRecruiterDetailResponseDto,
      ApiError,
      IGetRecruiterDetailResponseDto
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetRecruiterDetailResponseDto, ApiError>({
    queryKey: ['get-recruiter-detail-by-id', id],
    queryFn: () => getRecruiterDetailById(id),
    enabled: !!id,
    ...options
  });
}

export function useGetShortlistedApplicants(
  params?: IShortlistedApplicantsSearchParams,
  options?: Omit<
    UseQueryOptions<
      IGetShortlistedApplicantsResponseDto,
      ApiError,
      IGetShortlistedApplicantsResponseDto
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetShortlistedApplicantsResponseDto, ApiError>({
    queryKey: ['get-shortlisted-applicants', params],
    queryFn: () => getShortlistedApplicants(params),
    ...options
  });
}

export function useGetAllApplicants(
  params?: IAllApplicantsSearchParams,
  options?: Omit<
    UseQueryOptions<
      IGetAllApplicantsResponseDto,
      ApiError,
      IGetAllApplicantsResponseDto
    >,
    'queryKey' | 'queryFn'
  >
) {
  return useQuery<IGetAllApplicantsResponseDto, ApiError>({
    queryKey: ['get-all-applicants', params],
    queryFn: () => getAllApplicants(params),
    ...options
  });
}
