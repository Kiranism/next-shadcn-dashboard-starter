'use server';

import { cookies } from 'next/headers';

export async function setRoleCookie(role: string) {
  const cookieStore = await cookies();
  cookieStore.set('wattdash-role', role, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60, // 1 hour
    path: '/'
  });
}
