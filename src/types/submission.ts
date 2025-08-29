import { Task } from '@/types/task';

// Task submission review status type
export type SubmissionReviewStatus = 'pending' | 'approved' | 'rejected';

// Profile interface
export interface Profile {
  id: string;
  fullName?: string | null;
  avatarUrl?: string | null;
  role: string;
  experiencePoints: number;
  level: number;
  walletAddress?: string | null;
  isPremiumMember: boolean;
  youtubeId?: string | null;
  youtubeTitle?: string | null;
  subscribers: number;
  views: number;
  motto?: string | null;
  userNumericId?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

// Task submission interface
export interface TaskSubmission {
  id: string;
  taskId: string;
  userId: string;
  submissionContent: string;
  reviewStatus: SubmissionReviewStatus;
  reviewComment?: string | null;
  reviewedBy?: string | null;
  reviewedAt?: Date | null;
  submittedAt: Date;
  updatedAt: Date;
  // Relations
  task?: Task;
  profile?: Profile;
}

// Task participant interface
export interface TaskParticipant {
  id: string;
  taskId: string;
  userId: string;
  joinedAt: Date;
  // Relations
  task?: Task;
  profile?: Profile;
}

// Submission statistics
export interface SubmissionStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

// Submission search parameters
export interface SubmissionSearchParams {
  searchTerm?: string;
  reviewStatus?: SubmissionReviewStatus | SubmissionReviewStatus[];
  taskId?: string;
  userId?: string;
  reviewedBy?: string;
  dateRange?: {
    startDate?: Date;
    endDate?: Date;
  };
  sortBy?: 'submitted_at' | 'updated_at' | 'review_status';
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}
