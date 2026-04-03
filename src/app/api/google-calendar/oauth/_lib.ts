import { google } from 'googleapis';

export const GOOGLE_CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

export const GOOGLE_CALENDAR_ACCESS_TOKEN_COOKIE = 'google_calendar_access_token';
export const GOOGLE_CALENDAR_REFRESH_TOKEN_COOKIE = 'google_calendar_refresh_token';
export const GOOGLE_CALENDAR_EXPIRES_AT_COOKIE = 'google_calendar_expires_at';
export const GOOGLE_CALENDAR_STATE_COOKIE = 'google_calendar_oauth_state';
export const GOOGLE_CALENDAR_RETURN_TO_COOKIE = 'google_calendar_oauth_return_to';

export function getGoogleOAuthRedirectUri(request: Request): string {
  return (
    process.env.GOOGLE_CALENDAR_OAUTH_REDIRECT_URI ||
    new URL('/api/google-calendar/oauth/callback', request.url).toString()
  );
}

export function getGoogleOAuthClient(request: Request) {
  const clientId = process.env.GOOGLE_CALENDAR_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CALENDAR_CLIENT_SECRET || '';

  if (!clientId || !clientSecret) {
    return null;
  }

  return new google.auth.OAuth2(clientId, clientSecret, getGoogleOAuthRedirectUri(request));
}

export function getSafeReturnTo(value: string | null): string {
  if (!value || !value.startsWith('/')) {
    return '/dashboard/trips';
  }

  return value;
}
