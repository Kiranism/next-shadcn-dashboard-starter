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

// Portfolio

export interface PortfolioItem {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePortfolioPayload {
  name: string;
  description?: string;
}

export interface UpdatePortfolioPayload {
  name?: string;
  description?: string;
}

// Leads

export type LeadStatus = 'nao_contatado' | 'em_progresso' | 'contatado';

export interface LeadContact {
  id: string;
  lead_id: string;
  name: string;
  role: string;
  email: string | null;
  phone: string | null;
}

export interface LeadComment {
  id: string;
  lead_id: string;
  user_id: string;
  user_name?: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export interface Lead {
  id: string;
  company_name: string;
  cnpj: string;
  created_by: string;
  status: LeadStatus;
  address_logradouro: string;
  address_numero: string;
  address_complemento: string | null;
  address_bairro: string;
  address_cidade: string;
  address_estado: string;
  address_cep: string;
  interest_items: string[];
  contacts?: LeadContact[];
  created_at: string;
  updated_at: string;
}

export interface LeadDetail extends Lead {
  contacts: LeadContact[];
  comments: LeadComment[];
}

export interface CreateLeadPayload {
  company_name: string;
  cnpj: string;
  address_logradouro: string;
  address_numero: string;
  address_complemento?: string;
  address_bairro: string;
  address_cidade: string;
  address_estado: string;
  address_cep: string;
  status?: LeadStatus;
  interest_items?: string[];
}

export interface UpdateLeadPayload {
  company_name?: string;
  cnpj?: string;
  address_logradouro?: string;
  address_numero?: string;
  address_complemento?: string | null;
  address_bairro?: string;
  address_cidade?: string;
  address_estado?: string;
  address_cep?: string;
  status?: LeadStatus;
  interest_items?: string[];
}

export interface CreateContactPayload {
  name: string;
  role: string;
  email?: string;
  phone?: string;
}

export interface UpdateContactPayload {
  name?: string;
  role?: string;
  email?: string | null;
  phone?: string | null;
}

export interface ReceitaWSData {
  cnpj: string;
  tipo: string;
  nome: string;
  fantasia: string;
  abertura: string;
  situacao: string;
  logradouro: string;
  numero: string;
  complemento?: string;
  bairro?: string;
  municipio: string;
  uf: string;
  cep: string;
  email: string;
  telefone: string;
  atividade_principal?: { code: string; text: string }[];
  natureza_juridica?: string;
  capital_social?: string;
  qsa?: { nome: string; qual: string }[];
}
