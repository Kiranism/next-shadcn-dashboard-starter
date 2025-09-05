/**
 * @file: src/lib/auth.ts
 * @description: Утилиты аутентификации: хэш паролей, JWT, cookie-сессии
 * @project: SaaS Bonus System
 * @dependencies: jsonwebtoken, bcryptjs, next/headers
 * @created: 2025-09-03
 * @author: AI Assistant + User
 */

import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { signJwt as signJwtJose, verifyJwt as verifyJwtJose } from './jwt';

export type JwtPayload = {
  sub: string; // admin account id
  email: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'MANAGER';
  iat: number;
  exp: number;
};

const ACCESS_TOKEN_COOKIE = 'sb_auth';
const DEFAULT_EXPIRES_HOURS = 24 * 7; // 7 дней

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error('JWT_SECRET is not set');
  return secret;
}

export async function hashPassword(plain: string): Promise<string> {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(plain, salt);
}

export async function verifyPassword(
  plain: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signJwtSyncUnsupported(): never {
  throw new Error('signJwtSyncUnsupported: use signJwtAsync instead');
}

export async function signJwt(
  payload: Omit<JwtPayload, 'iat' | 'exp'>,
  expiresHours = DEFAULT_EXPIRES_HOURS
): Promise<string> {
  return signJwtJose(payload, expiresHours);
}

export async function verifyJwt(token: string): Promise<JwtPayload | null> {
  return (await verifyJwtJose(token)) as JwtPayload | null;
}

export async function setSessionCookie(
  token: string,
  expiresHours = DEFAULT_EXPIRES_HOURS
): Promise<void> {
  const cookieStore = await cookies();
  const maxAge = expiresHours * 60 * 60;
  cookieStore.set(ACCESS_TOKEN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge
  });
}

export async function clearSessionCookie(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(ACCESS_TOKEN_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0
  });
}

export async function getTokenFromCookies(): Promise<string | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  return token ?? null;
}

export async function getCurrentAdmin(): Promise<JwtPayload | null> {
  const token = await getTokenFromCookies();
  if (!token) return null;
  return verifyJwt(token);
}

export async function requireAdmin(
  roles?: Array<JwtPayload['role']>
): Promise<JwtPayload> {
  const admin = await getCurrentAdmin();
  if (!admin) throw new Error('UNAUTHORIZED');
  if (roles && roles.length > 0 && !roles.includes(admin.role)) {
    throw new Error('FORBIDDEN');
  }
  return admin;
}
