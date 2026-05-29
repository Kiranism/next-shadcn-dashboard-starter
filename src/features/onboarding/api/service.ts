import { apiPost } from '@/lib/api-client';
import type { UserProfile } from '@/types/user-profile';
import { getRank } from '@/types/user-profile';

export interface CreateProfileDto {
  name: string;
  sector: 'projetos' | 'comercial' | 'marketing' | 'executivo' | 'institucional';
  cpf: string;
}

interface CreateProfileResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  sector: string;
  cpf: string;
}

export async function createProfile(token: string, dto: CreateProfileDto): Promise<UserProfile> {
  const data = await apiPost<CreateProfileResponse>('/users', token, dto);
  return {
    ...data,
    role: data.role as UserProfile['role'],
    rank: getRank(data.role),
    cpf: data.cpf ?? null,
    sector: data.sector ?? null
  };
}
