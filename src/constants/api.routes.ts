export const API_ROUTES = {
  MISC: {
    CONTACT: '/misc/contact' // Endpoint for contact form
  },
  CONVERSATIONS: {
    BASE: '/conversations',
    GET_CONVERSATION: (conversationId: string) =>
      `/conversations/${conversationId}`,
    DELETE_CONVERSATION: (conversationId: string) =>
      `/conversations/${conversationId}`
  },
  MESSAGES: {
    BASE: '/messages',
    GET_MESSAGES: (conversationId: string) => `/messages/${conversationId}`,
    DELETE_MESSAGE: (messageId: string) => `/messages/${messageId}`
  },
  UPLOAD: {
    MEDIA_CHAT: '/upload/media/chat'
  },
  AUTH: {
    LOGIN: '/auth/login/email',
    LOGOUT: '/auth/logout',
    REGISTER: '/auth/register/email',
    FORGET_PASSWORD: '/auth/forget-password',
    RESET_PASSWORD: '/auth/reset-password',
    GET_CURRENT_USER: '/auth/me',
    CHANGE_PASSWORD: '/auth/change-password',
    CV_ACTIVATION: '/profile/activate-cv'
  },
  PROFILE: {
    JOBSEEKER: '/profile/',
    COMPANY_PROFILE: '/company-profile/',
    DEACTIVATE_PROFILE: '/profile/deactivate',
    DELETE_CV: '/profile/cv', // Endpoint to delete CV
    DELETE_VIDEO: '/company-profile/video', // Endpoint to delete company video
    DELETE_PHOTO: '/company-profile/photos', // Endpoint to delete company photo
    DELETE_PORTFOLIO_IMAGE: '/profile/photos', // Endpoint to delete portfolio image
    UPLOAD_PORTFOLIO: '/portfolio', // Endpoint to upload portfolio
    GET_PROFILE_BY_ID: (profileId: string) => `/profile/${profileId}`, // Dynamic route for getting a profile by ID
    GET_COMPANY_PROFILE_BY_ID: (profileId: string) =>
      `/company-profile/${profileId}`, // Dynamic route for getting a company profile by ID
    GET_RECRUITER_DETAIL_BY_ID: (profileId: string) =>
      `/company-profile/${profileId}`, // Dynamic route for getting recruiter detail by ID
    GET_JOBSEEKER_PROFILE_BY_ID: (profileId: string) => `/profile/${profileId}` // Dynamic route for getting jobseeker profile by ID
  },
  DEV: {
    ENUMS: '/dev/all-enums'
  },
  JOBS: {
    BASE: '/job-posting', // Base route for job-related endpoints
    GET_RECRUITERS_JOBS: '/job-posting/recruiter/jobs', // Base route for job-related endpoints
    GET_RECENT_JOBS: '/job-posting/recent-jobs',
    CREATE_JOB_POSTING: '/job-posting/', // Base route for job-related endpoints
    GET_JOB: (jobId: string) => `/job-posting/${jobId}`, // Dynamic route for getting a job by ID
    UPDATE_JOB: (jobId: string) => `/job-posting/${jobId}`,
    DELETE_JOB: (jobId: string) => `/job-posting/${jobId}`,
    UPDATE_JOB_STATUS: (jobId: string) => `/job-posting/${jobId}/status`
  },
  JOBS_APPLICATION: {
    APPLY_JOB: (jobId: string) => `/job-application/apply/${jobId}`, // Dynamic route for applying to a job
    UPDATE_JOB: (jobId: string) => `/job-posting/${jobId}`,
    DELETE_JOB: (jobId: string) => `/job-posting/${jobId}`,
    UPDATE_JOB_STATUS: (jobId: string) => `/job-posting/${jobId}/status`,
    GET_MY_JOB_APPLICATIONS: '/job-application/my-applications',
    GET_MY_SHORTLISTED_APPLICATIONS:
      '/job-application/my-applications/shortlisted',
    GET_ALL_SHORTLISTED_APPLICANTS: '/job-application/recruiter/shortlisted',
    GET_ALL_APPLICANTS: '/job-application/recruiter/applicants',
    GET_JOB_APPLICANTS: (jobId: string) =>
      `/job-application/job/${jobId}/applicants`,
    SHORTLIST_APPLICANT: (applicationId: string) =>
      `/job-application/shortlist/${applicationId}`,
    REJECT_APPLICANT: (applicationId: string) =>
      `/job-application/reject/${applicationId}`,
    DELETE_APPLICATION: (applicationId: string) =>
      `/job-application/${applicationId}`,
    ALL_JOBS: '/listing/all-jobs',
    ALL_JOBSEEKERS: '/listing/all-jobseekers',
    ALL_COMPANIES: '/listing/all-companies'
  },
  SAVED_JOBS: {
    SAVE_JOB: (jobId: string) => `/saved-job/${jobId}`,
    GET_SAVED_JOBS: '/saved-job/'
  },
  SAVED_CANDIDATES: {
    SAVE_CANDIDATE: (candidateId: string) => `/saved-candidate/${candidateId}`,
    GET_SAVED_CANDIDATES: '/saved-candidate'
  },
  OCR: {
    EXTRACT: '/ocr/extract'
  },
  USER: {
    GET_USERS: '/users/'
  },
  ADMIN: {
    UPDATE_JOB: (jobId: string) => `/admin/job/${jobId}`,
    UPDATE_USER: (userId: string) => `/admin/user/${userId}`,
    SETTINGS: '/admin-settings/',
    UPDATE_SETTINGS: '/admin-settings/'
  }
} as const;
