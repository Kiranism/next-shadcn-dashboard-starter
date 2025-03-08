// Protecting routes with next-auth
// https://next-auth.js.org/configuration/nextjs#middleware
// https://nextjs.org/docs/app/building-your-application/routing/middleware

import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { locales, defaultLocale } from './config/locales';
import NextAuth from 'next-auth';
import authConfig from '@/lib/auth.config';

// Create the internationalization middleware
const intlMiddleware = createIntlMiddleware({
  locales,
  defaultLocale,
  localePrefix: 'as-needed', // 'always' | 'as-needed' | 'never'
  localeDetection: true // Enable locale detection based on browser settings
});

// Auth middleware setup
const { auth } = NextAuth(authConfig);

// Export the middleware function
export default async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // If the path already contains 'not-found', skip any further redirects to prevent loops
  if (path.includes('/not-found')) {
    return NextResponse.next();
  }

  // Apply internationalization middleware to all paths
  const intlResult = await intlMiddleware(request);

  // Check if the path is protected (requires authentication)
  if (path.startsWith('/dashboard')) {
    // Get authentication status using Auth.js
    const authRequest = auth as any;
    const session = await authRequest(request);

    // If not authenticated, redirect to sign-in page
    if (!session) {
      // Determine the locale from the path or use default
      const localeFromPath = locales.find(
        (locale) => path.startsWith(`/${locale}/`) || path === `/${locale}`
      );

      // Create redirect URL with proper locale
      const locale = localeFromPath || defaultLocale;
      const signInUrl = new URL(
        `/${locale === defaultLocale ? '' : locale}`,
        request.url
      );
      return NextResponse.redirect(signInUrl);
    }
  }

  // If everything is ok, just continue with the localized response
  return intlResult;
}

// Update the config to match all paths that need either localization or auth
// Exclude not-found paths to prevent redirect loops
export const config = {
  matcher: [
    // Include all paths except api routes, static files, and not-found
    '/((?!api|_next/static|_next/image|favicon.ico|not-found).*)'
  ]
};
