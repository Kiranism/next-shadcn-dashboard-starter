import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api-client';
import { useAccessToken } from './_shared/use-access-token';
import { useUserProfile } from '@/components/providers/user-profile-provider';
import type {
  SummaryResponse,
  TimeEntriesListResponse,
  ClockInResponse,
  ClockOutResponse
} from '@/types/api';

const keys = {
  summaryMe: () => ['time-entries', 'summary', 'me'] as const,
  summaryUser: (userId: string) => ['time-entries', 'summary', userId] as const,
  team: (weekOffset: number) => ['time-entries', 'team', weekOffset] as const
};

async function getMySummary(token: string): Promise<SummaryResponse> {
  return apiGet<SummaryResponse>('/time-entries/summary/me', token);
}

async function getUserSummary(token: string, userId: string): Promise<SummaryResponse> {
  return apiGet<SummaryResponse>(`/time-entries/summary/${userId}`, token);
}

async function getTeamWeek(token: string, weekOffset: number): Promise<TimeEntriesListResponse> {
  return apiGet<TimeEntriesListResponse>(`/time-entries?week=${weekOffset}`, token);
}

async function clockIn(token: string): Promise<ClockInResponse> {
  return apiPost<ClockInResponse>('/time-entries/clock-in', token);
}

async function clockOut(token: string): Promise<ClockOutResponse> {
  return apiPost<ClockOutResponse>('/time-entries/clock-out', token);
}

function useMySummary() {
  const token = useAccessToken();
  return useQuery({
    queryKey: keys.summaryMe(),
    queryFn: () => getMySummary(token),
    enabled: !!token,
    refetchInterval: 60_000
  });
}

function useUserSummary(userId: string) {
  const token = useAccessToken();
  return useQuery({
    queryKey: keys.summaryUser(userId),
    queryFn: () => getUserSummary(token, userId),
    enabled: !!token && !!userId
  });
}

function useTeamWeek(weekOffset: number) {
  const token = useAccessToken();
  const { rank } = useUserProfile();
  const isSuperuser = rank >= 3;
  return useQuery({
    queryKey: keys.team(weekOffset),
    queryFn: () => getTeamWeek(token, weekOffset),
    enabled: !!token && isSuperuser,
    refetchInterval: weekOffset === 0 ? 60_000 : false
  });
}

function useClockIn() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clockIn(token),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.summaryMe() });
    }
  });
}

function useClockOut() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => clockOut(token),
    onSuccess: () => {
      void qc.invalidateQueries({ queryKey: keys.summaryMe() });
    }
  });
}

export const TimeEntriesRepository = {
  keys,
  getMySummary,
  getUserSummary,
  getTeamWeek,
  clockIn,
  clockOut,
  useMySummary,
  useUserSummary,
  useTeamWeek,
  useClockIn,
  useClockOut
};
