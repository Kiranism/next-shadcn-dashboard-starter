## ADDED Requirements

### Requirement: Middleware refreshes the session on every request
The system SHALL run a Next.js middleware on every request that calls `supabase.auth.getUser()` to refresh the session token, writing updated cookies to the response.

#### Scenario: Authenticated request with valid session
- **WHEN** a request arrives with a valid Supabase session cookie
- **THEN** the middleware refreshes the token (if near expiry), writes updated cookies, and allows the request to proceed

#### Scenario: Unauthenticated request to a protected route
- **WHEN** a request without a valid session arrives at any route under `/dashboard`
- **THEN** the middleware redirects to `/auth/sign-in`

#### Scenario: Authenticated request to an auth route
- **WHEN** a user with an active session navigates to `/auth/sign-in` or `/auth/sign-up`
- **THEN** the middleware redirects to `/dashboard`

### Requirement: Public routes are excluded from authentication checks
The system SHALL NOT require authentication for the following routes: `/`, `/auth/**`, `/api/auth/**`. The middleware SHALL match all other routes.

#### Scenario: Public page accessed without session
- **WHEN** an unauthenticated user visits `/` or `/auth/sign-in`
- **THEN** the request proceeds without redirect

### Requirement: Server components can read the current user
The system SHALL provide a `createServerClient` utility (using `next/headers` cookies) that Server Components and Route Handlers can call to get the authenticated user via `supabase.auth.getUser()`.

#### Scenario: Server component reads user
- **WHEN** a Server Component calls `supabase.auth.getUser()`
- **THEN** it receives the authenticated user object or `null` if not signed in

### Requirement: Client components can access the current session
The system SHALL provide a React context (`SessionContext`) wrapping the app in a Client Component that exposes `{ user, session, loading }` to all client components.

#### Scenario: Client component reads user
- **WHEN** a Client Component calls `useSession()`
- **THEN** it receives the current `user` and `session` objects (or `null` while loading)

### Requirement: User can sign out
The system SHALL allow a signed-in user to sign out from any page. On sign-out, the session cookie SHALL be cleared and the user SHALL be redirected to `/auth/sign-in`.

#### Scenario: Successful sign-out
- **WHEN** a signed-in user clicks "Sign out"
- **THEN** `supabase.auth.signOut()` is called, the session cookie is removed, and the user is redirected to `/auth/sign-in`
