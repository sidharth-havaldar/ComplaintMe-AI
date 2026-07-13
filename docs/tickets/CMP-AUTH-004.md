# CMP-AUTH-004 — Protected Routes & Session Management

## Epic

Epic 2 — Authentication

---

## Priority

High

---

## Story Points

3

---

## Objective

Protect authenticated pages and prevent unauthorized access.

Authenticated users should access protected pages.

Unauthenticated users should be redirected to the login page.

---

## Background

The project already has:

- Supabase Authentication
- Login
- Registration
- Dashboard placeholder

This ticket secures access to the application.

---

## Scope

Frontend

Implement authentication guards using the existing Supabase client.

Protect:

- /dashboard
- Future authenticated routes

Unauthenticated users

→ Redirect to

/login

Authenticated users visiting:

- /login
- /register

should automatically redirect to

/dashboard

Maintain the current App Router architecture.

Do not duplicate authentication logic.

Use middleware or the existing route protection strategy if already present.

---

## Session Handling

Support:

- Existing authenticated sessions
- Browser refresh
- Returning users

The user should remain logged in until they sign out.

---

## Loading

Prevent UI flashing while authentication state is being determined.

Show an appropriate loading state if necessary.

---

## Out of Scope

Do NOT implement

- Logout
- Forgot Password
- Social Login
- Backend JWT verification
- Role-based permissions

---

## Acceptance Criteria

- Dashboard protected
- Guests redirected to login
- Logged-in users redirected away from login/register
- Sessions persist across refresh
- No duplicated auth logic
- Project builds successfully

---

## Verification

Run

npm run lint

npm run build

Verify manually:

- Guest → /dashboard → redirected to /login
- Logged-in → /login → redirected to /dashboard
- Refresh dashboard → session persists

---

## Deliverables

Provide:

- Files created
- Files modified
- Verification results
- Summary

Stop after completion.

---

## Commit Message

feat(auth): implement protected routes