import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, apiPatch, apiDelete } from '@/lib/api-client';
import { useAccessToken } from './_shared/use-access-token';

export type ActivityPriority = 'alta' | 'media' | 'baixa';

export interface Activity {
  id: string;
  user_id: string;
  user_name: string;
  name: string;
  description: string | null;
  date: string;
  time_start: string;
  time_end: string;
  priority: ActivityPriority;
  created_at: string;
  updated_at: string;
}

export interface CreateActivityInput {
  name: string;
  description?: string;
  date: string;
  time_start: string;
  time_end: string;
  priority: ActivityPriority;
}

export interface UpdateActivityInput {
  name?: string;
  description?: string;
  date?: string;
  time_start?: string;
  time_end?: string;
  priority?: ActivityPriority;
}

export interface ListActivitiesParams {
  id?: string;
  date?: string;
  from?: string;
  to?: string;
}

const keys = {
  all: () => ['activities'] as const,
  list: (params?: ListActivitiesParams) => ['activities', 'list', params ?? {}] as const,
  myList: (params?: ListActivitiesParams) => ['activities', 'me', params ?? {}] as const
};

function buildActivitiesQuery(params?: ListActivitiesParams): string {
  const search = new URLSearchParams();
  if (params?.id) search.set('id', params.id);
  if (params?.date) search.set('date', params.date);
  if (params?.from) search.set('from', params.from);
  if (params?.to) search.set('to', params.to);
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

async function listActivities(token: string, params?: ListActivitiesParams): Promise<Activity[]> {
  return apiGet<Activity[]>(`/activities${buildActivitiesQuery(params)}`, token);
}

async function listMyActivities(token: string, params?: ListActivitiesParams): Promise<Activity[]> {
  return apiGet<Activity[]>(`/activities/me${buildActivitiesQuery(params)}`, token);
}

async function createActivity(token: string, data: CreateActivityInput): Promise<Activity> {
  return apiPost<Activity>('/activities', token, data);
}

async function updateActivity(
  token: string,
  id: string,
  data: UpdateActivityInput
): Promise<Activity> {
  return apiPatch<Activity>(`/activities/${id}`, token, data);
}

async function deleteActivity(token: string, id: string): Promise<void> {
  return apiDelete<void>(`/activities/${id}`, token);
}

function useActivities(params?: ListActivitiesParams) {
  const token = useAccessToken();
  return useQuery({
    queryKey: keys.list(params),
    queryFn: () => listActivities(token, params),
    enabled: !!token
  });
}

function useMyActivities(params?: ListActivitiesParams) {
  const token = useAccessToken();
  return useQuery({
    queryKey: keys.myList(params),
    queryFn: () => listMyActivities(token, params),
    enabled: !!token
  });
}

function useCreateActivity() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateActivityInput) => createActivity(token, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.all() });
    }
  });
}

function useUpdateActivity() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateActivityInput }) =>
      updateActivity(token, id, data),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.all() });
    }
  });
}

function useDeleteActivity() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteActivity(token, id),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.all() });
    }
  });
}

export const ActivitiesRepository = {
  keys,
  listActivities,
  listMyActivities,
  useActivities,
  useMyActivities,
  useCreateActivity,
  useUpdateActivity,
  useDeleteActivity
};
