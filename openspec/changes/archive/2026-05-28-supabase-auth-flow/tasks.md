## 1. Dependencies & Environment

- [x] 1.1 Install `@supabase/supabase-js` and `@supabase/ssr`
- [x] 1.2 Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` to `env.example.txt` and `.env.local`

## 2. Supabase Client Utilities

- [x] 2.1 Create `src/utils/supabase/client.ts` — browser client using `createBrowserClient`
- [x] 2.2 Create `src/utils/supabase/server.ts` — server client using `createServerClient` with `next/headers` cookies
- [x] 2.3 Create `src/utils/supabase/middleware.ts` — middleware client using `createServerClient` with request/response cookies

## 3. Middleware

- [x] 3.1 Rewrite `src/middleware.ts` to use the middleware Supabase client, call `getUser()` to refresh the session, and protect `/dashboard/**` routes (redirect to `/auth/sign-in` if no session)
- [x] 3.2 Redirect already-authenticated users away from `/auth/**` routes to `/dashboard`
- [x] 3.3 Configure `matcher` to exclude static assets and Next.js internals

## 4. Session Context

- [x] 4.1 Create `src/components/providers/session-provider.tsx` — Client Component that initializes a Supabase browser client, subscribes to `onAuthStateChange`, and provides `{ user, session, loading }` via React context
- [x] 4.2 Export `useSession()` hook from the provider
- [x] 4.3 Add `SessionProvider` to `src/components/layout/providers.tsx` wrapping the app

## 5. Auth Callback Route

- [x] 5.1 Create `src/app/auth/callback/route.ts` — Route Handler that reads the `code` query param, calls `supabase.auth.exchangeCodeForSession(code)`, and redirects to `/dashboard` on success or `/auth/sign-in?error=oauth_error` on failure

## 6. Auth Layout

- [x] 6.1 Create `src/app/auth/layout.tsx` — centered layout with app logo/name, no sidebar or header nav

## 7. Sign-Up Page

- [x] 7.1 Create `src/features/auth/components/sign-up-form.tsx` — form using `useAppForm` with email, password, and confirm-password fields; validates passwords match; calls `supabase.auth.signUp()`
- [x] 7.2 Create `src/app/auth/sign-up/page.tsx` — renders the sign-up form and "Continue with Google" button; links to `/auth/sign-in`
- [x] 7.3 Show post-sign-up confirmation message: "Check your inbox to confirm your email"

## 8. Sign-In Page

- [x] 8.1 Create `src/features/auth/components/sign-in-form.tsx` — form using `useAppForm` with email and password fields; calls `supabase.auth.signInWithPassword()`; redirects to `/dashboard` on success
- [x] 8.2 Create `src/app/auth/sign-in/page.tsx` — renders the sign-in form and "Continue with Google" button; links to `/auth/sign-up` and `/auth/forgot-password`

## 9. Google OAuth

- [x] 9.1 Create `src/features/auth/components/google-auth-button.tsx` — button that calls `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: '<origin>/auth/callback' } })`
- [x] 9.2 Import and render `GoogleAuthButton` in both sign-in and sign-up pages

## 10. Forgot-Password Page

- [x] 10.1 Create `src/features/auth/components/forgot-password-form.tsx` — form with email field; calls `supabase.auth.resetPasswordForEmail()` with `redirectTo: '<origin>/auth/callback'`
- [x] 10.2 Create `src/app/auth/forgot-password/page.tsx` — renders the forgot-password form; links back to `/auth/sign-in`

## 11. Reset-Password Page

- [x] 11.1 Create `src/features/auth/components/reset-password-form.tsx` — form with new-password and confirm-password fields; calls `supabase.auth.updateUser({ password })` after verifying session from reset link
- [x] 11.2 Create `src/app/auth/reset-password/page.tsx` — reads session state on mount; if no valid reset session, shows error with link to `/auth/forgot-password`

## 12. Sign-Out

- [x] 12.1 Update `src/components/layout/user-nav.tsx` to call `supabase.auth.signOut()` and redirect to `/auth/sign-in` on sign-out click

## 13. Nav & Config Cleanup

- [x] 13.1 Remove any remaining Clerk imports from `src/components/layout/providers.tsx`, `src/components/layout/header.tsx`, and `src/config/nav-config.ts`
- [x] 13.2 Update `src/components/layout/user-nav.tsx` to read user info from `useSession()` instead of Clerk hooks

## 14. Validation

- [x] 14.1 Test email sign-up → confirmation email → sign-in flow end-to-end
- [x] 14.2 Test Google OAuth sign-in flow end-to-end
- [x] 14.3 Test forgot-password → reset link → new password flow
- [x] 14.4 Test unauthenticated access to `/dashboard` redirects to `/auth/sign-in`
- [x] 14.5 Test authenticated access to `/auth/sign-in` redirects to `/dashboard`
