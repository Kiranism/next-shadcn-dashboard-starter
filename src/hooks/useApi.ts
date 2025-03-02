'use client';

import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/apiClient';
import { useCallback } from 'react';

export function useApi() {
  const { data: session } = useSession();
  const token = session?.accessToken || '';

  /**
   * Generic call function that merges the user's bearer token
   * into headers. Also calls `apiClient` to handle base URL + logout-on-401.
   */
  const callApi = useCallback(
    async (endpoint: string, init?: RequestInit) => {
      return apiClient(endpoint, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(init?.headers ?? {})
        }
      });
    },
    [token]
  );

  return callApi;
}
