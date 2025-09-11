# ARCHITECTURE.md — PlayMass

Last Updated: {NOW}

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
- Timestamps: ISO 8601 with milliseconds (UTC)

## Future Improvements
- Admin auth hardening (signed cookies/JWT, rate limiting/lockout, audit logs)
- Centralize config resolution for admin settings

