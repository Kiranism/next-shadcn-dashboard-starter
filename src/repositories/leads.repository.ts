import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import { useAccessToken } from './_shared/use-access-token';
import type {
  Lead,
  LeadDetail,
  LeadContact,
  LeadComment,
  CreateLeadPayload,
  UpdateLeadPayload,
  CreateContactPayload,
  UpdateContactPayload,
  ReceitaWSData
} from '@/types/api';

export const leadKeys = {
  all: () => ['leads'] as const,
  list: () => ['leads', 'list'] as const,
  detail: (id: string) => ['leads', 'detail', id] as const
};

async function getLeads(token: string): Promise<Lead[]> {
  return apiGet<Lead[]>('/leads', token);
}

async function getLead(token: string, id: string): Promise<LeadDetail> {
  return apiGet<LeadDetail>(`/leads/${id}`, token);
}

async function createLead(token: string, payload: CreateLeadPayload): Promise<Lead> {
  return apiPost<Lead>('/leads', token, payload);
}

async function updateLead(token: string, id: string, payload: UpdateLeadPayload): Promise<Lead> {
  return apiPatch<Lead>(`/leads/${id}`, token, payload);
}

async function deleteLead(token: string, id: string): Promise<void> {
  return apiDelete<void>(`/leads/${id}`, token);
}

async function createContact(
  token: string,
  leadId: string,
  payload: CreateContactPayload
): Promise<LeadContact> {
  return apiPost<LeadContact>(`/leads/${leadId}/contacts`, token, payload);
}

async function updateContact(
  token: string,
  leadId: string,
  contactId: string,
  payload: UpdateContactPayload
): Promise<LeadContact> {
  return apiPatch<LeadContact>(`/leads/${leadId}/contacts/${contactId}`, token, payload);
}

async function deleteContact(token: string, leadId: string, contactId: string): Promise<void> {
  return apiDelete<void>(`/leads/${leadId}/contacts/${contactId}`, token);
}

async function createComment(token: string, leadId: string, content: string): Promise<LeadComment> {
  return apiPost<LeadComment>(`/leads/${leadId}/comments`, token, { content });
}

async function updateComment(
  token: string,
  leadId: string,
  commentId: string,
  content: string
): Promise<LeadComment> {
  return apiPatch<LeadComment>(`/leads/${leadId}/comments/${commentId}`, token, { content });
}

async function deleteComment(token: string, leadId: string, commentId: string): Promise<void> {
  return apiDelete<void>(`/leads/${leadId}/comments/${commentId}`, token);
}

async function getCnpjData(token: string, cnpj: string): Promise<ReceitaWSData> {
  const digits = cnpj.replace(/\D/g, '');
  return apiGet<ReceitaWSData>(`/leads/cnpj/${digits}`, token);
}

function useList() {
  const token = useAccessToken();
  return useQuery({
    queryKey: leadKeys.list(),
    queryFn: () => getLeads(token),
    enabled: !!token,
    staleTime: 30_000
  });
}

function useDetail(id: string | null) {
  const token = useAccessToken();
  return useQuery({
    queryKey: leadKeys.detail(id ?? ''),
    queryFn: () => getLead(token, id!),
    enabled: !!token && !!id,
    staleTime: 30_000
  });
}

function useCreate() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateLeadPayload) => createLead(token, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: leadKeys.all() });
    }
  });
}

function useUpdate() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdateLeadPayload }) =>
      updateLead(token, id, payload),
    onSuccess: (_, { id }) => {
      void qc.invalidateQueries({ queryKey: leadKeys.list() });
      void qc.invalidateQueries({ queryKey: leadKeys.detail(id) });
    }
  });
}

function useDelete() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteLead(token, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: leadKeys.all() });
    }
  });
}

function useCreateContact() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, payload }: { leadId: string; payload: CreateContactPayload }) =>
      createContact(token, leadId, payload),
    onSuccess: (_, { leadId }) => {
      void qc.invalidateQueries({ queryKey: leadKeys.detail(leadId) });
      void qc.invalidateQueries({ queryKey: leadKeys.list() });
    }
  });
}

function useUpdateContact() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      leadId,
      contactId,
      payload
    }: {
      leadId: string;
      contactId: string;
      payload: UpdateContactPayload;
    }) => updateContact(token, leadId, contactId, payload),
    onSuccess: (_, { leadId }) => {
      void qc.invalidateQueries({ queryKey: leadKeys.detail(leadId) });
      void qc.invalidateQueries({ queryKey: leadKeys.list() });
    }
  });
}

function useDeleteContact() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, contactId }: { leadId: string; contactId: string }) =>
      deleteContact(token, leadId, contactId),
    onSuccess: (_, { leadId }) => {
      void qc.invalidateQueries({ queryKey: leadKeys.detail(leadId) });
      void qc.invalidateQueries({ queryKey: leadKeys.list() });
    }
  });
}

function useCreateComment() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, content }: { leadId: string; content: string }) =>
      createComment(token, leadId, content),
    onSuccess: (_, { leadId }) => {
      void qc.invalidateQueries({ queryKey: leadKeys.detail(leadId) });
    }
  });
}

function useUpdateComment() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      leadId,
      commentId,
      content
    }: {
      leadId: string;
      commentId: string;
      content: string;
    }) => updateComment(token, leadId, commentId, content),
    onSuccess: (_, { leadId }) => {
      void qc.invalidateQueries({ queryKey: leadKeys.detail(leadId) });
    }
  });
}

function useDeleteComment() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ leadId, commentId }: { leadId: string; commentId: string }) =>
      deleteComment(token, leadId, commentId),
    onSuccess: (_, { leadId }) => {
      void qc.invalidateQueries({ queryKey: leadKeys.detail(leadId) });
    }
  });
}

function useCnpjLookup(cnpj: string, enabled: boolean) {
  const token = useAccessToken();
  return useQuery({
    queryKey: ['leads', 'cnpj', cnpj.replace(/\D/g, '')] as const,
    queryFn: () => getCnpjData(token, cnpj),
    enabled: !!token && enabled,
    staleTime: 5 * 60_000,
    retry: false
  });
}

export const LeadsRepository = {
  keys: leadKeys,
  useList,
  useDetail,
  useCreate,
  useUpdate,
  useDelete,
  useCreateContact,
  useUpdateContact,
  useDeleteContact,
  useCreateComment,
  useUpdateComment,
  useDeleteComment,
  useCnpjLookup
};
