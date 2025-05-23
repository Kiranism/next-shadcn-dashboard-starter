import {
  IAuthResponse,
  IForgetPasswordResponse,
  IRegisterResponse,
  IResetPasswordResponse,
  UserRole
} from './common.types';
import {
  ICompany,
  IGetCompanyProfileResponseDto,
  IGetJobSeekerProfileResponseDto,
  IJobData,
  IJobLocation,
  IProfileData
} from './query.types';

export interface ILoginRequestDto {
  email: string;
  password: string;
}

export interface ICandidateRegisterRequestDto {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  role: UserRole.JOBSEEKER;
}

export interface IRecruiterRegisterRequestDto {
  email: string;
  password: string;
  confirmPassword: string;
  companyName: string;
  companyEmail: string;
  role: UserRole.RECRUITER;
  abn?: number;
}

export interface IForgetPasswordRequestDto {
  email: string;
}

export interface IResetPasswordRequestDto {
  userId: string;
  code: string;
  password: string;
  confirmPassword: string;
}
export interface IUpdateCompanyProfileResponseDto {
  success: boolean;
  message: string;
  data: IGetCompanyProfileResponseDto;
}
export interface IUpdateJobSeekerProfileResponseDto {
  success: boolean;
  message: string;
  data: IGetJobSeekerProfileResponseDto;
}
export type IUpdateJobSeekerProfileRequestDto = IProfileData;
export type IUpdateCompanyProfileRequestDto = ICompany;

export type ISignInResponseDto = IAuthResponse;
export type ISignUpResponseDto = IRegisterResponse;
export type IForgetPasswordResponseDto = IForgetPasswordResponse;
export type IResetPasswordResponseDto = IResetPasswordResponse;

export interface IChangePasswordRequestDto {
  currentPassword: string; // The user's current password
  newPassword: string; // The new password the user wants to set
}

export interface IChangePassword {
  currentPassword: string; // The user's current password
  newPassword: string; // The new password the user wants to set
  confirmNewPassword: string;
}

export interface IChangePasswordResponseDto {
  success: boolean; // Indicates if the password change was successful
  message: string; // A message from the server (e.g., "Password changed successfully")
}

export interface IDeactivateAccoutResponseDto {
  success: boolean;
  message: string;
}

export interface ICompanyVideo {
  s3Key: string; // The S3 key of the video
  uploadedAt: string; // The timestamp when the video was uploaded
  url: string; // The URL of the video
}

export interface IUploadCompanyVideoResponseDto {
  success: boolean; // Indicates if the video upload was successful
  message: string; // A message from the server (e.g., "Video uploaded successfully")
  data: ICompanyVideo; // The uploaded video object
}

export interface IDeleteJobResponseDto {
  success: boolean;
  message: string;
}

export interface IUpdateJobStatusResponseDto {
  success: boolean;
  message: string;
  data: IJobData;
}

export interface ICreateJobRequestDto {
  jobTitle: string; // Title of the job
  jobDescription: string; // Description of the job
  applicationDeadline: string; // Deadline for applications (ISO 8601 format)
  jobCategory: string; // Job category (e.g., SOFTWARE_DEVELOPMENT)
  jobType: string; // Job type (e.g., FULL_TIME, PART_TIME)
  jobMode: string; // Job mode (e.g., REMOTE, ONSITE)
  salaryType: string; // Salary type (e.g., MONTHLY, HOURLY)
  salaryRangeStart: number; // Starting salary range
  salaryRangeEnd: number; // Ending salary range
  experienceLevel: string; // Experience level (e.g., YEAR_0_1, YEAR_2_3)
  qualification: string; // Qualification required (e.g., DIPLOMA, BACHELORS)
  careerLevel: string; // Career level (e.g., INTERN, ENTRY_LEVEL)
  location: IJobLocation; // Location details
  keyResponsibilities: string; // Key responsibilities for the job
  skillsAndExperience: string; // Skills and experience required
  skillsTag: string[]; // Array of skill tags (e.g., ["JavaScript", "React"])
  isJobActive?: boolean; // Whether the job is active
  shortlistedApplicantsCount?: number; // Whether the job is active
  applicantsCount?: number; // Whether the job is active
  shortlistedApplicants?: number; // Whether the job is active
  totalApplicants?: number; // Whether the job is active
  isBoosted?: boolean;
  isDeleted?: boolean;
  isPremium?: boolean;
  isSaved?: boolean;
}

