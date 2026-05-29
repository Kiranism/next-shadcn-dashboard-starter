## ADDED Requirements

### Requirement: User can sign in with Google
The system SHALL allow a user to sign in or sign up using their Google account via Supabase OAuth. The flow SHALL use PKCE (Proof Key for Code Exchange) and redirect through the `/auth/callback` route.

#### Scenario: Successful Google sign-in
- **WHEN** a user clicks "Continue with Google" on the sign-in or sign-up page
- **THEN** the user is redirected to Google's OAuth consent screen; after granting access, they are redirected to `/auth/callback`, a session is created, and the user is redirected to `/dashboard`

#### Scenario: User denies Google OAuth consent
- **WHEN** a user cancels or denies the Google consent screen
- **THEN** the user is redirected back to the sign-in page with a message: "Sign-in was cancelled"

#### Scenario: First-time Google sign-in creates an account
- **WHEN** a user signs in with Google and no account exists for that email
- **THEN** Supabase automatically creates the account and the user lands on `/dashboard`

### Requirement: Auth callback route handles OAuth code exchange
The system SHALL provide a Route Handler at `/auth/callback` that exchanges the OAuth `code` query parameter for a Supabase session.

#### Scenario: Valid OAuth code exchange
- **WHEN** Supabase redirects to `/auth/callback?code=<code>`
- **THEN** the Route Handler calls `supabase.auth.exchangeCodeForSession(code)`, sets the session cookie, and redirects to `/dashboard`

#### Scenario: Missing or invalid OAuth code
- **WHEN** `/auth/callback` is reached without a valid `code` parameter
- **THEN** the Route Handler redirects to `/auth/sign-in?error=oauth_error`

### Requirement: Auth callback route handles email confirmation
The system SHALL reuse the `/auth/callback` route to process email confirmation links (same PKCE code exchange flow).

#### Scenario: Email confirmation via callback
- **WHEN** a user clicks their confirmation email link (which points to `/auth/callback?code=<code>`)
- **THEN** the Route Handler exchanges the code, the account is confirmed, a session is created, and the user is redirected to `/dashboard`
