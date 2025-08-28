// Task status enum
export enum TaskStatus {
  DRAFT = 'draft',
  PUBLISHED = 'published',
  ACTIVE = 'active',
  ENDED = 'ended',
  CANCELLED = 'cancelled'
}

// Task interface
export interface Task {
  id: string;
  title: string;
  description: string;

  // Time management
  startTime?: Date;
  deadline: Date;

  // Reward information
  rewardInstruction?: string;
  totalRewardAmount: number;
  rewardExp: number;

  // Status management
  status: TaskStatus;
  maxParticipants?: number;
  currentParticipants: number;

  // Project information
  projectName?: string;
  projectLogo?: string;

  // Audit fields
  createdBy: string;
  assignedTo?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Create and Update task data types are now defined in validations/task.ts via zod schemas

// Task search parameters
export interface TaskSearchParams {
  searchTerm?: string;
  status?: TaskStatus | TaskStatus[];
  assignedTo?: string | string[];
  createdBy?: string | string[];
  projectName?: string;
  dateRange?: {
    startDate?: Date;
    endDate?: Date;
  };
  rewardRange?: {
    minAmount?: number;
    maxAmount?: number;
  };
  expRange?: {
    minExp?: number;
    maxExp?: number;
  };
  sortBy?: 'created_at' | 'updated_at' | 'deadline' | 'priority' | 'status';
  sortOrder?: 'ASC' | 'DESC';
  limit?: number;
  offset?: number;
}

// Task statistics
export interface TaskStats {
  total: number;
  draft: number;
  published: number;
  active: number;
  ended: number;
  cancelled: number;
}
