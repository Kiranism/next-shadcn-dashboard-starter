import { API_ROUTES } from '@/constants/api.routes';
import axiosInstance from '@/lib/axios';
import {
  IActivateCVRequestDto,
  IActivateCVResponseDto,
  IApplyJobResponseDto,
  ICandidateRegisterRequestDto,
  IChangePasswordRequestDto,
  IChangePasswordResponseDto,
  IContactFormRequestDto,
  IContactFormResponseDto,
  ICreateConversationRequestDto,
  ICreateConversationResponseDto,
  IDeactivateAccoutResponseDto,
  IDeleteApplicationResponseDto,
  IDeleteConversationResponseDto,
  IDeleteMessageRequestDto,
  IDeleteMessageResponseDto,
  IDeletePortfolioImageResponseDto,
  IForgetPasswordRequestDto,
  IForgetPasswordResponseDto,
  ILoginRequestDto,
  IRecruiterRegisterRequestDto,
  IRejectApplicantResponseDto,
  IResetPasswordRequestDto,
  IResetPasswordResponseDto,
  ISaveCandidateResponseDto,
  ISaveJobResponseDto,
  ISendMessageRequestDto,
  ISendMessageResponseDto,
  IShortlistApplicantResponseDto,
  ISignInResponseDto,
  ISignUpResponseDto,
  IUnsaveCandidateResponseDto,
  IUnsaveJobResponseDto,
  IUpdateCompanyProfileRequestDto,
  IUpdateCompanyProfileResponseDto,
  IUpdateJobAdminRequestDto,
  IUpdateJobAdminResponseDto,
  IUpdateJobSeekerProfileRequestDto,
  IUpdateJobSeekerProfileResponseDto,
  IUpdateJobStatusResponseDto,
  IUpdateUserAdminRequestDto,
  IUpdateUserAdminResponseDto,
  IUploadMediaResponseDto,
  IOCRExtractRequestDto,
  IOCRExtractResponseDto
} from '@/types/mutation.types';
import {
  ICreateJobRequestDto,
  ICreateJobResponseDto,
  ICvAttachment
} from '@/types/query.types';

export const loginUser = async (
  data: ILoginRequestDto
): Promise<ISignInResponseDto> => {
  const { data: response } = await axiosInstance.post<ISignInResponseDto>(
    API_ROUTES.AUTH.LOGIN,
    data
  );
  return response;
};

export const logoutUser = async (): Promise<void> => {
  await axiosInstance.post(API_ROUTES.AUTH.LOGOUT);
};

export const registerCandidate = async (
  data: ICandidateRegisterRequestDto
): Promise<ISignUpResponseDto> => {
  const { data: response } = await axiosInstance.post<ISignUpResponseDto>(
    API_ROUTES.AUTH.REGISTER,
    data
  );
  return response;
};

export const registerRecruiter = async (
  data: IRecruiterRegisterRequestDto
): Promise<ISignUpResponseDto> => {
  const { data: response } = await axiosInstance.post<ISignUpResponseDto>(
    API_ROUTES.AUTH.REGISTER,
    data
  );
  return response;
};

export const forgetPassword = async (
  data: IForgetPasswordRequestDto
): Promise<IForgetPasswordResponseDto> => {
  const { data: response } =
    await axiosInstance.post<IForgetPasswordResponseDto>(
      API_ROUTES.AUTH.FORGET_PASSWORD,
      data
    );
  return response;
};

export const resetPassword = async (
  data: IResetPasswordRequestDto
): Promise<IResetPasswordResponseDto> => {
  const { data: response } =
    await axiosInstance.post<IResetPasswordResponseDto>(
      API_ROUTES.AUTH.RESET_PASSWORD,
      data
    );
  return response;
};

export const changePassword = async (
  data: IChangePasswordRequestDto
): Promise<IChangePasswordResponseDto> => {
  const { data: response } =
    await axiosInstance.post<IChangePasswordResponseDto>(
      API_ROUTES.AUTH.CHANGE_PASSWORD,
      data
    );
  return response;
};

export const deactivateAccount = async (
  data: IDeactivateAccoutResponseDto
): Promise<IDeactivateAccoutResponseDto> => {
  const { data: response } =
    await axiosInstance.post<IDeactivateAccoutResponseDto>(
      API_ROUTES.PROFILE.DEACTIVATE_PROFILE,
      data
    );
  return response;
};

export const updateJobSeekerProfile = async (
  data: Partial<IUpdateJobSeekerProfileRequestDto>
): Promise<IUpdateJobSeekerProfileResponseDto> => {
  const { data: response } =
    await axiosInstance.put<IUpdateJobSeekerProfileResponseDto>(
      API_ROUTES.PROFILE.JOBSEEKER,
      data
    );
  return response;
};

