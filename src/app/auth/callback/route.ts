import { createClient } from '@/utils/supabase/server';
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // Google/Supabase forwards error params when auth fails or is cancelled
  const oauthError = searchParams.get('error');

  if (oauthError) {
    const params = new URLSearchParams({ error: oauthError });
    return NextResponse.redirect(`${origin}/auth/sign-in?${params.toString()}`);
  }

  const code = searchParams.get('code');
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}/dashboard`);
    }
    return NextResponse.redirect(`${origin}/auth/sign-in?error=exchange_failed`);
  }

  return NextResponse.redirect(`${origin}/auth/sign-in?error=no_code`);
}
