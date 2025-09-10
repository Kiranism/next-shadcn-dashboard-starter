/**
 * @file: src/lib/jwt.ts
 * @description: JWT утилиты на базе `jose`, совместимые с Edge/Node
 * @project: SaaS Bonus System
 * @dependencies: jose
 * @created: 2025-09-03
 */

import { SignJWT, jwtVerify, type JWTPayload } from 'jose';

export type AdminJwtPayload = JWTPayload & {
  sub: string; // admin id
  email: string;
  role: 'SUPERADMIN' | 'ADMIN' | 'MANAGER';
};

function getSecretKey(): Uint8Array {
  let secret = process.env.JWT_SECRET;
  if (!secret) {
    if (process.env.NODE_ENV !== 'production') {
      secret = 'dev-secret';
    } else {
      throw new Error('JWT_SECRET is not set');
    }
  }
  return new TextEncoder().encode(secret);
}

export async function signJwt(
  payload: Omit<AdminJwtPayload, 'iat' | 'exp'>,
  expiresHours = 24 * 7
): Promise<string> {
  const key = getSecretKey();
  const token = await new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256', typ: 'JWT' })
    .setIssuedAt()
    .setExpirationTime(`${expiresHours}h`)
    .sign(key);
  return token;
}

export async function verifyJwt(
  token: string
): Promise<AdminJwtPayload | null> {
  try {
    const key = getSecretKey();
    const { payload } = await jwtVerify<AdminJwtPayload>(token, key);
    return payload as AdminJwtPayload;
  } catch {
    return null;
  }
}
