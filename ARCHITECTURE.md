# ARCHITECTURE.md — PlayMass

Version: 4.7.0
Last Updated: 2025-10-02T11:59:58.000Z

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

### Editor Standard — QUIZZZ (Default)
- Role: QUIZZZ editor is the canonical pattern all future games must follow
- Dependencies: GameEditor, QuizzzCustomizationForm, PlatformSettingsForm, MongoDB defaults via /api/config/defaults
- Status: Adopted (default)
- Key principles:
  - DB-driven defaults (no baked-in text) — loaded from playmass_defaults
  - One-input-per-line layout with black text for readability
  - Usage toggles before fields to include/exclude values from saved config
  - Centered, unified CTA grid (primary + additional) with BG CSS per button
  - Legal texts and Main Fonts & Typography managed from the same DB-driven platform config
  - Scoreboard-style titles removed from HERO by default

### Game Engine
- Update (v2.2.0): QUIZZZ module uses configuration.quizzz for board/covers/styles; answered-state visuals and background precedence logic implemented

### Game Types (Admin)
- Update: Only QUIZZZ (Board Quiz) is supported for creation and editing. All other types are removed from editor UI.
- Role: Provide a single, standardized game template with a centralized platform configuration.
- Status: Active; QUIZZZ only.

### Map System
- Update (v2.2.0): Added public APIs for map retrieval — /api/hexmaps/[name], /api/hexmaps/random, /api/squaremaps/[name], /api/squaremaps/random — used by QUIZZZ runtime to load board coordinates
- Role: Provide reusable coordinates for grid-based games
- Dependencies: HexMap and SquareMap models (MongoDB), unified admin creator (/admin/mapcreator), public APIs /api/hexmaps/* and /api/squaremaps/*
- Status: Active; referenced by QUIZZZ (selectedMaps) and future grid-based games

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

## Centralized Game Editor System (v3)

Role
- Provide a single, DB-driven editor experience split into:
  1) General Platform Editor (shared across all games): hero/main/legal texts and styles, typography (H1/H2/P), unified CTAs, font tokens, and black text defaults.
  2) Game-Type Specific Editor: minimal, game-only fields (e.g., QUIZZZ map/questions), composed inside the shared layout.

Configuration Precedence
- module defaults → PlayMass defaults (DB) → per-game overrides
- No runtime fallbacks: if a value is not configured, it stays empty (prevents flash/flicker).

Typography & Fonts
- Each text has a type (H1/H2/P) and uses styles.main.{h1Class,h2Class,pClass}.
- Fonts load with display=block to prevent style swap.
- Defaults include text-black while preserving sizes/weights.

Card & Board Management (Grid-based Games)
- Coordinates come strictly from configured maps (selectedMaps[0] preferred, else mapName). No auto-expansion or default shapes.
- Cards derive directly from coordinates (slice only; never generate new coords).
- Optional cover images clip to polygon shapes; emojis/colors configurable per state.

Design Element Governance
- Button backgrounds accept multiline CSS; the renderer always uses the last background: … value; supports linear-gradient(...) with rgba(...).
- Hero/Main background precedence: game.backgroundCss > map.bgImage > platform.main.background.

Minimal Loading & Error Handling
- All async map loads show a minimal Loading… state; error overlays are suppressed during load and displayed only for real configuration errors.


## Future Improvements
- Admin auth hardening (signed cookies/JWT, rate limiting/lockout, audit logs)
- Centralize config resolution for admin settings

