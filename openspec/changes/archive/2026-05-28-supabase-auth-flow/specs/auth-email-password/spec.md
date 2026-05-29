## ADDED Requirements

### Requirement: User can sign up with email and password
The system SHALL allow a new user to create an account using an email address and password. After sign-up, Supabase SHALL send a confirmation email. The user SHALL NOT be able to access the dashboard until the email is confirmed.

#### Scenario: Successful sign-up
- **WHEN** a user submits a valid email and password (min 8 characters) on the sign-up page
- **THEN** Supabase creates the account, sends a confirmation email, and the UI displays a message instructing the user to check their inbox

#### Scenario: Sign-up with already-registered email
- **WHEN** a user submits an email that already has an account
- **THEN** the system displays an error message: "An account with this email already exists"

#### Scenario: Sign-up with weak password
- **WHEN** a user submits a password shorter than 8 characters
- **THEN** the form shows a validation error before submission: "Password must be at least 8 characters"

### Requirement: User can sign in with email and password
The system SHALL allow an existing confirmed user to sign in with their email and password. On success, the user SHALL be redirected to `/dashboard`.

#### Scenario: Successful sign-in
- **WHEN** a confirmed user submits correct email and password
- **THEN** a session is created, the session cookie is set, and the user is redirected to `/dashboard`

#### Scenario: Sign-in with unconfirmed email
- **WHEN** a user who has not confirmed their email attempts to sign in
- **THEN** the system displays: "Please confirm your email before signing in"

#### Scenario: Sign-in with wrong credentials
- **WHEN** a user submits an incorrect email or password
- **THEN** the system displays: "Invalid email or password"

### Requirement: User can request a password reset
The system SHALL allow a user to request a password reset link sent to their registered email address.

#### Scenario: Password reset email sent
- **WHEN** a user submits their registered email on the forgot-password page
- **THEN** Supabase sends a password reset email and the UI displays: "Check your inbox for a reset link"

#### Scenario: Password reset with unknown email
- **WHEN** a user submits an email not associated with any account
- **THEN** the system displays the same success message (to prevent email enumeration)

### Requirement: User can set a new password via reset link
The system SHALL allow a user to set a new password after clicking the reset link in their email. The reset link SHALL only be valid once.

#### Scenario: Successful password reset
- **WHEN** a user arrives at `/auth/reset-password` with a valid token and submits a new password (min 8 characters)
- **THEN** the password is updated, the user is signed in, and redirected to `/dashboard`

#### Scenario: Expired or invalid reset token
- **WHEN** a user arrives at `/auth/reset-password` with an invalid or expired token
- **THEN** the system displays: "This reset link is invalid or has expired. Request a new one."
