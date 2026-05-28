## ADDED Requirements

### Requirement: Sign-in page
The system SHALL provide a sign-in page at `/auth/sign-in` with an email + password form and a Google OAuth button.

#### Scenario: Sign-in page renders
- **WHEN** an unauthenticated user navigates to `/auth/sign-in`
- **THEN** the page renders with an email input, password input, "Sign in" submit button, "Continue with Google" button, and a link to `/auth/sign-up`

#### Scenario: Form submission triggers email sign-in
- **WHEN** the user submits valid credentials
- **THEN** the form calls `supabase.auth.signInWithPassword()` and handles success/error states

### Requirement: Sign-up page
The system SHALL provide a sign-up page at `/auth/sign-up` with an email + password form and a Google OAuth button.

#### Scenario: Sign-up page renders
- **WHEN** an unauthenticated user navigates to `/auth/sign-up`
- **THEN** the page renders with an email input, password input, confirm-password input, "Create account" submit button, "Continue with Google" button, and a link to `/auth/sign-in`

#### Scenario: Passwords must match
- **WHEN** the user submits the sign-up form with non-matching passwords
- **THEN** the form shows: "Passwords do not match" before submitting

### Requirement: Forgot-password page
The system SHALL provide a page at `/auth/forgot-password` where users can request a password reset email.

#### Scenario: Forgot-password page renders
- **WHEN** a user navigates to `/auth/forgot-password`
- **THEN** the page renders with an email input, "Send reset link" button, and a link back to `/auth/sign-in`

### Requirement: Reset-password page
The system SHALL provide a page at `/auth/reset-password` where users arriving from a reset email link can set a new password.

#### Scenario: Reset-password page renders with valid token
- **WHEN** a user arrives at `/auth/reset-password` with a valid session from the reset email
- **THEN** the page renders with a new-password input, confirm-password input, and "Update password" button

#### Scenario: Reset-password page without valid token
- **WHEN** a user navigates to `/auth/reset-password` directly without a token
- **THEN** the page displays an error message and a link to `/auth/forgot-password`

### Requirement: Auth layout
The system SHALL wrap all auth pages (`/auth/**`) in a centered layout with the app logo/name, providing a consistent visual frame distinct from the dashboard layout.

#### Scenario: Auth layout applied
- **WHEN** any `/auth/*` page is rendered
- **THEN** it uses the auth layout (centered card, no sidebar, no header nav)
