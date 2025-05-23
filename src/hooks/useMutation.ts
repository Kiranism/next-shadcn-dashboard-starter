import {
  useMutation,
  UseMutationOptions,
  useQueryClient
} from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  createJobPosting,
  deleteJobById,
  forgetPassword,
  loginUser,
  logoutUser,
  registerCandidate,
  registerRecruiter,
  resetPassword,
  submitContactForm,
  updateCompanyProfile,
  updateJob,
  updateJobAdmin,
  updateJobSeekerProfile,
  updateJobStatus
} from '@/service/mutation';
import { ApiError } from '@/types/common.types';
import {
  ICandidateRegisterRequestDto,
  IContactFormRequestDto,
  IContactFormResponseDto,
  IForgetPasswordRequestDto,
  IForgetPasswordResponseDto,
  ILoginRequestDto,
  IRecruiterRegisterRequestDto,
  IResetPasswordRequestDto,
  IResetPasswordResponseDto,
  ISignInResponseDto,
  ISignUpResponseDto,
  IUpdateCompanyProfileRequestDto,
  IUpdateCompanyProfileResponseDto,
  IUpdateJobAdminRequestDto,
  IUpdateJobAdminResponseDto,
  IUpdateJobSeekerProfileRequestDto,
  IUpdateJobSeekerProfileResponseDto,
  IUpdateJobStatusResponseDto
} from '@/types/mutation.types';

import {
  ICreateJobRequestDto,
  ICreateJobResponseDto
} from '@/types/query.types';

export function useLogin(
  options?: Omit<
    UseMutationOptions<ISignInResponseDto, ApiError, ILoginRequestDto>,
    'mutationFn'
  >
) {
  return useMutation<ISignInResponseDto, ApiError, ILoginRequestDto>({
    mutationFn: loginUser,

    ...options
  });
}

export function useLogout(
  options?: Omit<UseMutationOptions<void, ApiError, void>, 'mutationFn'>
) {
  return useMutation<void, ApiError, void>({
    mutationFn: logoutUser,

    ...options
  });
}

export function useRegisterCandidate(
  options?: Omit<
    UseMutationOptions<
      ISignUpResponseDto,
      ApiError,
      ICandidateRegisterRequestDto
    >,
    'mutationFn'
  >
) {
  return useMutation<
    ISignUpResponseDto,
    ApiError,
    ICandidateRegisterRequestDto
  >({
    mutationFn: registerCandidate,

    ...options
  });
}

export function useRegisterRecruiter(
  options?: Omit<
    UseMutationOptions<
      ISignUpResponseDto,
      ApiError,
      IRecruiterRegisterRequestDto
    >,
    'mutationFn'
  >
) {
  return useMutation<
    ISignUpResponseDto,
    ApiError,
    IRecruiterRegisterRequestDto
  >({
    mutationFn: registerRecruiter,
    ...options
  });
}

export function useForgetPassword(
  options?: Omit<
    UseMutationOptions<
      IForgetPasswordResponseDto,
      ApiError,
      IForgetPasswordRequestDto
    >,
    'mutationFn'
  >
) {
  return useMutation<
    IForgetPasswordResponseDto,
    ApiError,
    IForgetPasswordRequestDto
  >({
    mutationFn: forgetPassword,

    ...options
  });
}

export function useResetPassword(
  options?: Omit<
    UseMutationOptions<
      IResetPasswordResponseDto,
      ApiError,
      IResetPasswordRequestDto
    >,
    'mutationFn'
  >
) {
  return useMutation<
    IResetPasswordResponseDto,
    ApiError,
    IResetPasswordRequestDto
  >({
    mutationFn: resetPassword,

    ...options
  });
}

export function useUpdateJobSeekerProfile(
  options?: Omit<
    UseMutationOptions<
      IUpdateJobSeekerProfileResponseDto,
      ApiError,
      Partial<IUpdateJobSeekerProfileRequestDto>
    >,
    'mutationFn'
  >
) {
  return useMutation<
    IUpdateJobSeekerProfileResponseDto,
    ApiError,
    Partial<IUpdateJobSeekerProfileRequestDto>
  >({
    mutationFn: updateJobSeekerProfile,
    ...options
  });
}

