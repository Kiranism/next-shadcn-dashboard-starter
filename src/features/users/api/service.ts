import { apiPatch } from '@/lib/api-client';
import type { UserResponse } from '@/features/ponto-eletronico/api/types';
import type { UpdateUserPayload } from './types';

export const updateUser = (token: string, userId: string, data: UpdateUserPayload) =>
  apiPatch<UserResponse>(`/users/${userId}`, token, data);
