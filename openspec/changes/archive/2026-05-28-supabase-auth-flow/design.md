## Context

The app is a Next.js 16 App Router dashboard. Auth was previously wired to Clerk (now removed). We need a self-contained auth system using Supabase Auth, which provides email/password and OAuth providers out of the box with SSR support via `@supabase/ssr`.

Current state: no active auth middleware, no session management, placeholder auth pages deleted.

## Goals / Non-Goals

**Goals:**
- Email + password auth with email confirmation and password reset
- Google OAuth via Supabase provider
- Middleware that refreshes the session and protects `/dashboard/*` routes
- Server-side session access (RSC + Route Handlers) and client-side session context
- Auth UI pages consistent with existing shadcn/ui theme

**Non-Goals:**
- Magic link / passwordless (can be added later via Supabase)
- Multi-tenant / organization features (separate concern)
- Role-based access beyond authenticated vs. unauthenticated
- Custom JWT claims or Row Level Security policies (Supabase-side config, not in scope)

## Decisions

### 1. Use `@supabase/ssr` for session management

**Decision**: Use the official `@supabase/ssr` package with `createServerClient` for RSC/Route Handlers and `createBrowserClient` for client components.

**Rationale**: This is Supabase's recommended approach for Next.js App Router. It handles cookie-based session refresh automatically in middleware, avoiding the deprecated `@supabase/auth-helpers-nextjs`.

**Alternatives considered**:
- `@supabase/auth-helpers-nextjs` — deprecated, not maintained
- Custom JWT handling — unnecessary complexity

### 2. Middleware rewrites session cookie on every request

**Decision**: `src/middleware.ts` will call `supabase.auth.getUser()` on every request to refresh the session, then redirect unauthenticated users away from `/dashboard/*`.

**Rationale**: Supabase SSR requires the middleware to refresh the session token (via `getUser`) so the cookie stays fresh. Without this, sessions expire silently.

**Alternatives considered**:
- Checking only on protected routes — would skip session refresh on public pages, causing stale tokens

### 3. Single `utils/supabase/` module with three client factories

**Decision**: Create `src/utils/supabase/server.ts`, `src/utils/supabase/client.ts`, and `src/utils/supabase/middleware.ts` following Supabase's official Next.js quickstart pattern.

**Rationale**: Keeps client creation DRY and co-located. Server client uses `cookies()` from `next/headers`; browser client uses `createBrowserClient`.

### 4. Auth UI built with existing shadcn/ui + TanStack Form

**Decision**: Build auth forms using `useAppForm` + `useFormFields` (project convention) and `react-hot-toast` for feedback.

**Rationale**: Keeps auth UI consistent with the rest of the dashboard. Avoids pulling in Supabase's hosted UI or a separate form library.

### 5. OAuth callback via `/auth/callback` Route Handler

**Decision**: A Route Handler at `src/app/auth/callback/route.ts` exchanges the `code` from Google OAuth and email confirmation links for a session, then redirects to `/dashboard`.

**Rationale**: Required by Supabase's PKCE flow (default for SSR). The callback route must run server-side to exchange the code securely.

## Risks / Trade-offs

- **Email delivery in dev** → Use Supabase's built-in Inbucket (local dev) or configure an SMTP provider in the Supabase dashboard for production. Mitigation: document in env.example.
- **Google OAuth requires Supabase project config** → Developer must add Google credentials in Supabase Auth → Providers. Mitigation: document setup steps.
- **Session cookie size** → Supabase session tokens can be large. Mitigation: use chunked cookie storage (handled automatically by `@supabase/ssr`).
- **Redirect loops if middleware misconfigured** → If the auth callback route is accidentally protected, OAuth will loop. Mitigation: explicitly exclude `/auth/**` from middleware protection.

## Migration Plan

1. Install `@supabase/supabase-js` and `@supabase/ssr`
2. Add env vars to `.env.local` (copy from Supabase project settings)
3. Create Supabase client utilities
4. Rewrite `src/middleware.ts`
5. Create auth pages and Route Handler
6. Test email flow end-to-end (sign-up → confirm → sign-in → dashboard)
7. Test Google OAuth flow end-to-end
8. Test sign-out and session expiry

**Rollback**: Remove the middleware and restore a passthrough. Auth pages can be independently disabled. No DB schema changes — all managed by Supabase.

## Open Questions

- Should password reset emails redirect to the app domain or Supabase's hosted page? (Recommend: app domain for consistent UX — implement `/auth/reset-password` page)
- Is a "remember me" / persistent session toggle needed? (Default Supabase sessions last until browser close unless configured otherwise)
