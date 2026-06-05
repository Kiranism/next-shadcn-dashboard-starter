// Houses

export interface House {
  id: string;
  name: string;
  total_points: number;
}

export interface HouseMember {
  id: string;
  email: string;
  name: string;
  role: string;
  sector: string | null;
  house_id?: string | null;
}

export interface AssignHouseMemberPayload {
  house_id: string | null;
}

// Gamification Cycles

export interface GamificationCycle {
  id: string;
  name: string;
  started_at: string;
  ended_at: string | null;
  created_by: string;
  created_at: string;
}

export interface CreateCyclePayload {
  name: string;
}

// Gamification Tasks

export interface GamificationTask {
  id: string;
  title: string;
  description: string | null;
  points: number;
  is_active: boolean;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  points: number;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string;
  points?: number;
  is_active?: boolean;
}

// Gamification Submissions

export type SubmissionStatus = 'pending' | 'approved' | 'rejected';

export interface GamificationSubmission {
  id: string;
  task_id: string;
  task_title?: string;
  user_id: string;
  user_name?: string;
  house_id: string;
  cycle_id: string;
  description: string;
  file_path?: string;
  file_url?: string;
  status: SubmissionStatus;
  rejection_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSubmissionPayload {
  task_id: string;
  description: string;
  file_path: string;
}

export interface ReviewSubmissionPayload {
  status: 'approved' | 'rejected';
  rejection_reason?: string;
}

// Leaderboard

export interface LeaderboardEntry {
  house_id: string;
  house_name: string;
  total_points: number;
}

export interface PodiumEntry {
  user_id: string;
  user_name: string;
  points_contributed: number;
  approved_count: number;
}
