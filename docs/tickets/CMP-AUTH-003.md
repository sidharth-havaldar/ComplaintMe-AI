# CMP-AUTH-003 — User Registration

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

Implement user registration using Supabase Authentication.

The registration page must reuse the existing authentication UI and components created for the login page.

Do not duplicate UI or business logic.

---

## Background

The login page is complete.

Supabase authentication is configured.

Users should now be able to create a ComplaintMe AI account.

---

## Scope

Frontend

Create:

frontend/src/app/(auth)/register/page.tsx

Implement:

- Full Name
- Email
- Password
- Confirm Password

Validation

- Required fields
- Valid email
- Password minimum 8 characters
- Password confirmation must match

Authentication

Use the existing Supabase client.

Call signUp().

Store the user's full name in Supabase user metadata.

---

## Success

If email confirmation is disabled

→ Redirect to

/dashboard

If email confirmation is enabled

→ Display a success message instructing the user to verify their email.

Do not redirect.

---

## UI

Reuse the existing authentication layout.

Maintain the same branding and responsive design.

Provide loading and error states.

Do not duplicate existing components.

---

## Out of Scope

- Social login
- User profile
- Dashboard
- Complaint module
- Backend changes

---

## Acceptance Criteria

- Registration page implemented
- Validation implemented
- Loading state implemented
- Friendly error handling
- Supabase signUp integrated
- Project builds successfully

---

## Verification

Run

npm run lint

npm run build

Both must pass.

---

## Deliverables

- Files created
- Files modified
- Verification results
- Summary

Stop after completion.

---

## Commit Message

feat(auth): implement user registration