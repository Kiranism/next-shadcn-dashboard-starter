import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Public routes that don't require authentication
const publicRoutes = ['/auth/sign-in', '/auth/sign-up', '/'];

// Admin-only routes
const adminRoutes = ['/portal/admin'];

// Admin users (matches AMT_ADMIN_USERS from jwt-auth.ts)
const ADMIN_EMAILS = [
  'denauld@analyzemyteam.com',
  'courtney@analyzemyteam.com',
  'mel@analyzemyteam.com',
  'alexandra@analyzemyteam.com',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = request.cookies.get('amt-token')?.value;

  // Redirect to sign-in if no token
  if (!token) {
    const signInUrl = new URL('/auth/sign-in', request.url);
    signInUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(signInUrl);
  }

  // Verify token (basic validation - full verification happens server-side)
  try {
    // For admin routes, check if user email is in admin list
    if (adminRoutes.some((route) => pathname.startsWith(route))) {
      // In production, decode JWT and check email
      // For now, this is a placeholder that will be enhanced
      const response = NextResponse.next();
      response.headers.set('x-amt-admin-check', 'required');
      return response;
    }

    return NextResponse.next();
  } catch (error) {
    // Invalid token, redirect to sign-in
    const signInUrl = new URL('/auth/sign-in', request.url);
    return NextResponse.redirect(signInUrl);
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
