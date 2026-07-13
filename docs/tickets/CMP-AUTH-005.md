# CMP-AUTH-005 — User Logout

## Epic

Epic 2 — Authentication

---

## Priority

Medium

---

## Story Points

2

---

## Objective

Implement secure logout functionality using the existing Supabase authentication.

Users should be able to end their session safely and be redirected to the login page.

---

## Background

Authentication is already implemented.

Protected routes are working.

This ticket completes the authentication flow.

---

## Scope

Frontend only.

Implement:

- Logout button
- Sign out using the existing Supabase client
- Clear the active session
- Redirect user to /login
- Ensure protected routes are no longer accessible after logout

Reuse existing authentication architecture.

Do not duplicate authentication logic.

---

## UI

Place the logout button in the dashboard placeholder.

A simple button is sufficient.

No styling redesign.

---

## Session Behaviour

After logout:

- Redirect to /login
- Refreshing /dashboard should redirect back to /login
- Login/Register pages should become accessible again

---

## Error Handling

Display a friendly message if logout fails.

Do not expose raw Supabase errors.

---

## Out of Scope

Do NOT implement:

- User profile
- Account settings
- Backend changes
- JWT verification
- RBAC

---

## Acceptance Criteria

- Logout button visible
- Session destroyed successfully
- Redirect to /login
- Dashboard protected after logout
- Project builds successfully

---

## Verification

Run:

npm run lint

npm run build

Manual verification:

1. Login
2. Open dashboard
3. Logout
4. Redirect to /login
5. Refresh /dashboard
6. Redirect to /login

---

## Deliverables

Provide:

1. Files created
2. Files modified
3. Verification results
4. Summary

Stop after completion.

---

## Commit Message

feat(auth): implement logout