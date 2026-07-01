export const ROLE_OPTIONS = [
  { value: 'consultor', label: 'Consultor' },
  { value: 'gerente', label: 'Gerente' },
  { value: 'diretor', label: 'Diretor' },
  { value: 'assessor', label: 'Assessor' },
  { value: 'presidente', label: 'Presidente' }
] as const;

export const SECTOR_OPTIONS = [
  { value: 'comercial', label: 'Comercial' },
  { value: 'executivo', label: 'Executivo' },
  { value: 'institucional', label: 'Institucional' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'projetos', label: 'Projetos' }
] as const;

export type Role = (typeof ROLE_OPTIONS)[number]['value'];
export type Sector = (typeof SECTOR_OPTIONS)[number]['value'];

export const ROLE_LABEL: Record<string, string> = Object.fromEntries(
  ROLE_OPTIONS.map((o) => [o.value, o.label])
);

export const SECTOR_LABEL: Record<string, string> = Object.fromEntries(
  SECTOR_OPTIONS.map((o) => [o.value, o.label])
);
