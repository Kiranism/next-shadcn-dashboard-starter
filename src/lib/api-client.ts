// Browser-side fetch wrapper for this app's own route handlers (src/app/api/*).
// Requests are same-origin, so the auth session cookie goes along automatically.
const BASE_URL = '/api';

export async function apiClient<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers }
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}

/** Builds a query string from filters, skipping empty values. */
export function toSearchParams(filters: Record<string, string | number | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== '') params.set(key, String(value));
  }
  return params.toString();
}
