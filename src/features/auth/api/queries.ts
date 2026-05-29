import { queryOptions } from '@tanstack/react-query';
import { apiGet } from '@/lib/api-client';
import { getRank, type UserProfile } from '@/types/user-profile';

interface AuthMeResponse {
  id: string;
  email: string;
  name: string;
  role: string;
  sector: string | null;
  cpf: string | null;
}

export const userProfileQueryOptions = (token: string | null | undefined) =>
  queryOptions({
    queryKey: ['auth', 'me', token],
    queryFn: async () => {
      const data = await apiGet<AuthMeResponse>('/auth/me', token);
      const profile: UserProfile = {
        ...data,
        role: data.role as UserProfile['role'],
        rank: getRank(data.role)
      };
      return profile;
    },
    enabled: !!token,
    staleTime: 5 * 60 * 1000
  });
