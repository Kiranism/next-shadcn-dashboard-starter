import { NextRequest, NextResponse } from 'next/server';
import {
  GOOGLE_CALENDAR_RETURN_TO_COOKIE,
  GOOGLE_CALENDAR_SCOPES,
  GOOGLE_CALENDAR_STATE_COOKIE,
  getGoogleOAuthClient,
  getSafeReturnTo,
} from '../_lib';

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

  const returnTo = getSafeReturnTo(request.nextUrl.searchParams.get('returnTo'));
  const state = crypto.randomUUID();

  const authorizationUrl = oauthClient.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: true,
    scope: GOOGLE_CALENDAR_SCOPES,
    state
  });

  const response = NextResponse.redirect(authorizationUrl);
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge: 10 * 60
  };

  response.cookies.set(GOOGLE_CALENDAR_STATE_COOKIE, state, cookieOptions);
  response.cookies.set(GOOGLE_CALENDAR_RETURN_TO_COOKIE, returnTo, cookieOptions);

  return response;
}
