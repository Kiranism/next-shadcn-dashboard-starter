'use client';

import { signOut } from 'next-auth/react';

export async function fetchWithLogout(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const res = await fetch(input, init);

  // If we get 401, it likely means the token is invalid or expired
  if (res.status === 401) {
    // Force a sign out to clear session and redirect
    signOut({
      callbackUrl: '/' // or wherever you want to redirect
    });
  }

  return res;
}
