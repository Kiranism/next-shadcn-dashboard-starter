import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch } from '@/lib/api-client';
import { useAccessToken } from './_shared/use-access-token';
import type { AppSettings } from '@/types/api';

const keys = {
  settings: () => ['settings'] as const
};

async function get(token: string): Promise<AppSettings> {
  return apiGet<AppSettings>('/settings', token);
}

async function update(token: string, data: Partial<AppSettings>): Promise<AppSettings> {
  return apiPatch<AppSettings>('/settings', token, data);
}

function useSettings() {
  const token = useAccessToken();
  return useQuery({
    queryKey: keys.settings(),
    queryFn: () => get(token),
    enabled: !!token
  });
}

function useUpdateSettings() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<AppSettings>) => update(token, data),
    onSuccess: (updated) => {
      qc.setQueryData(keys.settings(), updated);
      void qc.invalidateQueries({ queryKey: ['time-entries', 'team'] });
    }
  });
}

export const SettingsRepository = {
  keys,
  get,
  update,
  useSettings,
  useUpdateSettings
};