export function useUpdateCompanyProfile(
  options?: Omit<
    UseMutationOptions<
      IUpdateCompanyProfileResponseDto,
      ApiError,
      Partial<IUpdateCompanyProfileRequestDto>
    >,
    'mutationFn'
  >
) {
  return useMutation<
    IUpdateCompanyProfileResponseDto,
    ApiError,
    Partial<IUpdateCompanyProfileRequestDto>
  >({
    mutationFn: updateCompanyProfile,
    ...options
  });
}

export function useJobPosting(
  options?: UseMutationOptions<
    ICreateJobResponseDto,
    ApiError,
    ICreateJobRequestDto
  >
) {
  return useMutation<ICreateJobResponseDto, ApiError, ICreateJobRequestDto>({
    mutationFn: createJobPosting, // Mutation function for creating a job posting
    ...options
  });
}

export function useUpdateJob(
  options?: UseMutationOptions<
    ICreateJobResponseDto,
    ApiError,
    { id: string; data: ICreateJobRequestDto }
  >
) {
  return useMutation<
    ICreateJobResponseDto,
    ApiError,
    { id: string; data: ICreateJobRequestDto }
  >({
    mutationFn: ({ id, data }) => updateJob(id, data), // Call the updateJob service
    ...options
  });
}

export function useDeleteJob(
  options?: Omit<
    UseMutationOptions<{ success: boolean; message: string }, ApiError, string>,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<{ success: boolean; message: string }, ApiError, string>({
    mutationFn: deleteJobById,
    onSuccess: (data) => {
      toast.success(data.message || 'Job deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['get-recruiter-jobs'] }); // Refresh the job list
      queryClient.invalidateQueries({ queryKey: ['get-recent-jobs'] }); // Refresh the job list
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to delete job');
    },
    ...options
  });
}

export function useUpdateJobStatus(
  options?: Omit<
    UseMutationOptions<
      IUpdateJobStatusResponseDto,
      ApiError,
      { jobId: string; isJobActive: boolean }
    >,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    IUpdateJobStatusResponseDto,
    ApiError,
    { jobId: string; isJobActive: boolean }
  >({
    mutationFn: ({ jobId, isJobActive }) => updateJobStatus(jobId, isJobActive), // Call the service with jobId and isJobActive
    onSuccess: (data, variables) => {
      toast.success(data.message || 'Job status updated successfully');
      queryClient.invalidateQueries({
        queryKey: ['get-job-by-id', variables.jobId]
      }); // Refresh the job list
      queryClient.invalidateQueries({ queryKey: ['get-recruiter-jobs'] }); // Refresh the job list
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to update job status'
      );
    },
    ...options
  });
}

export function useContactForm(
  options?: Omit<
    UseMutationOptions<
      IContactFormResponseDto,
      ApiError,
      IContactFormRequestDto
    >,
    'mutationFn'
  >
) {
  return useMutation<IContactFormResponseDto, ApiError, IContactFormRequestDto>(
    {
      mutationFn: submitContactForm,
      onSuccess: (data) => {
        toast.success(data.message || 'Message sent successfully');
      },
      onError: (error) => {
        toast.error(error.response?.data?.message || 'Failed to send message');
        // Log error in development only
        if (process.env.NODE_ENV !== 'production') {
          // eslint-disable-next-line no-console
          console.error('Contact form error:', error);
        }
      },
      ...options
    }
  );
}

export function useUpdateJobAdmin(
  options?: UseMutationOptions<
    IUpdateJobAdminResponseDto,
    ApiError,
    { jobId: string; data: Partial<IUpdateJobAdminRequestDto> }
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    IUpdateJobAdminResponseDto,
    ApiError,
    { jobId: string; data: Partial<IUpdateJobAdminRequestDto> }
  >({
    mutationFn: ({ jobId, data }) => updateJobAdmin(jobId, data),
    onSuccess: (data, variables) => {
      toast.success(data.message || 'Job updated successfully');
      queryClient.invalidateQueries({ queryKey: ['get-all-jobs'] });
      queryClient.invalidateQueries({
        queryKey: ['get-job-by-id', variables.jobId]
      });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to update job');
    },
    ...options
  });
}

