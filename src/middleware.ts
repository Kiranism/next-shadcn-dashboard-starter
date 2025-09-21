import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyToken } from '@/lib/auth/jwt-auth';

// Routes that require authentication
const protectedRoutes = [
  '/portal',
  '/portal/modules',
  '/portal/executive',
  '/portal/admin',
];

// Routes that are public
const publicRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/',
];

// Admin-only routes
const adminRoutes = [
  '/portal/admin',
];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route));
  const isPublicRoute = publicRoutes.some(route => pathname === route || pathname.startsWith(route));
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route));
  
  // Get token from cookie
  const token = request.cookies.get('amt-token')?.value;
  
  // If accessing a protected route without a token, redirect to login
  if (isProtectedRoute && !token) {
    const loginUrl = new URL('/auth/login', request.url);
    loginUrl.searchParams.set('from', pathname);
    return NextResponse.redirect(loginUrl);
  }
  
  // If accessing a public route with a token, redirect to portal
  if (isPublicRoute && token && pathname === '/auth/login') {
    return NextResponse.redirect(new URL('/portal', request.url));
  }
  
  // Verify token and check permissions for admin routes
  if (isAdminRoute && token) {
    try {
      const payload = verifyToken(token);
      
      // Check if user has admin access (only 4 users)
      const adminEmails = [
        'denauld@analyzemyteam.com',
        'courtney@analyzemyteam.com',
        'mel@analyzemyteam.com',
        'alexandra@analyzemyteam.com',
      ];
      
      if (!adminEmails.includes(payload.email)) {
        // Redirect non-admin users to main portal
        return NextResponse.redirect(new URL('/portal', request.url));
      }
    } catch (error) {
      // Invalid token, redirect to login
      const loginUrl = new URL('/auth/login', request.url);
      loginUrl.searchParams.set('from', pathname);
      
      // Clear invalid token
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('amt-token');
      return response;
    }
  }
  
  // Add security headers to response
  const response = NextResponse.next();
  
  // Security headers
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  
  // Add user info to headers for server components (if token exists)
  if (token) {
    try {
      const payload = verifyToken(token);
      response.headers.set('x-user-id', payload.id);
      response.headers.set('x-user-email', payload.email);
      response.headers.set('x-user-role', payload.role);
      response.headers.set('x-user-tier', payload.tier.toString());
    } catch (error) {
      // Invalid token, clear it
      response.cookies.delete('amt-token');
    }
  }
  
  return response;
}

// Configure which routes use this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*|public).*)',
  ],
};
