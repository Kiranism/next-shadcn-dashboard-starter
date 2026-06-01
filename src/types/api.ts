// Shared API response types

export interface ClockInResponse {
  id: string;
  clocked_in_at: string;
}

export interface ClockOutValidResponse {
  status: 'valid';
  id: string;
  clocked_in_at: string;
  clocked_out_at: string;
  duration_minutes: number;
}

export interface ClockOutAnnulledResponse {
  status: 'annulled';
  reason: 'exceeded_max_duration';
  id: string;
  clocked_in_at: string;
  clocked_out_at: string;
  duration_minutes: number;
}

export type ClockOutResponse = ClockOutValidResponse | ClockOutAnnulledResponse;

export type CurrentSessionNone = { status: 'none' };
export type CurrentSessionOpen = {
  status: 'open';
  clocked_in_at: string;
  elapsed_minutes: number;
};
export type CurrentSessionInvalid = {
  status: 'invalid';
  reason: 'exceeded_max_duration';
  clocked_in_at: string;
  elapsed_minutes: number;
};
export type CurrentSession = CurrentSessionNone | CurrentSessionOpen | CurrentSessionInvalid;

export interface ValidSession {
  id: string;
  clocked_in_at: string;
  clocked_out_at: string;
  duration_minutes: number;
}

export interface SummaryResponse {
  week_start: string;
  week_end: string;
  total_minutes: number;
  min_hours_met: boolean;
  valid_sessions: ValidSession[];
  current_session: CurrentSession;
}

export interface MemberWeeklySummary {
  user_id: string;
  name: string;
  total_minutes: number;
  min_hours_met: boolean;
}

export interface TimeEntriesListResponse {
  week_start: string;
  week_end: string;
  min_week_hours: number;
  members: MemberWeeklySummary[];
}

export interface UserResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  sector: string | null;
  cpf: string | null;
}

export interface AppSettings {
  min_week_hours: number;
  min_availability_hours: number;
}

export interface UpdateUserPayload {
  name?: string;
  role?: string;
  sector?: string | null;
  cpf?: string | null;
}

export type ReimbursementStatus = 'pending' | 'approved' | 'rejected';

export type ReimbursementCategory =
  | 'ingresso'
  | 'alimentação'
  | 'transporte'
  | 'equipamento'
  | 'outro';

export interface ReimbursementAttachment {
  id: string;
  name: string;
  signed_url: string;
}

export interface Reimbursement {
  id: string;
  user_id: string;
  title: string;
  description: string;
  amount_cents: number;
  category: ReimbursementCategory;
  pix_key: string;
  status: ReimbursementStatus;
  attachments: ReimbursementAttachment[];
  created_at: string;
  updated_at: string;
}

export interface CreateReimbursementPayload {
  title: string;
  description: string;
  amount_cents: number;
  category: ReimbursementCategory;
  pix_key: string;
  attachments?: { path: string; name: string }[];
}

export interface UpdateReimbursementStatusPayload {
  status: 'approved' | 'rejected';
}
