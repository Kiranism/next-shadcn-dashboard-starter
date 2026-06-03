import type { NormSeverity } from './norms';

export type ViolationStatus = 'active' | 'cancelled';

export interface ViolationNorm {
  id: string;
  code: string;
  description: string;
  severity: NormSeverity;
  points: number;
}

export interface Violation {
  id: string;
  user_id: string;
  norm: ViolationNorm;
  reason: string | null;
  status: ViolationStatus;
  expires_at: string;
  cancelled_at: string | null;
  applied_at: string;
  created_at: string;
}

export interface ViolationSummary {
  score: number;
  active_leves: number;
  active_moderadas: number;
  active_graves: number;
  active_desligamentos: number;
  at_risk: boolean;
}

export interface UserViolations {
  user_id: string;
  violations: Violation[];
  summary: ViolationSummary;
}

export interface ViolationsMeResponse {
  violations: Violation[];
  summary: ViolationSummary;
}

export interface CreateViolationPayload {
  user_id: string;
  norm_id: string;
  reason?: string;
}
