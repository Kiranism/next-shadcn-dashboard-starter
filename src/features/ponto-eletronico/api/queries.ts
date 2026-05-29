import { queryOptions } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import type { AppSettings, SummaryResponse, TimeEntriesListResponse, UserResponse } from './types';

export const mySummaryQueryOptions = (token: string | null | undefined) =>
  queryOptions({
    queryKey: ['time-entries', 'summary', 'me'],
    queryFn: () => apiGet<SummaryResponse>('/time-entries/summary/me', token),
    enabled: !!token,
    refetchInterval: 60_000
  });

export const userSummaryQueryOptions = (token: string | null | undefined, userId: string) =>
  queryOptions({
    queryKey: ['time-entries', 'summary', userId],
    queryFn: () => apiGet<SummaryResponse>(`/time-entries/summary/${userId}`, token),
    enabled: !!token && !!userId
  });

export const teamWeekQueryOptions = (
  token: string | null | undefined,
  weekOffset: number,
  isSuperuser: boolean
) =>
  queryOptions({
    queryKey: ['time-entries', 'team', weekOffset],
    queryFn: () => apiGet<TimeEntriesListResponse>(`/time-entries?week=${weekOffset}`, token),
    enabled: !!token && isSuperuser,
    refetchInterval: weekOffset === 0 ? 60_000 : false
  });

export const usersQueryOptions = (token: string | null | undefined, isSuperuser: boolean) =>
  queryOptions({
    queryKey: ['users'],
    queryFn: () => apiGet<UserResponse[]>('/users', token),
    enabled: !!token && isSuperuser
  });

export const settingsQueryOptions = (token: string | null | undefined) =>
  queryOptions({
    queryKey: ['settings'],
    queryFn: () => apiGet<AppSettings>('/settings', token),
    enabled: !!token
  });
