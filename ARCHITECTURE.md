# ARCHITECTURE.md — PlayMass

Version: 4.8.0
Last Updated: 2025-10-03T17:02:00.000Z

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

### Security Layer (Phase 3 — v4.7.1)

#### Structured Logging
- **Role**: Centralized logging with PII sanitization for security monitoring
- **Dependencies**: Pino (server), browser console (client)
- **Location**: `app/lib/logger.ts` (232 lines)
- **Status**: Active (90 console statements replaced)
- **Features**:
  - Server: JSON output for production log aggregation (Datadog, CloudWatch, Splunk)
  - Client: Browser console with PII sanitization and message throttling
  - PII Redaction: Automatically sanitizes email, phone, password, token, accessToken, sessionId, userId
  - Environment-aware: Debug level in dev, info in production
  - Memory management: Auto-cleanup of client log cache every 10s
- **Usage**:
  ```typescript
  import { logger } from './lib/logger'
  logger.debug('User action', { userId, action })
  logger.warn('Validation failed', { errors })
  logger.error('Database error', { error })
  ```

#### Input Validation & XSS Protection
- **Role**: Schema-based validation with XSS sanitization on all API endpoints
- **Dependencies**: Zod 4.1.11 (validation), xss 1.0.15 (sanitization)
- **Locations**: 
  - `app/lib/validation/schemas.ts` (400+ lines) - Zod schemas for all API types
  - `app/lib/validation/middleware.ts` (340 lines) - Validation helpers
- **Status**: Active (6 critical endpoints validated)
- **Features**:
  - Schema-derived TypeScript types (single source of truth)
  - XSS sanitization: Removes `<script>`, `<iframe>`, `javascript:` patterns
  - Structured error responses (400 with clear validation messages)
  - Automatic logging of validation failures
- **Validated Endpoints**:
  - `/api/admin/login` (POST) - Admin authentication
  - `/api/participants` (POST/GET/DELETE) - Participant management
  - `/api/games/[id]/play` (POST) - Game play (anti-cheat)
  - `/api/games` (GET) - Game listing
  - `/api/admin/games/[id]` (PUT) - Admin game updates
  - `/api/settings` (PUT) - System settings
- **Usage**:
  ```typescript
  import { validateBody } from './lib/validation/middleware'
  import { participantCreateSchema } from './lib/validation/schemas'
  
  const validated = await validateBody(request, participantCreateSchema, true)
  if (!validated.success) {
    return validated.error // Automatically formatted 400 response
  }
  const { name, email } = validated.data // Type-safe, XSS-sanitized
  ```

#### Rate Limiting & DDoS Protection
- **Role**: Prevent brute force, spam, and DDoS attacks across all API endpoints
- **Dependencies**: rate-limiter-flexible 8.0.1 (RateLimiterMemory)
- **Location**: `app/lib/ratelimit.ts` (enhanced existing implementation)
- **Status**: Active (5 critical endpoints protected)
- **Rate Limit Tiers**:
  - **Auth**: 5 requests/minute, 15-minute block (brute force protection)
  - **Admin**: 30 requests/minute, 10-minute block (admin operations)
  - **Gameplay**: 20 requests/minute, 5-minute block (spam prevention)
  - **Public**: 60 requests/minute, 1-minute block (DDoS mitigation)
- **Protected Endpoints**:
  - `/api/admin/login` (POST) - Auth tier
  - `/api/games/[id]/play` (POST) - Gameplay tier
  - `/api/participants` (POST) - Gameplay tier
  - `/api/games` (GET) - Public tier
  - `/api/health` (GET) - Public tier
- **Features**:
  - Per-IP tracking (supports x-forwarded-for, x-real-ip, cf-connecting-ip)
  - Token bucket algorithm with automatic cleanup
  - Standard HTTP 429 responses with Retry-After headers
  - All violations logged with structured data
