import { API_ROUTES } from '@/constants/api.routes';
import axiosInstance from '@/lib/axios';
import {
  IGetCompanyProfileResponseDto,
  IGetCurrentUserResponse,
  IGetEnumsResponseDto,
  IGetJobSeekerProfileResponseDto,
  IGetProfileByIdResponseDto,
  ICreateJobResponseDto,
  IGetRecruiterJobResponseDto,
  IGetRecentJobsResponseDto,
  IGetAllJobsResponseDto,
  IJobSearchParams,
  IJobSeekerSearchParams,
  IGetAllJobSeekersResponseDto,
  IGetSavedJobsResponseDto,
  IGetJobApplicationsResponseDto,
  IGetSavedCandidatesResponseDto,
  IGetJobApplicantsResponseDto,
  IGetAllCompaniesResponseDto,
  IShortlistedApplicantsSearchParams,
  IGetShortlistedApplicantsResponseDto,
  IAllApplicantsSearchParams,
  IGetAllApplicantsResponseDto,
  IGetRecruiterDetailResponseDto,
  IGetJobSeekerProfileDetailResponseDto,
  IGetAdminSettingsResponseDto
} from '@/types/query.types';

export const getCurrentUser = async (): Promise<IGetCurrentUserResponse> => {
  const { data } = await axiosInstance.get<IGetCurrentUserResponse>(
    API_ROUTES.AUTH.GET_CURRENT_USER
  );
  return data;
};

export const getJobSeekerProfile =
  async (): Promise<IGetJobSeekerProfileResponseDto> => {
    const { data } = await axiosInstance.get<IGetJobSeekerProfileResponseDto>(
      API_ROUTES.PROFILE.JOBSEEKER
    );
    return data;
  };
export const getCompanyProfile =
  async (): Promise<IGetCompanyProfileResponseDto> => {
    const { data } = await axiosInstance.get<IGetCompanyProfileResponseDto>(
      API_ROUTES.PROFILE.COMPANY_PROFILE
    );
    return data;
  };
export const getAllEnums = async (): Promise<IGetEnumsResponseDto> => {
  const { data } = await axiosInstance.get(API_ROUTES.DEV.ENUMS);
  return data;
};
export const getJobById = async (
  id: string
): Promise<ICreateJobResponseDto> => {
  const route = API_ROUTES.JOBS.GET_JOB(id); // Use the dynamic route function
  const { data } = await axiosInstance.get<ICreateJobResponseDto>(route);
  return data;
};
export const getProfileById = async (
  id: string
): Promise<IGetProfileByIdResponseDto> => {
  const route = API_ROUTES.PROFILE.GET_PROFILE_BY_ID(id); // Use the dynamic route function
  const { data } = await axiosInstance.get<IGetProfileByIdResponseDto>(route);
  return data;
};

export const getCompanyProfileById = async (
  id: string
): Promise<IGetCompanyProfileResponseDto> => {
  const route = API_ROUTES.PROFILE.GET_COMPANY_PROFILE_BY_ID(id); // Use the dynamic route function
  const { data } =
    await axiosInstance.get<IGetCompanyProfileResponseDto>(route);
  return data;
};

export const getRecruiterDetailById = async (
  id: string
): Promise<IGetRecruiterDetailResponseDto> => {
  const route = API_ROUTES.PROFILE.GET_RECRUITER_DETAIL_BY_ID(id); // Use the dynamic route function
  const { data } =
    await axiosInstance.get<IGetRecruiterDetailResponseDto>(route);
  return data;
};

export const getJobSeekerProfileById = async (
  id: string
): Promise<IGetJobSeekerProfileDetailResponseDto> => {
  const route = API_ROUTES.PROFILE.GET_JOBSEEKER_PROFILE_BY_ID(id); // Use the dynamic route function
  const { data } =
    await axiosInstance.get<IGetJobSeekerProfileDetailResponseDto>(route);
  return data;
};
export const getRecruitersJobs = async (params?: {
  page?: number;
  limit?: number;
}): Promise<IGetRecruiterJobResponseDto> => {
  const axiosParams: Record<string, string | number> = {};

  if (params) {
    if (params.page) axiosParams.page = params.page;
    if (params.limit) axiosParams.limit = params.limit;
  }

  const { data } = await axiosInstance.get<IGetRecruiterJobResponseDto>(
    API_ROUTES.JOBS.GET_RECRUITERS_JOBS,
    {
      params: axiosParams
    }
  );
  return data;
};

export const getRecentJobs = async (params?: {
  page?: number;
  limit?: number;
}): Promise<IGetRecentJobsResponseDto> => {
  const axiosParams: Record<string, string | number> = {};

  if (params) {
    if (params.page) axiosParams.page = params.page;
    if (params.limit) axiosParams.limit = params.limit;
  }

  const { data } = await axiosInstance.get<IGetRecentJobsResponseDto>(
    API_ROUTES.JOBS.GET_RECENT_JOBS,
    {
      params: axiosParams
    }
  );
  return data;
};

