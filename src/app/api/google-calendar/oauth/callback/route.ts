import { NextRequest, NextResponse } from 'next/server';
import {
  GOOGLE_CALENDAR_ACCESS_TOKEN_COOKIE,
  GOOGLE_CALENDAR_EXPIRES_AT_COOKIE,
  GOOGLE_CALENDAR_REFRESH_TOKEN_COOKIE,
  GOOGLE_CALENDAR_RETURN_TO_COOKIE,
  GOOGLE_CALENDAR_STATE_COOKIE,
  getGoogleOAuthClient,
  getSafeReturnTo,
} from '../_lib';

function clearHandshakeCookies(response: NextResponse) {
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 0
  };

  response.cookies.set(GOOGLE_CALENDAR_STATE_COOKIE, '', cookieOptions);
  response.cookies.set(GOOGLE_CALENDAR_RETURN_TO_COOKIE, '', cookieOptions);
}

export async function GET(request: NextRequest) {
  const oauthClient = getGoogleOAuthClient(request);

  if (!oauthClient) {
    return NextResponse.json(
      {
        error:
          'Google Calendar OAuth is not configured. Set GOOGLE_CALENDAR_CLIENT_ID and GOOGLE_CALENDAR_CLIENT_SECRET.'
      },
      { status: 500 }
    );
  }

  const code = request.nextUrl.searchParams.get('code');
  const state = request.nextUrl.searchParams.get('state');
  const error = request.nextUrl.searchParams.get('error');
  const expectedState = request.cookies.get(GOOGLE_CALENDAR_STATE_COOKIE)?.value || '';
  const returnTo = getSafeReturnTo(request.cookies.get(GOOGLE_CALENDAR_RETURN_TO_COOKIE)?.value || null);

  if (error) {
    const redirectUrl = new URL(returnTo, request.url);
    redirectUrl.searchParams.set('calendar_error', error);
    const response = NextResponse.redirect(redirectUrl);
    clearHandshakeCookies(response);
    return response;
  }

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.json(
      { error: 'Invalid Google OAuth callback state.' },
      { status: 400 }
    );
  }

  const { tokens } = await oauthClient.getToken(code);
  const redirectUrl = new URL(returnTo, request.url);
  redirectUrl.searchParams.set('calendar_connected', '1');

  const response = NextResponse.redirect(redirectUrl);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 60 * 60 * 24 * 30
  };

  if (tokens.access_token) {
    response.cookies.set(GOOGLE_CALENDAR_ACCESS_TOKEN_COOKIE, tokens.access_token, cookieOptions);
  }

  if (typeof tokens.expiry_date === 'number') {
    response.cookies.set(
      GOOGLE_CALENDAR_EXPIRES_AT_COOKIE,
      String(tokens.expiry_date),
      cookieOptions,
    );
  }

  if (tokens.refresh_token) {
    response.cookies.set(GOOGLE_CALENDAR_REFRESH_TOKEN_COOKIE, tokens.refresh_token, cookieOptions);
  }

  clearHandshakeCookies(response);
  return response;
}
