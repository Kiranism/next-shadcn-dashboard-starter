// ============================================================
// User Service: browser-side API calls
// ============================================================
// Calls this app's route handlers (src/app/api/users/), the same way
// TanStack's Next.js example calls /api/todos (services/todos/api.ts).
// The requests are same-origin, so the auth cookie goes along and no token
// code is needed here. You don't change this file to connect a backend:
// edit data.ts instead.
// ============================================================

import { apiClient, toSearchParams } from '@/lib/api-client';
import type { UserFilters, UsersResponse, UserMutationPayload } from './types';

export async function getUsers(filters: UserFilters): Promise<UsersResponse> {
  return apiClient<UsersResponse>(`/users?${toSearchParams(filters)}`);
}

export async function createUser(data: UserMutationPayload) {
  return apiClient('/users', { method: 'POST', body: JSON.stringify(data) });
}

export async function updateUser(id: number, data: UserMutationPayload) {
  return apiClient(`/users/${id}`, { method: 'PUT', body: JSON.stringify(data) });
}

export async function deleteUser(id: number) {
  return apiClient(`/users/${id}`, { method: 'DELETE' });
}