export interface IJobApplication {
  job: string;
  jobSeeker: string;
  status: string;
  appliedDate: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface IApplyJobResponseDto {
  success: boolean;
  message: string;
  data: {
    application: IJobApplication;
  };
}

// Saved Job Types
export interface ISavedJobResult {
  jobSeeker: string;
  job: string;
  savedAt: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ISaveJobResponseDto {
  success: boolean;
  message: string;
  data: {
    result: ISavedJobResult;
  };
}

export interface IUnsaveJobResponseDto {
  success: boolean;
  message: string;
}

// Saved Candidate Types
export interface ISavedCandidateResult {
  recruiter: string;
  candidate: string;
  savedAt: string;
  _id: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface ISaveCandidateResponseDto {
  success: boolean;
  message: string;
  data: {
    result: ISavedCandidateResult;
  };
}

export interface IUnsaveCandidateResponseDto {
  success: boolean;
  message: string;
}

// CV Activation Types
export interface IActivateCVRequestDto {
  s3Key: string;
}

export interface IActivateCVResponseDto {
  success: boolean;
  message: string;
}

// Job Application Management Types
export interface IShortlistApplicantResponseDto {
  success: boolean;
  message: string;
  data: {
    application: IJobApplication;
  };
}

export interface IRejectApplicantResponseDto {
  success: boolean;
  message: string;
  data: {
    application: IJobApplication;
  };
}

export interface IDeleteApplicationResponseDto {
  success: boolean;
  message: string;
}

// Portfolio Image Types
export interface IPortfolioImage {
  url: string;
  s3Key: string;
  uploadedAt: string;
}

export interface IDeletePortfolioImageRequestDto {
  s3Key: string;
}

export interface IDeletePortfolioImageResponseDto {
  success: boolean;
  message: string;
  data: {
    portFolioImages: IPortfolioImage[];
  };
}

// Contact Form Types
export interface IContactFormRequestDto {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface IContactFormResponseDto {
  success: boolean;
  message: string;
  data?: {
    cause?: Record<string, unknown>;
    name?: string;
  };
}

// Conversation Types
export interface ICreateConversationRequestDto {
  type: string;
  jobApplicationId?: string;
  jobSeekerProfileId?: string;
}

export interface ICreateConversationResponseDto {
  success: boolean;
  message: string;
  data: {
    _id: string;
    jobApplication?: string;
    recruiterProfileId: string;
    jobSeekerProfileId: string;
    isDirectMessage: boolean;
    createdAt: string;
    updatedAt: string;
    __v: number;
  };
}

// Message Types
export interface IMediaFile {
  url: string;
  s3Key: string;
  fileName: string;
  fileSize: number;
}

export interface ISendMessageRequestDto {
  conversationId: string;
  content: string;
  mediaFiles?: IMediaFile[];
}

export interface ISendMessageResponseDto {
  success: boolean;
  message: string;
  data: {
    _id: string;
    conversationId: string;
    senderId: string;
    senderType: string;
    content: string;
    mediaFiles: IMediaFile[];
    read: boolean;
    createdAt: string;
    updatedAt: string;
  };
}

export interface IDeleteMessageRequestDto {
  messageId: string;
  conversationId?: string; // Optional for backward compatibility
  deleteForEveryone?: boolean;
}

export interface IDeleteMessageResponseDto {
  success: boolean;
  message: string;
}

export interface IDeleteConversationResponseDto {
  success: boolean;
  message: string;
}

export interface IUploadMediaResponseDto {
  success: boolean;
  message: string;
  data: {
    mediaFiles: IMediaFile[];
  };
}

export interface IOCRExtractRequestDto {
  cvUrl: string;
  cvName: string;
  mimeType: string;
  fileSize: number;
  uploadedDate: string;
  s3Key: string;
}

export interface IOCRExtractResponseDto {
  success: boolean;
  message: string;
  data: Record<string, unknown>;
}

export interface ICVAttachment {
  cvUrl: string;
  cvName: string;
  uploadedDate: string;
  s3Key: string;
  mimeType: string;
  fileSize: number;
  isActive: boolean;
}

export interface IUploadCVResponse {
  success: boolean;
  message: string;
  data: {
    cvAttachments: ICVAttachment[];
  };
}

export interface IUpdateJobAdminRequestDto {
  jobTitle: string;
  jobDescription: string;
  applicationDeadline: string;
  jobCategory: string;
  jobType: string;
  jobMode: string;
  salaryType: string;
  salaryRangeStart: number;
  salaryRangeEnd: number;
  experienceLevel: string;
  qualification: string;
  careerLevel: string;
  location: IJobLocation;
  keyResponsibilities: string;
  skillsAndExperience: string;
  skillsTag: string[];
  isJobActive: boolean;
  isPremium: boolean;
  isBoosted: boolean;
  isDeleted: boolean;
}

export interface IUpdateJobAdminResponseDto {
  success: boolean;
  message: string;
  data: IJobData;
}
