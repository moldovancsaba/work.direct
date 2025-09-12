# ARCHITECTURE.md — PlayMass

Last Updated: 2025-09-12T08:29:26.000Z

## Overview
PlayMass is a Next.js (App Router) application with MongoDB/Mongoose persistence and a modular game system. This document describes current system components and their roles, dependencies, and status.

## Components

### Admin Authentication (MVP)
- Role: Protect admin UI (/admin/*) and admin APIs (/api/admin/*)
- Dependencies:
  - next/headers cookies() — server-side cookie access
  - app/lib/auth.ts — cookie validator and user resolver
  - app/api/admin/login — login/logout cookie setter/deleter
  - app/api/admin/auth — server auth check endpoint
  - app/hooks/useAdminAuth — client gate/redirect/logout
  - app/admin/layout.tsx — UI gate for all admin pages (except /admin/login)
- Status: MVP (unsigned cookie; static admin user)
- Flow:
  1) User posts { password } to POST /api/admin/login
  2) Server validates against process.env.ADMIN_PASSWORD
  3) On success, sets httpOnly cookie `admin-session` (base64 JSON token; 7 days)
  4) Client UI reads status via GET /api/admin/auth and redirects appropriately
  5) Admin API routes call getAdminUser() and return 401 if unauthenticated
  6) Logout via DELETE /api/admin/login clears the cookie
- Trust Boundaries:
  - UI gate (client) prevents navigation; Server guard (API routes) is authoritative
  - Cookie is httpOnly; token is not signed (documented limitation)

### Database Layer
- Role: Data persistence for games, participants, rewards, results
- Dependencies: MongoDB, Mongoose
- Status: Active

### Game Engine
- Role: Provide different game types with centralized platform configuration
- Status: Active; Stars Hexa, Penalty Shootout; Wheel component prepared

## Configuration
- Required environment variables:
  - MONGODB_URI
  - NEXT_PUBLIC_APP_URL
  - NEXT_PUBLIC_APP_NAME
  - ADMIN_PASSWORD (MVP admin auth)
  - NEXT_PUBLIC_FACEBOOK_APP_ID (client SDK init)
  - FACEBOOK_APP_ID (server-side verification)
  - FACEBOOK_APP_SECRET (server-side verification)
- Timestamps: ISO 8601 with milliseconds (UTC)

## End-User Authentication (Facebook SDK)
- Role: Provide end-user login via Facebook popup for welcome/registration flow
- Dependencies:
  - Facebook JS SDK (loaded globally in app/layout.tsx via next/script)
  - API endpoint: POST /api/auth/facebook/client (verifies access token via debug_token; fetches user profile; sets httpOnly user-session cookie)
  - API endpoint: GET/POST /api/auth/session (POC cross-game 24h session persistence)
- Flow:
  1) Welcome page triggers FB.login({ scope: 'public_profile,email' })
  2) On success, the short-lived accessToken is posted to the server endpoint
  3) Server validates token and fetches minimal profile (id,name,email)
  4) Server sets httpOnly cookie 'user-session' with minimal user info; client saves local session (non-sensitive) and continues to /play/[gameId]/rules
- Security:
  - Access tokens are never stored server-side or client-side
  - Cookie flags: httpOnly, sameSite=lax, secure in production
  - Legacy redirect routes /api/auth/facebook/start and /callback are retained for rollback only; UI uses SDK popup exclusively

## Future Improvements
- Admin auth hardening (signed cookies/JWT, rate limiting/lockout, audit logs)
- Centralize config resolution for admin settings

