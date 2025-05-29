import { NextRequest, NextResponse } from 'next/server';

export function middleware(req: NextRequest) {
  const token = req.cookies.get('__yes_jobs_access_token__')?.value;
  const role = req.cookies.get('__yes_jobs_user_role__')?.value;
  // Check if both token and role exist and role is ADMIN
  if (!token || !role) {
    return NextResponse.redirect(new URL('/auth/sign-in', req.url));
  }
  // If path is exactly /dashboard, redirect to /dashboard/overview
  if (req.nextUrl.pathname === '/dashboard') {
    return NextResponse.redirect(new URL('/dashboard/overview', req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/profile/:path*', '/dashboard']
};
