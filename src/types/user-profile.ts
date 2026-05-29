export type Role = 'consultor' | 'gerente' | 'diretor' | 'assessor' | 'presidente';

export const ROLE_RANK: Record<Role, number> = {
  consultor: 0,
  gerente: 1,
  diretor: 2,
  assessor: 3,
  presidente: 4
};

export function getRank(role: string): number {
  return ROLE_RANK[role as Role] ?? 0;
}

export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: Role;
  sector: string | null;
  cpf: string | null;
  rank: number;
}