export function useToggleJobPremium(
  options?: Omit<
    UseMutationOptions<
      IUpdateJobAdminResponseDto,
      ApiError,
      { jobId: string; isPremium: boolean }
    >,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    IUpdateJobAdminResponseDto,
    ApiError,
    { jobId: string; isPremium: boolean }
  >({
    mutationFn: ({ jobId, isPremium }) => updateJobAdmin(jobId, { isPremium }),
    onSuccess: (data, variables) => {
      toast.success(
        `Job ${variables.isPremium ? 'marked as premium' : 'removed from premium'}`
      );
      queryClient.invalidateQueries({ queryKey: ['get-all-jobs'] });
      queryClient.invalidateQueries({
        queryKey: ['get-job-by-id', variables.jobId]
      });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to update job premium status'
      );
    },
    ...options
  });
}

export function useToggleJobBoosted(
  options?: Omit<
    UseMutationOptions<
      IUpdateJobAdminResponseDto,
      ApiError,
      { jobId: string; isBoosted: boolean }
    >,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    IUpdateJobAdminResponseDto,
    ApiError,
    { jobId: string; isBoosted: boolean }
  >({
    mutationFn: ({ jobId, isBoosted }) => updateJobAdmin(jobId, { isBoosted }),
    onSuccess: (data, variables) => {
      toast.success(
        `Job ${variables.isBoosted ? 'boosted' : 'unboosted'} successfully`
      );
      queryClient.invalidateQueries({ queryKey: ['get-all-jobs'] });
      queryClient.invalidateQueries({
        queryKey: ['get-job-by-id', variables.jobId]
      });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to update job boost status'
      );
    },
    ...options
  });
}

export function useToggleJobDeleted(
  options?: Omit<
    UseMutationOptions<
      IUpdateJobAdminResponseDto,
      ApiError,
      { jobId: string; isDeleted: boolean }
    >,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    IUpdateJobAdminResponseDto,
    ApiError,
    { jobId: string; isDeleted: boolean }
  >({
    mutationFn: ({ jobId, isDeleted }) => updateJobAdmin(jobId, { isDeleted }),
    onSuccess: (data, variables) => {
      toast.success(
        `Job ${variables.isDeleted ? 'marked as deleted' : 'restored'} successfully`
      );
      queryClient.invalidateQueries({ queryKey: ['get-all-jobs'] });
      queryClient.invalidateQueries({
        queryKey: ['get-job-by-id', variables.jobId]
      });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to update job deletion status'
      );
    },
    ...options
  });
}

export function useToggleJobActive(
  options?: Omit<
    UseMutationOptions<
      IUpdateJobAdminResponseDto,
      ApiError,
      { jobId: string; isJobActive: boolean }
    >,
    'mutationFn'
  >
) {
  const queryClient = useQueryClient();

  return useMutation<
    IUpdateJobAdminResponseDto,
    ApiError,
    { jobId: string; isJobActive: boolean }
  >({
    mutationFn: ({ jobId, isJobActive }) =>
      updateJobAdmin(jobId, { isJobActive }),
    onSuccess: (data, variables) => {
      toast.success(
        `Job ${variables.isJobActive ? 'activated' : 'deactivated'} successfully`
      );
      queryClient.invalidateQueries({ queryKey: ['get-all-jobs'] });
      queryClient.invalidateQueries({
        queryKey: ['get-job-by-id', variables.jobId]
      });
      queryClient.invalidateQueries({ queryKey: ['get-recruiter-jobs'] });
    },
    onError: (error) => {
      toast.error(
        error.response?.data?.message || 'Failed to update job active status'
      );
    },
    ...options
  });
}