- **Usage**:
  ```typescript
  import { checkGameplayRateLimit, getClientIdentifier, createRateLimitResponse } from './lib/rateLimit'
  
  const clientId = getClientIdentifier(request.headers)
  const rateLimitResult = await checkGameplayRateLimit(clientId)
  
  if (!rateLimitResult.success) {
    return NextResponse.json(
      createRateLimitResponse(rateLimitResult.retryAfter || 60),
      { status: 429, headers: { 'Retry-After': String(rateLimitResult.retryAfter) } }
    )
  }
  ```

#### Anti-Cheat Protection (Multi-Layer)
- **Layers**:
  1. **Rate Limiting**: 20 game plays per minute per IP
  2. **Input Validation**: Game outcomes validated against Zod schemas
  3. **Session Tracking**: Idempotency via sessionId and attemptId
  4. **IP Monitoring**: Per-IP attempt tracking and duplicate detection
- **Status**: Active on `/api/games/[id]/play`
- **Trust Boundaries**: Client provides outcome, server validates structure and applies business rules

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
- Update (v4.8.0): Two game types are supported for creation and editing:
  1. **QUIZZZ (Board Quiz)**: Board-based quiz game with question validation
  2. **WHACKPOP (Whack-a-Mole)**: Grid-based fast-paced action game with progressive difficulty
- Role: Provide standardized game templates with centralized platform configuration.
- Status: Active; both types follow the QUIZZZ editor pattern.

### Map System
- Update (v4.8.0): Public APIs used by both QUIZZZ and WHACKPOP — /api/hexmaps/[name], /api/hexmaps/random, /api/squaremaps/[name], /api/squaremaps/random
- Role: Provide reusable coordinates for grid-based games
- Dependencies: HexMap and SquareMap models (MongoDB), unified admin creator (/admin/mapcreator), public APIs /api/hexmaps/* and /api/squaremaps/*
- Status: Active; shared geometry utilities reused across game types

### WHACKPOP Game Type (v4.8.0)
- **Component**: `app/components/games/WhackPopGame.tsx` (658 lines)
- **Admin Editor**: `app/components/admin/WhackPopCustomizationForm.tsx` (415 lines)
- **Database Schema**: `app/lib/models/Game.ts` (whackPop sub-schema)
- **Type System**: `app/types/index.ts` (WhackPopConfiguration interface)
- **Role**: Whack-a-Mole style action game with progressive difficulty and combo scoring
- **Dependencies Reused** (Zero New Dependencies):
  - Hex/square geometry utilities from QUIZZZ (axialToPixel, hexVertices, cellToPixel, squareVertices)
  - Map loading API (selectedMaps/mapName pattern)
  - Admin editor patterns (one-input-per-line, color pickers, validation)
  - Tailwind CSS animations and Framer Motion
- **Key Features**:
  - Progressive difficulty: Linear interpolation of spawn/display intervals across rounds
  - Combo scoring: Multiplicative rewards for consecutive hits
  - Customizable themes: classic, neon, arcade, pixel
  - Hit effects: burst, sparkle, shockwave, confetti
  - Triple-layer validation: Client UI, Database schema, Server-side logic
- **Data Flow**: Admin UI → Database (whackPop config) → GameClient routing → WhackPopGame component → Result page
- **Performance**: onPointerDown for immediate response (~50-100ms faster than onClick), useMemo for grid geometry, useRef for timer management
- **Status**: Stable MVP, no new dependencies, fully commented code

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
- Admin auth hardening (signed cookies/JWT, session management, audit logs)
- Additional endpoint rate limiting (Facebook auth, admin maps, remaining admin operations)
- CSRF protection for state-changing requests
- Security headers (CSP, HSTS, X-Frame-Options)
- Error monitoring and alerting (Sentry integration)
- Centralize config resolution for admin settings

## Security Posture (Phase 3 Complete)
- ✅ Structured logging with PII sanitization
- ✅ Input validation with XSS protection on critical endpoints
- ✅ Rate limiting on all critical API routes
- ✅ Multi-layer anti-cheat protection
- ⏳ Admin authentication hardening (next phase)
- ⏳ CSRF protection (next phase)
- ⏳ Security headers (next phase)

