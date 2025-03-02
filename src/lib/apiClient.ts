'use client';

import { fetchWithLogout } from './fetchWithLogout';

/**
 * A reusable API client that:
 * 1) Uses a base URL (http://localhost:8000 by default).
 * 2) Merges in additional headers if needed.
 * 3) Still calls `fetchWithLogout` so that 401 triggers logout.
 */
export async function apiClient(
  endpoint: string,
  init?: RequestInit
): Promise<Response> {
  const fullUrl = `http://localhost:8000${endpoint}`;

  return fetchWithLogout(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });
}
