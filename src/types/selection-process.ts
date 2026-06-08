export type SelectionProcessApplicationStatus = 'pending' | 'approved' | 'reproved' | 'waitlisted';

export type CandidateStatus = 'active' | 'approved' | 'eliminated';

export interface SelectionProcess {
  id: string;
  title: string;
  starts_at: string;
  ends_at: string;
  created_at: string;
}

export interface SelectionProcessApplication {
  id: string;
  selection_process_id: string;
  name: string;
  course: string;
  period: number;
  phone: string;
  email: string;
  instagram: string;
  how_heard: string;
  motivation: string;
  why_watt: string;
  shirt_size: 'P' | 'M' | 'G' | 'GG' | 'XG';
  status: SelectionProcessApplicationStatus;
  resume_signed_url: string;
  transcript_signed_url: string;
  photo_signed_url: string;
  created_at: string;
}

export interface Stage {
  id: string;
  selection_process_id: string;
  name: string;
  position: number;
  created_at: string;
}

export interface Candidate {
  id: string;
  application_id: string;
  selection_process_id: string;
  current_stage_id: string | null;
  name: string;
  course: string;
  period: number;
  phone: string;
  email: string;
  photo_signed_url: string | null;
  shirt_size: 'P' | 'M' | 'G' | 'GG' | 'XG';
  status: CandidateStatus;
  created_at: string;
}

export interface CreateSelectionProcessPayload {
  title: string;
  starts_at: string;
  ends_at: string;
}

export interface UpdateSelectionProcessPayload {
  title?: string;
  starts_at?: string;
  ends_at?: string;
}

export interface UpdateApplicationStatusPayload {
  status: SelectionProcessApplicationStatus;
}

export interface CreateStagePayload {
  selection_process_id: string;
  name: string;
  position: number;
  shift?: boolean;
}

export interface UpdateStagePayload {
  name?: string;
  position?: number;
}

export interface UpdateCandidatePayload {
  status: 'approved' | 'reproved';
}

export interface CreateApplicationPayload {
  name: string;
  course: string;
  period: number;
  phone: string;
  email: string;
  instagram: string;
  how_heard: string;
  motivation: string;
  why_watt: string;
  shirt_size: 'P' | 'M' | 'G' | 'GG' | 'XG';
  resume_path: string;
  transcript_path: string;
  photo_path: string;
}