export const deleteCV = async ({
  s3Key
}: {
  s3Key: string;
}): Promise<{
  success: boolean;
  message: string;
  data: Record<string, ICvAttachment>;
}> => {
  const { data: response } = await axiosInstance.delete(
    API_ROUTES.PROFILE.DELETE_CV,
    {
      data: {
        s3Key // Pass the s3Key in the request body for deletion
      }
    }
  );
  return response;
};

export const deleteVideo = async ({
  s3Key
}: {
  s3Key: string;
}): Promise<{
  success: boolean;
  message: string;
  data: Record<string, ICvAttachment>;
}> => {
  const { data: response } = await axiosInstance.delete(
    API_ROUTES.PROFILE.DELETE_VIDEO,
    {
      data: {
        s3Key // Pass the s3Key in the request body for deletion
      }
    }
  );
  return response;
};

export const deletePhoto = async ({
  s3Key
}: {
  s3Key: string;
}): Promise<{ success: boolean; message: string }> => {
  const { data: response } = await axiosInstance.delete(
    API_ROUTES.PROFILE.DELETE_PHOTO,
    {
      data: {
        s3Key // Pass the s3Key in the request body for deletion
      }
    }
  );
  return response;
};

export const updateCompanyProfile = async (
  data: Partial<IUpdateCompanyProfileRequestDto>
): Promise<IUpdateCompanyProfileResponseDto> => {
  const { data: response } =
    await axiosInstance.put<IUpdateCompanyProfileResponseDto>(
      API_ROUTES.PROFILE.COMPANY_PROFILE,
      data
    );
  return response;
};

export const createJobPosting = async (
  data: ICreateJobRequestDto
): Promise<ICreateJobResponseDto> => {
  const { data: response } = await axiosInstance.post<ICreateJobResponseDto>(
    API_ROUTES.JOBS.CREATE_JOB_POSTING, // Use the route for creating a job
    data
  );
  return response;
};

export const updateJob = async (
  id: string,
  data: ICreateJobRequestDto
): Promise<ICreateJobResponseDto> => {
  const route = API_ROUTES.JOBS.UPDATE_JOB(id); // Use the dynamic route for updating a job
  const { data: response } = await axiosInstance.put<ICreateJobResponseDto>(
    route,
    data
  );
  return response;
};

export const deleteJobById = async (
  jobId: string
): Promise<{ success: boolean; message: string }> => {
  const { data } = await axiosInstance.delete(
    API_ROUTES.JOBS.DELETE_JOB(jobId)
  ); // Use the dynamic route for deleting a job
  return data;
};

export const updateJobStatus = async (
  jobId: string,
  isJobActive: boolean
): Promise<IUpdateJobStatusResponseDto> => {
  const { data } = await axiosInstance.patch(
    API_ROUTES.JOBS.UPDATE_JOB_STATUS(jobId),
    {
      isJobActive
    }
  );
  return data;
};

export const applyForJob = async (
  jobId: string
): Promise<IApplyJobResponseDto> => {
  const { data } = await axiosInstance.post<IApplyJobResponseDto>(
    API_ROUTES.JOBS_APPLICATION.APPLY_JOB(jobId)
  );
  return data;
};

// Save a job for the current user
export const saveJob = async (jobId: string): Promise<ISaveJobResponseDto> => {
  const { data } = await axiosInstance.post<ISaveJobResponseDto>(
    API_ROUTES.SAVED_JOBS.SAVE_JOB(jobId)
  );
  return data;
};

// Unsave a job for the current user
export const unsaveJob = async (
  jobId: string
): Promise<IUnsaveJobResponseDto> => {
  const { data } = await axiosInstance.delete<IUnsaveJobResponseDto>(
    API_ROUTES.SAVED_JOBS.SAVE_JOB(jobId)
  );
  return data;
};

// Save a candidate for the current recruiter
export const saveCandidate = async (
  candidateId: string
): Promise<ISaveCandidateResponseDto> => {
  const { data } = await axiosInstance.post<ISaveCandidateResponseDto>(
    API_ROUTES.SAVED_CANDIDATES.SAVE_CANDIDATE(candidateId)
  );
  return data;
};

// Unsave a candidate for the current recruiter
export const unsaveCandidate = async (
  candidateId: string
): Promise<IUnsaveCandidateResponseDto> => {
  const { data } = await axiosInstance.delete<IUnsaveCandidateResponseDto>(
    API_ROUTES.SAVED_CANDIDATES.SAVE_CANDIDATE(candidateId)
  );
  return data;
};

// Shortlist a job applicant
export const shortlistApplicant = async (
  applicationId: string
): Promise<IShortlistApplicantResponseDto> => {
  const { data } = await axiosInstance.patch<IShortlistApplicantResponseDto>(
    API_ROUTES.JOBS_APPLICATION.SHORTLIST_APPLICANT(applicationId)
  );
  return data;
};

