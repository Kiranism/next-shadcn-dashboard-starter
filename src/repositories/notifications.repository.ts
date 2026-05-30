import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiDelete, apiPost } from '@/lib/api-client';
import { useAccessToken } from './_shared/use-access-token';

export type NotificationOrigin = 'automatic' | 'directed';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  origin: NotificationOrigin;
  sent_at: string;
  created_by: string | null;
  created_at: string;
}

export interface SendNotificationPayload {
  title: string;
  description?: string;
  target: {
    sector?: string;
    role?: string;
  };
}

export interface SendNotificationResponse {
  count: number;
}

const keys = {
  all: () => ['notifications'] as const,
  list: () => ['notifications', 'list'] as const
};

async function getNotifications(token: string): Promise<Notification[]> {
  return apiGet<Notification[]>('/notifications', token);
}

async function deleteNotification(token: string, id: string): Promise<void> {
  return apiDelete<void>(`/notifications/${id}`, token);
}

async function sendNotification(
  token: string,
  payload: SendNotificationPayload
): Promise<SendNotificationResponse> {
  return apiPost<SendNotificationResponse>('/notifications', token, payload);
}

function useNotifications() {
  const token = useAccessToken();
  return useQuery({
    queryKey: keys.list(),
    queryFn: () => getNotifications(token),
    enabled: !!token,
    refetchInterval: 60_000
  });
}

function useDeleteNotification() {
  const token = useAccessToken();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => deleteNotification(token, id),
    onMutate: async (id) => {
      await qc.cancelQueries({ queryKey: keys.list() });
      const prev = qc.getQueryData<Notification[]>(keys.list());
      qc.setQueryData<Notification[]>(keys.list(), (old) => old?.filter((n) => n.id !== id) ?? []);
      return { prev };
    },
    onError: (_err, _id, ctx) => {
      qc.setQueryData(keys.list(), ctx?.prev);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: keys.all() });
    }
  });
}

function useSendNotification() {
  const token = useAccessToken();
  return useMutation({
    mutationFn: (payload: SendNotificationPayload) => sendNotification(token, payload)
  });
}

export const NotificationsRepository = {
  keys,
  useNotifications,
  useDeleteNotification,
  useSendNotification
};