export const getAllJobs = async (
  params?: IJobSearchParams
): Promise<IGetAllJobsResponseDto> => {
  // Create a new object for axios params instead of URLSearchParams
  const axiosParams: Record<string, string | number | [number, number]> = {};

  if (params) {
    if (params.search) axiosParams.search = params.search;
    if (params.page) axiosParams.page = params.page;
    if (params.limit) axiosParams.limit = params.limit;

    // Send coordinates as an array directly
    if (params.coordinates && Array.isArray(params.coordinates)) {
      axiosParams.coordinates = params.coordinates;
    }

    if (params.maxDistance) axiosParams.maxDistance = params.maxDistance;
    if (params.jobType) axiosParams.jobType = params.jobType;
    if (params.experienceLevel)
      axiosParams.experienceLevel = params.experienceLevel;
    if (params.qualification) axiosParams.qualification = params.qualification;
    if (params.careerLevel) axiosParams.careerLevel = params.careerLevel;
    if (params.salaryType) axiosParams.salaryType = params.salaryType;
  }

  // Use axios params option to send the parameters
  const { data } = await axiosInstance.get<IGetAllJobsResponseDto>(
    API_ROUTES.JOBS_APPLICATION.ALL_JOBS,
    {
      params: axiosParams,
      // This ensures arrays are serialized correctly
      paramsSerializer: {
        indexes: null // This will serialize arrays as coordinates[]=[lng,lat] instead of coordinates[0]=lng&coordinates[1]=lat
      }
    }
  );
  return data;
};

export const getAllJobSeekers = async (
  params?: IJobSeekerSearchParams
): Promise<IGetAllJobSeekersResponseDto> => {
  // Create a new object for axios params instead of URLSearchParams
  const axiosParams: Record<string, string | number | [number, number]> = {};

  if (params) {
    if (params.search) axiosParams.search = params.search;
    if (params.page) axiosParams.page = params.page;
    if (params.limit) axiosParams.limit = params.limit;

    // Send coordinates as an array directly
    if (params.coordinates && Array.isArray(params.coordinates)) {
      axiosParams.coordinates = params.coordinates;
    }

    if (params.maxDistance) axiosParams.maxDistance = params.maxDistance;
    if (params.jobType) axiosParams.jobType = params.jobType;
    if (params.jobCategory) axiosParams.jobCategory = params.jobCategory;
  }

  // Use axios params option to send the parameters
  const { data } = await axiosInstance.get<IGetAllJobSeekersResponseDto>(
    API_ROUTES.JOBS_APPLICATION.ALL_JOBSEEKERS,
    {
      params: axiosParams,
      // This ensures arrays are serialized correctly
      paramsSerializer: {
        indexes: null // This will serialize arrays as coordinates[]=[lng,lat] instead of coordinates[0]=lng&coordinates[1]=lat
      }
    }
  );
  return data;
};

// Get all saved jobs for the current user
export const getSavedJobs = async (params?: {
  page?: number;
  limit?: number;
}): Promise<IGetSavedJobsResponseDto> => {
  const axiosParams: Record<string, string | number> = {};

  if (params) {
    if (params.page) axiosParams.page = params.page;
    if (params.limit) axiosParams.limit = params.limit;
  }

  const { data } = await axiosInstance.get<IGetSavedJobsResponseDto>(
    API_ROUTES.SAVED_JOBS.GET_SAVED_JOBS,
    {
      params: axiosParams
    }
  );
  return data;
};

// Get all job applications for the current user
export const getMyJobApplications = async (params?: {
  page?: number;
  limit?: number;
}): Promise<IGetJobApplicationsResponseDto> => {
  const axiosParams: Record<string, string | number> = {};

  if (params) {
    if (params.page) axiosParams.page = params.page;
    if (params.limit) axiosParams.limit = params.limit;
  }

  const { data } = await axiosInstance.get<IGetJobApplicationsResponseDto>(
    API_ROUTES.JOBS_APPLICATION.GET_MY_JOB_APPLICATIONS,
    {
      params: axiosParams
    }
  );
  return data;
};

// Get shortlisted job applications for the current user
export const getMyShortlistedApplications = async (params?: {
  page?: number;
  limit?: number;
}): Promise<IGetJobApplicationsResponseDto> => {
  const axiosParams: Record<string, string | number> = {};

  if (params) {
    if (params.page) axiosParams.page = params.page;
    if (params.limit) axiosParams.limit = params.limit;
  }

  const { data } = await axiosInstance.get<IGetJobApplicationsResponseDto>(
    API_ROUTES.JOBS_APPLICATION.GET_MY_SHORTLISTED_APPLICATIONS,
    {
      params: axiosParams
    }
  );
  return data;
};

