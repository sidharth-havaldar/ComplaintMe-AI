"""Authentication module.

Supabase manages user identity; this module verifies Supabase-issued
JWTs and exposes FastAPI dependencies for protected routes.

Structure:
- jwt.py           — token verification (implemented in AUTH-002)
- dependencies.py  — FastAPI dependencies for protected routes
"""
