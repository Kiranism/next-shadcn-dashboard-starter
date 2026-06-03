import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiDelete } from '@/lib/api-client';
import { useAccessToken } from './_shared/use-access-token';
import type {
  UserViolations,
  ViolationsMeResponse,
  CreateViolationPayload
} from '@/types/violations';

export const violationsKeys = {
  all: () => ['violations'] as const,
  list: () => ['violations', 'list'] as const,
  me: () => ['violations', 'me'] as const
};

async function getViolations(token: string): Promise<UserViolations[]> {
  return apiGet<UserViolations[]>('/violations', token);
}

async function getViolationsMe(token: string): Promise<ViolationsMeResponse> {
  return apiGet<ViolationsMeResponse>('/violations/me', token);
}

async function createViolation(
  token: string,
  payload: CreateViolationPayload
): Promise<UserViolations> {
  return apiPost<UserViolations>('/violations', token, payload);
}

async function cancelViolation(token: string, id: string): Promise<void> {
  return apiDelete<void>(`/violations/${id}`, token);
}

function useList() {
  const token = useAccessToken();
  return useQuery({
    queryKey: violationsKeys.list(),
    queryFn: () => getViolations(token),
    enabled: !!token
  });
}

function useMe() {
  const token = useAccessToken();
  return useQuery({
    queryKey: violationsKeys.me(),
    queryFn: () => getViolationsMe(token),
    enabled: !!token
  });
}

function useCreate() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateViolationPayload) => createViolation(token, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: violationsKeys.all() });
    }
  });
}

function useCancel() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => cancelViolation(token, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: violationsKeys.all() });
    }
  });
}

export const ViolationsRepository = {
  keys: violationsKeys,
  useList,
  useMe,
  useCreate,
  useCancel
};
