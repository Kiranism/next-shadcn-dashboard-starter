import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch } from '@/lib/api-client';
import { useAccessToken } from './_shared/use-access-token';
import type {
  Reimbursement,
  CreateReimbursementPayload,
  UpdateReimbursementStatusPayload
} from '@/types/api';

export const reembolsosKeys = {
  all: () => ['reembolsos'] as const,
  own: () => ['reembolsos', 'own'] as const,
  allList: () => ['reembolsos', 'all'] as const,
  byUser: (userId: string) => ['reembolsos', 'user', userId] as const
};

async function getOwn(token: string): Promise<Reimbursement[]> {
  return apiGet<Reimbursement[]>('/reimbursements?target=me', token);
}

async function getAll(token: string): Promise<Reimbursement[]> {
  return apiGet<Reimbursement[]>('/reimbursements?target=all', token);
}

async function create(token: string, payload: CreateReimbursementPayload): Promise<Reimbursement> {
  return apiPost<Reimbursement>('/reimbursements', token, payload);
}

async function updateStatus(
  token: string,
  id: string,
  payload: UpdateReimbursementStatusPayload
): Promise<Reimbursement> {
  return apiPatch<Reimbursement>(`/reimbursements/${id}/status`, token, payload);
}

function useOwn() {
  const token = useAccessToken();
  return useQuery({
    queryKey: reembolsosKeys.own(),
    queryFn: () => getOwn(token),
    enabled: !!token
  });
}

function useAll() {
  const token = useAccessToken();
  return useQuery({
    queryKey: reembolsosKeys.allList(),
    queryFn: () => getAll(token),
    enabled: !!token
  });
}

function useCreate() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateReimbursementPayload) => create(token, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reembolsosKeys.all() });
    }
  });
}

function useUpdateStatus() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateReimbursementStatusPayload }) =>
      updateStatus(token, id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: reembolsosKeys.all() });
    }
  });
}

export const ReembolsosRepository = {
  keys: reembolsosKeys,
  useOwn,
  useAll,
  useCreate,
  useUpdateStatus
};
