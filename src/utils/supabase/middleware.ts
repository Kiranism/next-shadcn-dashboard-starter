import { createServerClient } from '@supabase/ssr';
import { type NextRequest, NextResponse } from 'next/server';
import { getMinRankForPath, getRankFromRole } from '@/config/nav-config.utils';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        }
      }
    }
  );

  // Refresh the session — must use getUser(), not getSession()
  const {
    data: { user }
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isAuthRoute = pathname.startsWith('/auth');
  const isDashboardRoute = pathname.startsWith('/dashboard');
  const isOnboardingRoute = pathname.startsWith('/onboarding');

  if (!user && (isDashboardRoute || isOnboardingRoute)) {
    const url = request.nextUrl.clone();
    url.pathname = '/auth/sign-in';
    return NextResponse.redirect(url);
  }

  if (user && isAuthRoute) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Role-based route protection using the wattdash-role cookie
  if (user && isDashboardRoute) {
    const roleCookie = request.cookies.get('wattdash-role')?.value;
    if (roleCookie) {
      const rank = getRankFromRole(roleCookie);
      const minRank = getMinRankForPath(pathname);
      if (minRank !== null && rank < minRank) {
        const url = request.nextUrl.clone();
        url.pathname = '/dashboard/ponto';
        return NextResponse.redirect(url);
      }
    }
    // If cookie is absent but user is authenticated, allow through — RoleGuard handles it client-side
  }

  return supabaseResponse;
}