// Get saved candidates for the current recruiter
export const getSavedCandidates = async (params?: {
  page?: number;
  limit?: number;
}): Promise<IGetSavedCandidatesResponseDto> => {
  const axiosParams: Record<string, string | number> = {};

  if (params) {
    if (params.page) axiosParams.page = params.page;
    if (params.limit) axiosParams.limit = params.limit;
  }

  const { data } = await axiosInstance.get<IGetSavedCandidatesResponseDto>(
    API_ROUTES.SAVED_CANDIDATES.GET_SAVED_CANDIDATES,
    {
      params: axiosParams
    }
  );
  return data;
};

export const getJobApplicants = async (
  jobId: string
): Promise<IGetJobApplicantsResponseDto> => {
  const route = API_ROUTES.JOBS_APPLICATION.GET_JOB_APPLICANTS(jobId);
  const { data } = await axiosInstance.get<IGetJobApplicantsResponseDto>(route);
  return data;
};

// Get all companies with search and location filtering
export const getAllCompanies = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  coordinates?: [number, number];
  maxDistance?: string;
}): Promise<IGetAllCompaniesResponseDto> => {
  const axiosParams: Record<string, string | number | [number, number]> = {};

  if (params) {
    if (params.page) axiosParams.page = params.page;
    if (params.limit) axiosParams.limit = params.limit;
    if (params.search) axiosParams.search = params.search;
    if (params.coordinates) axiosParams.coordinates = params.coordinates;
    if (params.maxDistance) axiosParams.maxDistance = params.maxDistance;
  }

  const { data } = await axiosInstance.get<IGetAllCompaniesResponseDto>(
    API_ROUTES.JOBS_APPLICATION.ALL_COMPANIES,
    {
      params: axiosParams,
      // This ensures arrays are serialized correctly
      paramsSerializer: {
        indexes: null // This will serialize arrays as coordinates=[lng,lat] instead of coordinates[0]=lng&coordinates[1]=lat
      }
    }
  );
  return data;
};

// Get all shortlisted applicants for the current recruiter
export const getShortlistedApplicants = async (
  params?: IShortlistedApplicantsSearchParams
): Promise<IGetShortlistedApplicantsResponseDto> => {
  const axiosParams: Record<string, string | number | [number, number]> = {};

  if (params) {
    if (params.search) axiosParams.search = params.search;
    if (params.page) axiosParams.page = params.page;
    if (params.limit) axiosParams.limit = params.limit;
    if (params.job_category) axiosParams.job_category = params.job_category;

    // Send coordinates as an array directly
    if (params.coordinates && Array.isArray(params.coordinates)) {
      axiosParams.coordinates = params.coordinates;
    }

    if (params.maxDistance) axiosParams.maxDistance = params.maxDistance;
  }

  const { data } =
    await axiosInstance.get<IGetShortlistedApplicantsResponseDto>(
      API_ROUTES.JOBS_APPLICATION.GET_ALL_SHORTLISTED_APPLICANTS,
      {
        params: axiosParams,
        // This ensures arrays are serialized correctly
        paramsSerializer: {
          indexes: null // This will serialize arrays as coordinates[]=[lng,lat] instead of coordinates[0]=lng&coordinates[1]=lat
        }
      }
    );
  return data;
};

// Get all applicants for the current recruiter
export const getAllApplicants = async (
  params?: IAllApplicantsSearchParams
): Promise<IGetAllApplicantsResponseDto> => {
  const axiosParams: Record<string, string | number | [number, number]> = {};

  if (params) {
    if (params.search) axiosParams.search = params.search;
    if (params.page) axiosParams.page = params.page;
    if (params.limit) axiosParams.limit = params.limit;
    if (params.job_category) axiosParams.job_category = params.job_category;

    // Send coordinates as an array directly
    if (params.coordinates && Array.isArray(params.coordinates)) {
      axiosParams.coordinates = params.coordinates;
    }

    if (params.maxDistance) axiosParams.maxDistance = params.maxDistance;
  }

  const { data } = await axiosInstance.get<IGetAllApplicantsResponseDto>(
    API_ROUTES.JOBS_APPLICATION.GET_ALL_APPLICANTS,
    {
      params: axiosParams,
      // This ensures arrays are serialized correctly
      paramsSerializer: {
        indexes: null // This will serialize arrays as coordinates[]=[lng,lat] instead of coordinates[0]=lng&coordinates[1]=lat
      }
    }
  );
  return data;
};

// Get admin settings
export const getAdminSettings =
  async (): Promise<IGetAdminSettingsResponseDto> => {
    const { data } = await axiosInstance.get<IGetAdminSettingsResponseDto>(
      API_ROUTES.ADMIN.SETTINGS
    );
    return data;
  };
