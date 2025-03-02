'use client';

import { fetchWithLogout } from './fetchWithLogout';

// Now we read the base URL from an env variable:
const baseUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000';

/**
 * A reusable API client that:
 * 1) Uses a base URL (from NEXT_PUBLIC_API_URL or localhost).
 * 2) Merges in additional headers if needed.
 * 3) Still calls `fetchWithLogout` so that 401 triggers logout.
 */
export async function apiClient(
  endpoint: string,
  init?: RequestInit
): Promise<Response> {
  const fullUrl = `${baseUrl}${endpoint}`;

  return fetchWithLogout(fullUrl, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {})
    },
    ...init
  });
}
