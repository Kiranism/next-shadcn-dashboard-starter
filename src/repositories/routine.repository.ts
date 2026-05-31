import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPut } from '@/lib/api-client';
import { useAccessToken } from './_shared/use-access-token';

export type RoutineDay = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';
export type RoutineSlots = Record<RoutineDay, boolean[]>;

export interface RoutineResponse {
  slots: RoutineSlots | null;
}

export interface RoutineSummaryMember {
  id: string;
  name: string;
  role: string;
  sector: string | null;
}

/**
 * Per slot list of available subordinates. Keys are the day (`mon`…`sun`) and,
 * inside each day, the start hour as a string (`"8"`…`"21"`). Only slots with at
 * least one available subordinate are present.
 */
export type RoutineAvailability = Partial<
  Record<RoutineDay, Record<string, RoutineSummaryMember[]>>
>;

export interface RoutineSummary {
  /** Aggregated availability across all subordinates with a configured routine. */
  availability: RoutineAvailability;
  /** Subordinates that never configured their routine — provided by the API. */
  unconfigured: RoutineSummaryMember[];
}

const keys = {
  routine: () => ['routine', 'me'] as const,
  summary: () => ['routine', 'summary'] as const,
  user: (userId: string) => ['routine', 'user', userId] as const
};

async function getRoutine(token: string): Promise<RoutineResponse> {
  return apiGet<RoutineResponse>('/routine', token);
}

async function getRoutineSummary(token: string): Promise<RoutineSummary> {
  return apiGet<RoutineSummary>('/routine/summary', token);
}

async function getUserRoutine(token: string, userId: string): Promise<RoutineResponse> {
  return apiGet<RoutineResponse>(`/routine/${userId}`, token);
}

async function updateRoutine(token: string, slots: RoutineSlots): Promise<void> {
  return apiPut<void>('/routine', token, { slots });
}

function useGetRoutine() {
  const token = useAccessToken();
  return useQuery({
    queryKey: keys.routine(),
    queryFn: () => getRoutine(token),
    enabled: !!token
  });
}

function useUpdateRoutine() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (slots: RoutineSlots) => updateRoutine(token, slots),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.routine() });
    }
  });
}

function useRoutineSummary(enabled = true) {
  const token = useAccessToken();
  return useQuery({
    queryKey: keys.summary(),
    queryFn: () => getRoutineSummary(token),
    enabled: !!token && enabled
  });
}

function useUserRoutine(userId: string, enabled = true) {
  const token = useAccessToken();
  return useQuery({
    queryKey: keys.user(userId),
    queryFn: () => getUserRoutine(token, userId),
    enabled: !!token && !!userId && enabled
  });
}

export const RoutineRepository = {
  keys,
  getRoutine,
  getRoutineSummary,
  getUserRoutine,
  updateRoutine,
  useGetRoutine,
  useRoutineSummary,
  useUserRoutine,
  useUpdateRoutine
};
