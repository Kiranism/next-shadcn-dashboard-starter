import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPut, apiDelete } from '@/lib/api-client';
import { useAccessToken } from './_shared/use-access-token';
import type { Norm, CreateNormPayload, UpdateNormPayload } from '@/types/norms';

export const normsKeys = {
  all: () => ['norms'] as const,
  list: () => ['norms', 'list'] as const
};

async function getNorms(token: string): Promise<Norm[]> {
  return apiGet<Norm[]>('/norms', token);
}

async function createNorm(token: string, payload: CreateNormPayload): Promise<Norm> {
  return apiPost<Norm>('/norms', token, payload);
}

async function updateNorm(token: string, id: string, payload: UpdateNormPayload): Promise<Norm> {
  return apiPut<Norm>(`/norms/${id}`, token, payload);
}

async function deleteNorm(token: string, id: string): Promise<void> {
  return apiDelete<void>(`/norms/${id}`, token);
}

function useList() {
  const token = useAccessToken();
  return useQuery({
    queryKey: normsKeys.list(),
    queryFn: () => getNorms(token),
    enabled: !!token
  });
}

function useCreate() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateNormPayload) => createNorm(token, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: normsKeys.all() });
    }
  });
}

function useUpdate() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateNormPayload }) =>
      updateNorm(token, id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: normsKeys.all() });
    }
  });
}

function useDelete() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNorm(token, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: normsKeys.all() });
    }
  });
}

export const NormsRepository = {
  keys: normsKeys,
  useList,
  useCreate,
  useUpdate,
  useDelete
};
