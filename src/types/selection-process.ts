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

// ─── Interviews ────────────────────────────────────────────────────────────────

export interface InterviewSlot {
  id: string;
  selection_process_id: string;
  consultant_id: string;
  starts_at: string;
  ends_at: string;
  booking_id: string | null;
  created_at: string;
}

export interface AvailableInterviewSlot {
  starts_at: string;
  ends_at: string;
}

export interface MyInterviewSlot {
  id: string;
  selection_process_id: string;
  consultant_id: string;
  consultant_name?: string;
  pair_name?: string | null;
  starts_at: string;
  ends_at: string;
  booking_id: string | null;
  candidate_name?: string;
  candidate_email?: string;
  meet_link?: string | null;
  has_evaluation?: boolean;
  created_at: string;
}

export interface InterviewBooking {
  id: string;
  selection_process_id: string;
  candidate_id: string;
  starts_at: string;
  ends_at: string;
  booked_at: string;
  created_at: string;
}

export interface InterviewBookingDetail extends InterviewBooking {
  meet_link: string | null;
}

export interface AddInterviewSlotsPayload {
  slots: string[];
}

export interface BookInterviewPayload {
  starts_at: string;
  token: string;
}

export interface SendInterviewLinksPayload {
  candidate_ids: string[];
}

export interface SendInterviewLinksResult {
  candidate_id: string;
  success: boolean;
}

export interface SendMeetLinkPayload {
  booking_id: string;
  meet_link: string;
}

export interface EvaluationScores {
  proatividade: number;
  lideranca: number;
  transparencia: number;
  uniao_de_time: number;
  comunicacao: number;
  seriedade: number;
  compromisso: number;
  proposito: number;
  autoresponsabilidade: number;
  autoconfianca: number;
  responsabilidade_social: number;
  criatividade: number;
}

export interface EvaluationFlags {
  procrastinacao: boolean;
  desinteresse: boolean;
  falta_de_transparencia: boolean;
  proposito_vago: boolean;
  vitimizacao: boolean;
  falta_de_confianca: boolean;
}

export interface CreateEvaluationPayload extends EvaluationScores, EvaluationFlags {
  observacoes?: string;
}

export interface InterviewEvaluationResponse extends EvaluationScores, EvaluationFlags {
  id: string;
  booking_id: string;
  evaluator_id: string;
  observacoes: string | null;
  created_at: string;
}

export interface InterviewEvaluationWithCandidate extends InterviewEvaluationResponse {
  candidate_id: string;
  candidate_name: string;
}
