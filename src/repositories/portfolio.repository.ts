import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import { useAccessToken } from './_shared/use-access-token';
import type { PortfolioItem, CreatePortfolioPayload, UpdatePortfolioPayload } from '@/types/api';

export const portfolioKeys = {
  all: () => ['portfolio'] as const,
  list: () => ['portfolio', 'list'] as const
};

async function getPortfolio(token: string): Promise<PortfolioItem[]> {
  return apiGet<PortfolioItem[]>('/portfolio', token);
}

async function createPortfolioItem(
  token: string,
  payload: CreatePortfolioPayload
): Promise<PortfolioItem> {
  return apiPost<PortfolioItem>('/portfolio', token, payload);
}

async function updatePortfolioItem(
  token: string,
  id: string,
  payload: UpdatePortfolioPayload
): Promise<PortfolioItem> {
  return apiPatch<PortfolioItem>(`/portfolio/${id}`, token, payload);
}

async function deletePortfolioItem(token: string, id: string): Promise<void> {
  return apiDelete<void>(`/portfolio/${id}`, token);
}

function useList() {
  const token = useAccessToken();
  return useQuery({
    queryKey: portfolioKeys.list(),
    queryFn: () => getPortfolio(token),
    enabled: !!token
  });
}

function useCreate() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePortfolioPayload) => createPortfolioItem(token, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: portfolioKeys.all() });
    }
  });
}

function useUpdate() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: UpdatePortfolioPayload }) =>
      updatePortfolioItem(token, id, payload),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: portfolioKeys.all() });
    }
  });
}

function useDelete() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deletePortfolioItem(token, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: portfolioKeys.all() });
    }
  });
}

export const PortfolioRepository = {
  keys: portfolioKeys,
  useList,
  useCreate,
  useUpdate,
  useDelete
};
