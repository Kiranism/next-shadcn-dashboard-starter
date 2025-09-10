import { NextRequest, NextResponse } from 'next/server';
import { verifyJwt } from '@/lib/jwt';

const PROTECTED_MATCHERS = ['/dashboard', '/api/admin', '/api/projects'];

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const requiresAuth = PROTECTED_MATCHERS.some((p) => pathname.startsWith(p));
  if (!requiresAuth) return NextResponse.next();

  // Dev bypass for API with header x-dev-auth: 1
  if (process.env.NODE_ENV !== 'production' && pathname.startsWith('/api/')) {
    const devBypass = req.headers.get('x-dev-auth');
    if (devBypass === '1') {
      return NextResponse.next();
    }
  }

  const token = req.cookies.get('sb_auth')?.value;
  const payload = token ? await verifyJwt(token) : null;

  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const signInUrl = new URL('/auth/sign-in', req.url);
    signInUrl.searchParams.set('redirect_url', req.url);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    '/(api|trpc)(.*)'
  ]
};
