import { NextRequest, NextResponse } from 'next/server';
import {
  GOOGLE_CALENDAR_ACCESS_TOKEN_COOKIE,
  GOOGLE_CALENDAR_EXPIRES_AT_COOKIE,
  GOOGLE_CALENDAR_REFRESH_TOKEN_COOKIE,
} from '../oauth/_lib';

export async function GET(request: NextRequest) {
  const accessToken = request.cookies.get(GOOGLE_CALENDAR_ACCESS_TOKEN_COOKIE)?.value || '';
  const refreshToken = request.cookies.get(GOOGLE_CALENDAR_REFRESH_TOKEN_COOKIE)?.value || '';
  const expiresAtRaw = request.cookies.get(GOOGLE_CALENDAR_EXPIRES_AT_COOKIE)?.value || '';
  const expiresAt = Number(expiresAtRaw);
  const hasValidAccessToken =
    Boolean(accessToken) && (!Number.isFinite(expiresAt) || expiresAt > Date.now());

  return NextResponse.json({
    connected: hasValidAccessToken || Boolean(refreshToken),
    tokenType: refreshToken ? 'refresh_token' : hasValidAccessToken ? 'access_token' : 'none',
    expiresAt: Number.isFinite(expiresAt) ? expiresAt : null
  });
}
