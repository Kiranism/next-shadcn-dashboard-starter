## Why

The application currently has no authentication layer. We need a production-ready auth system using Supabase Auth so users can securely sign up, sign in, and access protected dashboard areas — without building auth infrastructure from scratch.

## What Changes

- Replace existing placeholder/Clerk auth references with Supabase Auth
- Add email + password sign-up and sign-in flows with email confirmation
- Add Google OAuth sign-in
- Add protected route middleware that redirects unauthenticated users
- Add auth callback route to handle OAuth redirects and email confirmation
- Add server-side session management via Supabase SSR client
- Add user session context available throughout the app

## Capabilities

### New Capabilities

- `auth-email-password`: Sign-up and sign-in with email + password, including email confirmation and password reset flows
- `auth-google-oauth`: Sign-in with Google via Supabase OAuth, handling redirect and callback
- `auth-session-management`: Server-side session reading with Supabase SSR, middleware-based route protection, and client-side session context
- `auth-ui`: Auth pages (sign-in, sign-up, forgot password, reset password) built with shadcn/ui components

### Modified Capabilities

<!-- None — this is a greenfield auth implementation replacing placeholder code -->

## Impact

- **Dependencies**: Add `@supabase/supabase-js`, `@supabase/ssr`
- **Env vars**: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- **Files removed/replaced**: `src/app/auth/**`, `src/features/auth/**`, Clerk-specific components
- **Middleware**: `src/middleware.ts` rewritten to use Supabase session refresh
- **Supabase project**: Requires a Supabase project with Email Auth enabled and Google OAuth provider configured
