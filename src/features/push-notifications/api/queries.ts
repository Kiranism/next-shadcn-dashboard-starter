import { useQuery } from '@tanstack/react-query';
import { useAccessToken } from '@/repositories/_shared/use-access-token';
import { getVapidPublicKey } from './service';

export const pushNotificationKeys = {
  all: () => ['push-notifications'] as const,
  vapidKey: () => ['push-notifications', 'vapid-key'] as const
};

export function useVapidPublicKeyQuery() {
  const token = useAccessToken();
  return useQuery({
    queryKey: pushNotificationKeys.vapidKey(),
    queryFn: () => getVapidPublicKey(token),
    enabled: !!token,
    staleTime: Infinity
  });
}