// Reject a job applicant
export const rejectApplicant = async (
  applicationId: string
): Promise<IRejectApplicantResponseDto> => {
  const { data } = await axiosInstance.patch<IRejectApplicantResponseDto>(
    API_ROUTES.JOBS_APPLICATION.REJECT_APPLICANT(applicationId)
  );
  return data;
};

// Delete a job application
export const deleteApplication = async (
  applicationId: string
): Promise<IDeleteApplicationResponseDto> => {
  const { data } = await axiosInstance.delete<IDeleteApplicationResponseDto>(
    API_ROUTES.JOBS_APPLICATION.DELETE_APPLICATION(applicationId)
  );
  return data;
};

// Activate CV
export const activateCV = async ({
  s3Key
}: IActivateCVRequestDto): Promise<IActivateCVResponseDto> => {
  const { data } = await axiosInstance.patch<IActivateCVResponseDto>(
    API_ROUTES.AUTH.CV_ACTIVATION,
    { s3Key }
  );
  return data;
};

// Delete portfolio image
export const deletePortfolioImage = async ({
  s3Key
}: {
  s3Key: string;
}): Promise<IDeletePortfolioImageResponseDto> => {
  const { data } = await axiosInstance.delete<IDeletePortfolioImageResponseDto>(
    API_ROUTES.PROFILE.DELETE_PORTFOLIO_IMAGE,
    {
      data: {
        s3Key // Pass the s3Key in the request body for deletion
      }
    }
  );
  return data;
};

// Submit contact form
export const submitContactForm = async (
  formData: IContactFormRequestDto
): Promise<IContactFormResponseDto> => {
  const { data } = await axiosInstance.post<IContactFormResponseDto>(
    API_ROUTES.MISC.CONTACT,
    formData
  );
  return data;
};

// Create a new conversation
export const createConversation = async (
  conversationData: ICreateConversationRequestDto
): Promise<ICreateConversationResponseDto> => {
  const { data } = await axiosInstance.post<ICreateConversationResponseDto>(
    API_ROUTES.CONVERSATIONS.BASE,
    conversationData
  );
  return data;
};

// Delete a conversation
export const deleteConversation = async (
  conversationId: string
): Promise<IDeleteConversationResponseDto> => {
  const { data } = await axiosInstance.delete<IDeleteConversationResponseDto>(
    API_ROUTES.CONVERSATIONS.DELETE_CONVERSATION(conversationId)
  );
  return data;
};

// Send a message
export const sendMessage = async (
  messageData: ISendMessageRequestDto
): Promise<ISendMessageResponseDto> => {
  const { data } = await axiosInstance.post<ISendMessageResponseDto>(
    API_ROUTES.MESSAGES.BASE,
    messageData
  );
  return data;
};

// Delete a message
export const deleteMessage = async ({
  messageId,
  deleteForEveryone
}: IDeleteMessageRequestDto): Promise<IDeleteMessageResponseDto> => {
  const { data } = await axiosInstance.delete<IDeleteMessageResponseDto>(
    API_ROUTES.MESSAGES.DELETE_MESSAGE(messageId),
    {
      data: {
        deleteForEveryone
      }
    }
  );
  return data;
};

// Upload media for chat
export const uploadMediaForChat = async (
  formData: FormData,
  onProgress?: (progress: number) => void
): Promise<IUploadMediaResponseDto> => {
  const { data } = await axiosInstance.post<IUploadMediaResponseDto>(
    API_ROUTES.UPLOAD.MEDIA_CHAT,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data'
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          // Calculate the progress percentage
          const progress = Math.round(
            (progressEvent.loaded * 100) / progressEvent.total
          );
          onProgress(progress);
        }
      }
    }
  );
  return data;
};

// Extract CV details using OCR
export const extractCVDetails = async (
  data: IOCRExtractRequestDto
): Promise<IOCRExtractResponseDto> => {
  const { data: response } = await axiosInstance.post<IOCRExtractResponseDto>(
    API_ROUTES.OCR.EXTRACT,
    data
  );
  return response;
};

// Update job with admin privileges
export const updateJobAdmin = async (
  jobId: string,
  data: Partial<IUpdateJobAdminRequestDto>
): Promise<IUpdateJobAdminResponseDto> => {
  const { data: response } =
    await axiosInstance.put<IUpdateJobAdminResponseDto>(
      API_ROUTES.ADMIN.UPDATE_JOB(jobId),
      data
    );
  return response;
};

// Update user with admin privileges
export const updateUserAdmin = async (
  userId: string,
  data: IUpdateUserAdminRequestDto
): Promise<IUpdateUserAdminResponseDto> => {
  const { data: response } =
    await axiosInstance.put<IUpdateUserAdminResponseDto>(
      API_ROUTES.ADMIN.UPDATE_USER(userId),
      data
    );
  return response;
};
