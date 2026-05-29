import { useSession } from '@/components/providers/session-provider';

export function useAccessToken(): string {
  const { session } = useSession();
  return session?.access_token ?? '';
}
