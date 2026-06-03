export type NormSeverity = 'leve' | 'moderada' | 'grave' | 'desligamento';

export interface Norm {
  id: string;
  code: string;
  description: string;
  severity: NormSeverity;
  created_at: string;
  updated_at: string;
}

export interface CreateNormPayload {
  code: string;
  description: string;
  severity: NormSeverity;
}

export interface UpdateNormPayload {
  description?: string;
  severity?: NormSeverity;
}
