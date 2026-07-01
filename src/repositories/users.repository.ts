import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiDelete } from '@/lib/api-client';
import { useAccessToken } from './_shared/use-access-token';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import { setRoleCookie } from '@/app/actions/set-role-cookie';
import type { UserResponse, UpdateUserPayload } from '@/types/api';

const keys = {
  all: () => ['users'] as const,
  one: (id: string) => ['users', id] as const
};

async function getAll(token: string): Promise<UserResponse[]> {
  return apiGet<UserResponse[]>('/users', token);
}

async function getOne(token: string, id: string): Promise<UserResponse> {
  return apiGet<UserResponse>(`/users/${id}`, token);
}

async function updateOne(
  token: string,
  id: string,
  data: UpdateUserPayload
): Promise<UserResponse> {
  return apiPatch<UserResponse>(`/users/${id}`, token, data);
}

async function deleteOne(token: string, id: string): Promise<void> {
  return apiDelete<void>(`/users/${id}`, token);
}

function useAll() {
  const token = useAccessToken();
  const { rank } = useUserProfile();
  return useQuery({
    queryKey: keys.all(),
    queryFn: () => getAll(token),
    enabled: !!token && rank >= 3
  });
}

function useOne(id: string) {
  const token = useAccessToken();
  const { rank } = useUserProfile();
  return useQuery({
    queryKey: keys.one(id),
    queryFn: () => getOne(token, id),
    enabled: !!token && rank >= 3 && !!id
  });
}

function useUpdateOne() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserPayload }) =>
      updateOne(token, id, data),
    onSuccess: (updated) => {
      void qc.invalidateQueries({ queryKey: keys.all() });
      if (updated.role) {
        void setRoleCookie(updated.role);
      }
    }
  });
}

function useDeleteOne() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteOne(token, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.all() });
    }
  });
}

function invalidateAll(queryClient: QueryClient) {
  return queryClient.invalidateQueries({ queryKey: keys.all() });
}

export const UserRepository = {
  keys,
  getAll,
  getOne,
  updateOne,
  deleteOne,
  useAll,
  useOne,
  useUpdateOne,
  useDeleteOne,
  invalidateAll
};
