import { apiGet, apiPatch, apiPost } from '@/lib/api-client';
import type { AppSettings, ClockInResponse, ClockOutResponse } from './types';

export const clockIn = (token: string) => apiPost<ClockInResponse>('/time-entries/clock-in', token);

export const clockOut = (token: string) =>
  apiPost<ClockOutResponse>('/time-entries/clock-out', token);

export const getSettings = (token: string) => apiGet<AppSettings>('/settings', token);

export const updateSettings = (token: string, data: Partial<AppSettings>) =>
  apiPatch<AppSettings>('/settings', token, data);
