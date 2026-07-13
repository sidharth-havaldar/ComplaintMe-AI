# CMP-AUTH-006 — Forgot Password

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

Allow users to securely request a password reset using Supabase Authentication.

---

## Background

Authentication is complete.

Users should be able to recover their account if they forget their password.

---

## Scope

Frontend only.

Create:

frontend/src/app/(auth)/forgot-password/page.tsx

Implement:

- Email input
- Send reset email
- Loading state
- Success message
- Friendly error handling

Use the existing Supabase client.

Call:

resetPasswordForEmail()

---

## UI

Reuse the existing authentication layout.

Match the Login and Registration pages.

Add a "Forgot Password?" link to the login page.

---

## Success

Display:

"If an account exists for this email, a password reset link has been sent."

Do not reveal whether an email exists.

---

## Error Handling

Show friendly messages.

Never expose raw Supabase errors.

---

## Out of Scope

- Reset Password page
- Change Password
- Backend changes
- JWT verification
- RBAC

---

## Acceptance Criteria

- Forgot Password page created
- Login links to Forgot Password
- Email reset sent
- Friendly success message
- Project builds successfully

---

## Verification

Run:

npm run lint

npm run build

Manual:

- Open /forgot-password
- Submit email
- Success message displayed

---

## Deliverables

- Files created
- Files modified
- Verification results
- Summary

Stop after completion.

---

## Commit Message

feat(auth): implement forgot password