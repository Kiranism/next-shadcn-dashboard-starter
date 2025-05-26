import { IUser, UserRole } from './common.types';

// Job Application Types
export interface IJobApplication {
  _id: string;
  job: {
    _id: string;
    recruiterProfile: {
      _id: string;
      companyProfile: {
        companyName: string;
        profilePicture: string;
        foundedDate: string;
        companySize: string;
        websiteUrl: string;
        abn: string;
        location: Ilocation;
      };
    };
    jobTitle: string;
    isBoosted: boolean;
    isPremium: boolean;
    isSaved: boolean;
    applicationDeadline: string;
    jobCategory: string;
    jobType: string;
    jobMode: string;
    salaryType: string;
    salaryRangeStart: number;
    salaryRangeEnd: number;
    location: Ilocation;
  } | null;
  jobSeeker: string;
  status: 'PENDING' | 'SHORTLISTED' | 'REJECTED';
  appliedDate: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface IGetJobApplicationsResponseDto {
  success: boolean;
  message: string;
  data: {
    applications: IJobApplication[];
    pagination: IPagination;
  };
}

// Saved Job Types
export interface ISavedJob {
  _id: string;
  jobSeeker: string;
  job: IAllJob;
  savedAt: string;
  createdAt: string;
  updatedAt: string;
  alreadyApplied: boolean;
  __v: number;
}

export interface IGetSavedJobsResponseDto {
  success: boolean;
  message: string;
  data: {
    savedJobs: ISavedJob[];
    pagination: IPagination;
  };
}

// Saved Candidate Types
export interface ISavedCandidate {
  _id: string;
  recruiter: string;
  candidate: {
    _id: string;
    userId: {
      _id: string;
      email: string;
      isActive: boolean;
      isProMember?: boolean;
    };
    userProfile: {
      firstName: string;
      lastName: string;
      phoneNo?: string;
      dob?: string;
      location?: Ilocation;
      websiteUrl?: string;
      portfolioUrl?: string;
      shortBio?: string;
      profilePicture?: string;
      designation?: string;
    };
  };
  savedAt: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface IGetSavedCandidatesResponseDto {
  success: boolean;
  message: string;
  data: {
    savedCandidates: ISavedCandidate[];
    pagination: IPagination;
  };
}

// Type for Job Applicant
export interface IJobApplicant {
  _id: string;
  job: {
    jobTitle: string;
    applicationDeadline: string;
    jobCategory: string;
    jobType: string;
    jobMode: string;
    salaryType: string;
    salaryRangeStart: number;
    salaryRangeEnd: number;
    location: IJobLocation;
  };
  jobSeeker: {
    _id: string;
    userProfile: {
      firstName: string;
      lastName: string;
      phoneNo: string;
      dob: string;
      location: IJobLocation;
      websiteUrl: string;
      portfolioUrl: string;
      shortBio: string;
      profilePicture: string;
    };
    cvAttachments: {
      cvUrl: string;
      cvName: string;
      uploadedDate: string;
      s3Key: string;
      isActive: boolean;
    };
  };
  status: string;
  appliedDate: string;
}

// Type for Get Job Applicants Response
export interface IGetJobApplicantsResponseDto {
  success: boolean;
  message: string;
  data: {
    applications: IJobApplicant[];
  };
}

// Shortlisted Applicants Types
export interface IShortlistedApplicant {
  _id: string;
  job: {
    _id: string;
    recruiterProfile: string;
    jobTitle: string;
    jobCategory: string;
  };
  jobSeeker: {
    _id: string;
    cvAttachments: {
      cvUrl: string;
      cvName: string;
      uploadedDate: string;
      s3Key: string;
      isActive: boolean;
    }[];
    userProfile: {
      firstName: string;
      lastName: string;
      phoneNo: string;
      dob: string;
      location: Ilocation;
      websiteUrl: string;
      portfolioUrl: string;
      shortBio: string;
      profilePicture: string;
    };
  };
  status: string;
  appliedDate: string;
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface IShortlistedApplicantsSearchParams {
  search?: string;
  coordinates?: [number, number];
  maxDistance?: string;
  page?: number;
  limit?: number;
  job_category?: string;
}

export interface IGetShortlistedApplicantsResponseDto {
  success: boolean;
  message: string;
  data: {
    applications: IShortlistedApplicant[];
    pagination: IPagination;
  };
}

export interface IAllApplicantsSearchParams {
  search?: string;
  coordinates?: [number, number];
  maxDistance?: string;
  page?: number;
  limit?: number;
  job_category?: string;
}

export interface IGetAllApplicantsResponseDto {
  success: boolean;
  message: string;
  data: {
    applications: IShortlistedApplicant[];
    pagination: IPagination;
  };
}

export interface IGetCurrentUserResponse {
  success: boolean;
  message: string;
  data: CurrentCompanyType | CurrentJobSeekerType;
}

export interface IGetJobSeekerProfileResponseDto {
  success: boolean;
  message: string;
  data: IProfileData;
}

export interface IGetProfileByIdResponseDto {
  success: boolean;
  message: string;
  data: IProfileData;
}

export interface IProfileData {
  user: IUser;
  _id: string;
  skills: string[];
  jobPreferences: IJobPreferences;
  userProfile: IUserProfile;
  notificationSettings: INotificationSettings;
  experiences: IExperience[];
  certificates: ICertificate[];
  academicExperiences: IAcademicExperience[];
  achievements: IAchievement[];
  portFolioImages: IPortfolioImage[];
  cvAttachments: ICvAttachment[];
  socialNetworks: ISocialNetwork[];
  createdAt: string;
  updatedAt: string;
  billingAndPaymentDetails: IBillingAndPaymentDetails;
}

export interface IJobPreferences {
  jobType: string; // Example: "FULL_TIME"
  jobCategory: string[]; // Example: ["SOFTWARE_DEVELOPMENT"]
  salaryRangeStart: number; // Example: 0
  salaryRangeEnd: number; // Example: 0
  location: IJobLocation;
}

export interface Ilocation {
  type: 'Point';
  coordinates: [number, number];
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
}

export interface IUserProfile {
  firstName: string;
  lastName: string;
  phoneNo: string;
  dob: string;
  location: {
    type: 'Point';
    coordinates: [number, number];
    formattedAddress: string;
    city: string;
    state: string;
    country: string;
  };
  websiteUrl: string;
  portfolioUrl: string;
  shortBio: string;
  profilePicture: string;
  designation: string;
}

export interface INotificationSettings {
  desktopNotification: boolean;
  emailNotification: boolean;
  jobAlerts: boolean;
  applicationStatusUpdates: boolean;
  announcementsAndUpdates: boolean;
}

export interface IExperience {
  _id: string;
  organizationName: string;
  designation: string;
  startDate: string;
  endDate?: string;
  jobType: string;
  jobDetails: string;
  isPresent: boolean;
}

export interface ICertificate {
  _id: string;
  instituteName: string;
  startDate: string;
  endDate: string;
  grade: number;
  certificate: string;
  certificateUrl: string;
}

export interface IAcademicExperience {
  _id: string;
  instituteName: string;
  startDate: string;
  endDate: string;
  grade: number;
  degree: string;
}

export interface IAchievement {
  _id: string;
  title: string;
  instituteName: string;
  details: string;
  date: string;
}

export interface IPortfolioImage {
  url: string;
  s3Key: string;
  uploadedAt: string;
}

export interface ICvAttachment {
  cvUrl: string;
  cvName: string;
  uploadedDate: string;
  s3Key: string;
  isActive: boolean;
}

export interface ISocialNetwork {
  _id: string;
  networkName: string;
  networkUrl: string;
}

export interface IBillingAndPaymentDetails {
  cardNumber: string;
  expiryDate: string;
  cvc: string;
}

export interface CurrentJobSeekerType {
  _id: string;
  email: string;
  role: UserRole;
  phoneNo: string;
  dob: string;
  friendlyAddress: string;
  city: string;
  country: string;
  websiteUrl: string;
  portfolioUrl: string;
  shortBio: string;
  profilePicture: string;
  firstName: string;
  lastName: string;
}
export interface CurrentCompanyType {
  _id: string;
  email: string;
  role: UserRole.RECRUITER;
  companyName: string;
  profilePicture: string;
  companyPhoneNo: string;
  foundedDate: string;
  companySize: string;
  websiteUrl: string;
  friendlyAddress: string;
  city: string;
  country: string;
}

// Type for Company Photos
export interface ICompanyPhoto {
  _id: string;
  url: string;
  s3Key: string;
  uploadedAt: string;
}

// Type for Perks and Benefits
export interface IPerkBenefit {
  _id: string;
  benefitName: string;
  benefitDescription: string;
}

// Type for Company Achievements
export interface ICompanyAchievement {
  _id: string;
  title: string;
  date?: string;
  eventOrInstitute: string;
  detail: string;
}

// Type for Email Notifications
export interface IEmailNotifications {
  newApplications: boolean;
  applicationUpdates: boolean;
  marketingEmails: boolean;
}

// Type for Job Preferences
export interface ICompanyJobPreferences {
  autoPublish: boolean;
  defaultJobDuration: number;
  defaultApplicationDeadline: number;
}

// Type for Privacy Settings
interface IPrivacySettings {
  showCompanySize: boolean;
  showFoundedDate: boolean;
  showLocation: boolean;
}

// Type for About Company
interface IAboutCompany {
  description: string;
  companyVideo: {
    url: string;
    s3Key: string;
  };
}

// Type for Company Profile
export interface ICompanyProfile {
  companyName: string;
  profilePicture: string;
  companyABN: number;
  foundedDate: string;
  companySize: string;
  websiteUrl: string;
  abn: number; // Added missing field
  companyEmail: string; // Added missing field
  location?: Ilocation; // Added location field
}

// Type for Main Company Data Object
export interface ICompany {
  _id: string;
  companyProfile: ICompanyProfile;
  emailNotifications: IEmailNotifications;
  jobPreferences: ICompanyJobPreferences;
  privacySettings: IPrivacySettings;
  socialNetworks: ISocialNetwork[];
  companyPhotos: ICompanyPhoto[];
  perksAndBenefits: IPerkBenefit[];
  companyAchievements: ICompanyAchievement[];
  createdAt: string;
  updatedAt: string;
  aboutCompany: IAboutCompany;
  user: IUser;
}

// Type for API Response
export interface IGetCompanyProfileResponseDto {
  success: boolean;
  message: string;
  data: ICompany;
}

// DeletedBy interface for conversation deletion tracking
export interface IDeletedBy {
  userId: string;
  deletionDate: string;
}

// Conversation Types
export interface IConversation {
  _id: string;
  jobApplication?: {
    _id: string;
    job: {
      _id: string;
      jobTitle: string;
      jobDescription: string;
      applicationDeadline: string;
    };
    status: 'PENDING' | 'SHORTLISTED' | 'REJECTED';
    createdAt: string;
  };
  recruiterProfileId: {
    companyProfile: {
      companyName: string;
      profilePicture: string;
    };
    _id: string;
  };
  jobSeekerProfileId: {
    userProfile: {
      firstName: string;
      lastName: string;
      profilePicture: string;
    };
    _id: string;
  };
  isDirectMessage: boolean;
  lastMessage?: IMessage;
  unreadCount?: number;
  deletedBy?: IDeletedBy[]; // Array of users who have deleted this conversation
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface IGetConversationsResponseDto {
  success: boolean;
  message: string;
  data: {
    conversations: IConversation[];
    pagination: IPagination;
  };
}

export interface IGetConversationResponseDto {
  success: boolean;
  message: string;
  data: IConversation;
}

// Message Types
export interface IMediaFile {
  url: string;
  s3Key: string;
  fileName: string;
  fileSize: number;
}

export interface IMessage {
  _id: string;
  conversationId: string;
  senderId: string; // Changed to string to match API response
  senderType: string; // This is the key field for determining message sender
  content: string;
  mediaFiles: IMediaFile[];
  deletedBy: string[];
  deletedForEveryone: boolean;
  read: boolean;
  createdAt: string;
  updatedAt: string;
  status?: 'sending' | 'sent' | 'delivered' | 'read' | 'error'; // For message status
  readAt?: string; // For read messages
}

export interface IGetMessagesResponseDto {
  success: boolean;
  message: string;
  data: {
    messages: IMessage[];
    pagination: IPagination;
  };
}

export interface IGetEnumsResponseDto {
  success: boolean;
  message: string;
  data: {
    ALL_ENUMS: string[];
    CAREER_LEVEL_ENUM: {
      INTERN: string;
      JUNIOR: string;
      MID_LEVEL: string;
      SENIOR: string;
      LEAD: string;
      DIRECTOR: string;
      EXECUTIVE: string;
    };
    EXPERIENCE_RANGE_ENUM: {
      YEAR_0_1: string;
      YEAR_1_2: string;
      YEAR_2_5: string;
      YEAR_5_10: string;
      YEAR_10_PLUS: string;
    };
    JOB_CATEGORIES_ENUM: {
      SOFTWARE_DEVELOPMENT: string;
      DATA_SCIENCE: string;
      DESIGN: string;
      MARKETING: string;
      HUMAN_RESOURCES: string;
      CUSTOMER_SERVICE: string;
      PROJECT_MANAGEMENT: string;
      CONTENT_WRITING: string;
    };
    JOB_MODE_ENUM: {
      REMOTE: string;
      HYBRID: string;
      ONSITE: string;
    };
    JOB_TYPE_ENUM: {
      FULL_TIME: string;
      PART_TIME: string;
      CONTRACT: string;
      FREELANCE: string;
      INTERNSHIP: string;
    };
    QUALIFICATION_ENUM: {
      DIPLOMA: string;
      BACHELOR: string;
      MASTER: string;
      PHD: string;
      CERTIFICATION: string;
    };
    ROLE_ENUM: {
      JOBSEEKER: string;
      RECRUITER: string;
      ADMIN: string;
    };
    SALARY_TYPE_ENUM: {
      MONTHLY: string;
      HOURLY: string;
      ANNUAL: string;
      PROJECT_BASED: string;
    };
    SKILLS_ENUM: {
      SOFTWARE_DEVELOPMENT: string[];
      DATA_SCIENCE: string[];
      DESIGN: string[];
      MARKETING: string[];
      HUMAN_RESOURCES: string[];
      CUSTOMER_SERVICE: string[];
      PROJECT_MANAGEMENT: string[];
      CONTENT_WRITING: string[];
    };
    SOCIAL_ACCOUNT_ENUM: {
      GOOGLE: string;
      APPLE: string;
    };
  };
}

export interface IJobLocation {
  type: 'Point'; // The type of location (always "Point")
  coordinates: [number, number]; // Latitude and Longitude
  formattedAddress: string; // Full formatted address
  city: string; // City name
  state: string; // State name
  country: string; // Country name
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

export interface IJobData extends ICreateJobRequestDto {
  recruiterProfile: ICompanyProfile; // ID of the recruiter profile
  _id: string; // Unique ID of the job
  createdAt: string; // Job creation timestamp (ISO 8601 format)
  updatedAt: string; // Job update timestamp (ISO 8601 format)
  __v: number; // Version key
}

export interface ICreateJobResponseDto {
  success: boolean; // Indicates if the job creation was successful
  message: string; // Message from the server (e.g., "Job posting created successfully")
  data: IJobData; // The created job data
}

export interface IJobLocation {
  type: 'Point'; // The type of location (always "Point")
  coordinates: [number, number]; // Latitude and Longitude
  formattedAddress: string; // Full formatted address
  city: string; // City name
  state: string; // State name
  country: string; // Country name
}

// Type for Recruiter Profile in Job Postings
export interface IRecruiterProfile {
  abn: string; // Australian Business Number
  companyName: string; // Name of the company
  companyPhoneNo: string; // Phone number of the company
  foundedDate: string; // Date the company was founded (ISO 8601 format)
  companySize: string; // Size of the company
  websiteUrl: string; // Website URL of the company
  friendlyAddress: string; // Friendly address of the company
  city: string; // City where the company is located
  country: string; // Country where the company is located
}

// Type for Job Posting
export interface IRecruiterJobPosting {
  _id: string; // Unique ID of the job posting
  recruiterProfile: ICompanyProfile; // Recruiter profile details
  jobTitle: string; // Title of the job
  jobDescription: string; // Description of the job
  applicationDeadline: string; // Deadline for applications (ISO 8601 format)
  isJobActive: boolean; // Whether the job is active
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
  createdAt: string; // Job creation timestamp (ISO 8601 format)
  updatedAt: string; // Job update timestamp (ISO 8601 format)
  applicantsCount: number; // Job update timestamp (ISO 8601 format)
  shortlistedApplicantsCount: number; // Job update timestamp (ISO 8601 format)
  __v: number; // Version key
}

// Type for Get Recruiter Job Response
export interface IGetRecruiterJobResponseDto {
  success: boolean; // Indicates if the API call was successful
  message: string; // Message from the server (e.g., "Recruiter job postings retrieved successfully")
  data: {
    jobs: IRecruiterJobPosting[]; // Array of job postings
    pagination: IPagination;
  };
}

// Type for Recent Job
export interface IRecentJob {
  _id: string; // Unique ID of the job posting
  recruiterProfile: ICompanyProfile; // ID of the recruiter profile
  jobTitle: string; // Title of the job
  jobDescription: string; // Description of the job
  applicationDeadline: string; // Deadline for applications (ISO 8601 format)
  isJobActive: boolean; // Whether the job is active
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
  createdAt: string; // Job creation timestamp (ISO 8601 format)
  updatedAt: string; // Job update timestamp (ISO 8601 format)
  shortlistedApplicantsCount: number; // Job update timestamp (ISO 8601 format)
  applicantsCount: number; // Job update timestamp (ISO 8601 format)
  __v: number; // Version key
}

// Type for Get Recent Jobs Response
export interface IGetRecentJobsResponseDto {
  success: boolean; // Indicates if the API call was successful
  message: string; // Message from the server (e.g., "Recent jobs retrieved successfully")
  data: {
    jobs: IRecentJob[]; // Array of recent job postings
    pagination: IPagination;
  };
}

// New types for All Jobs API

export interface IJobSearchParams {
  search?: string;
  page?: number;
  limit?: number;
  coordinates?: [number, number]; // This will ensure coordinates are always in [long, lat] format
  maxDistance?: string;
  jobType?: string;
  experienceLevel?: string;
  qualification?: string;
  careerLevel?: string;
  salaryType?: string;
}

export interface IJobFilterState extends IJobSearchParams {
  jobId?: string; // Separate jobId from search params
}

export interface IAllJob {
  _id: string;
  recruiterProfile: {
    companyProfile: ICompanyProfile;
    _id: string;
  };
  isSaved?: boolean;
  isBoosted?: boolean;
  isPremium?: boolean;
  isDeleted?: boolean;
  alreadyApplied?: boolean;
  jobTitle: string;
  jobDescription: string;
  applicationDeadline: string;
  isJobActive: boolean;
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
  createdAt: string;
  updatedAt: string;
  __v: number;
}

export interface IPagination {
  skip: number;
  limit: number;
  currentPage: number;
  pages: number;
  hasNextPage: boolean;
  totalRecords: number;
  pageSize: number;
}

export interface IGetAllJobsResponseDto {
  success: boolean;
  message: string;
  data: {
    allJobs: IAllJob[];
    pagination: IPagination;
  };
}

// Types for All JobSeekers API
export interface IJobSeekerSearchParams {
  search?: string;
  page?: number;
  limit?: number;
  coordinates?: [number, number]; // This will ensure coordinates are always in [long, lat] format
  maxDistance?: string;
  jobType?: string;
  jobCategory?: string;
}

export interface IJobSeekerFilterState extends IJobSeekerSearchParams {
  jobSeekerId?: string; // Separate jobSeekerId from search params
}

export interface IJobSeekerLocation {
  type: 'Point';
  coordinates: [number, number];
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
}

export interface IJobPreference {
  location: IJobSeekerLocation;
  jobType: string;
  jobCategory: string[];
  salaryRangeStart: number;
  salaryRangeEnd: number;
}

export interface IUserProfile {
  firstName: string;
  lastName: string;
  phoneNo: string;
  dob: string;
  location: IJobSeekerLocation;
  websiteUrl: string;
  portfolioUrl: string;
  shortBio: string;
  profilePicture: string;
  isProMember?: boolean;
}

export interface IJobSeeker {
  _id: string;
  jobPreferences: IJobPreference;
  userProfile: IUserProfile;
  skills: string[];
  isSaved: boolean;
}

export interface IGetAllJobSeekersResponseDto {
  success: boolean;
  message: string;
  data: {
    allJobSeekers: IJobSeeker[];
    pagination: IPagination;
  };
}

export interface ICompanyVideoListing {
  url: string;
  s3Key: string;
  uploadedAt: string;
}

export interface ICompanyProfileListing {
  companyName: string;
  profilePicture?: string;
  foundedDate: string;
  companySize: string;
  websiteUrl: string;
  abn: string;
  location?: IJobLocation;
}

export interface IAboutCompanyListing {
  companyVideo?: ICompanyVideoListing;
  description: string;
}

export interface ICompanyListing {
  _id: string;
  companyProfile: ICompanyProfileListing;
  aboutCompany: IAboutCompanyListing;
  activeJobs: number;
}

export interface IGetAllCompaniesResponseDto {
  success: boolean;
  message: string;
  data: {
    allCompanies: ICompanyListing[];
    pagination: IPagination;
  };
}

// Types for Recruiter Detail Response
export interface IRecruiterDetailLocation {
  type: string;
  coordinates: [number, number];
  formattedAddress: string;
  city: string;
  state: string;
  country: string;
}

export interface IRecruiterDetailCompanyProfile {
  abn: string;
  companyName: string;
  foundedDate: string;
  companySize: string;
  websiteUrl: string;
  location: IRecruiterDetailLocation;
}

export interface IRecruiterDetailEmailNotifications {
  newApplications: boolean;
  applicationUpdates: boolean;
  marketingEmails: boolean;
}

export interface IRecruiterDetailJobPreferences {
  autoPublish: boolean;
  defaultJobDuration: number;
  defaultApplicationDeadline: number;
}

export interface IRecruiterDetailSocialNetwork {
  networkName: string;
  networkUrl: string;
  _id: string;
}

export interface IRecruiterDetailCompanyPhoto {
  url: string;
  s3Key: string;
  uploadedAt: string;
}

export interface IRecruiterDetailPerkBenefit {
  benefitName: string;
  benefitDescription: string;
  _id: string;
}

export interface IRecruiterDetailCompanyAchievement {
  title: string;
  date: string;
  eventOrInstitute: string;
  detail: string;
  _id: string;
}

export interface IRecruiterDetailCompanyVideo {
  url: string;
  s3Key: string;
  uploadedAt: string;
}

export interface IRecruiterDetailAboutCompany {
  description: string;
  companyVideo?: IRecruiterDetailCompanyVideo;
}

export interface IRecruiterDetailUser {
  _id: string;
  email: string;
  role: string;
}

export interface IRecruiterDetail {
  _id: string;
  companyProfile: IRecruiterDetailCompanyProfile;
  emailNotifications: IRecruiterDetailEmailNotifications;
  jobPreferences: IRecruiterDetailJobPreferences;
  socialNetworks: IRecruiterDetailSocialNetwork[];
  companyPhotos: IRecruiterDetailCompanyPhoto[];
  perksAndBenefits: IRecruiterDetailPerkBenefit[];
  companyAchievements: IRecruiterDetailCompanyAchievement[];
  createdAt: string;
  updatedAt: string;
  aboutCompany: IRecruiterDetailAboutCompany;
  user: IRecruiterDetailUser;
  activeJobs: number;
}

export interface IGetRecruiterDetailResponseDto {
  success: boolean;
  message: string;
  data: IRecruiterDetail;
}
