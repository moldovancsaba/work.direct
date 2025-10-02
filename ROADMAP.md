# ROADMAP.md — PlayMass

Last Updated: 2025-10-02T13:08:57.317Z
- Forward-looking plan for PlayMass.
- Priorities and dependencies are explicitly stated to enable safe parallelization.

Q3 2025 — Post-Release Stabilization and Hardening

Milestone: QUIZZZ Editor Standardization (Default for New Games)
- Priority: CRITICAL
- Target: 2025-09-19T18:00:00.000Z
- Dependencies: QUIZZZ editor complete and DB-driven defaults
- Deliverables:
  - Make QUIZZZ the default new-game type in admin (done)
  - Declare QUIZZZ editor pattern as the canonical standard in docs (README, ARCHITECTURE)
  - Ensure all future game editors follow QUIZZZ patterns: one-input-per-line, usage toggles, DB-driven defaults, centered unified CTA grid, black text for readability
  - Remove/disable scoreboard titles in HERO by default (done)

Milestone: Developer Tooling — Secure GitHub CLI Authentication & Git Integration
- Priority: HIGH
- Target: 2025-09-20T15:00:00.000Z
- Dependencies: Homebrew and GitHub CLI installed
- Deliverables:
  - Configure gh to use HTTPS protocol for Git operations
  - Authenticate gh using a Personal Access Token via stdin (no plaintext exposure)
  - Ensure credentials are stored in macOS Keychain and gh integrates with Git (gh auth setup-git)
  - Verify authentication (gh auth status), identity (gh api user), and basic repo access (gh repo list)
  - Security hygiene documented; logout/revoke procedure prepared
- Logged: 2025-09-20 16:35 CET

Milestone: QUIZZZ Enhancements & Analytics
- Priority: HIGH
- Target: 2025-09-17T18:00:00.000Z
- Dependencies: QUIZZZ runtime in place
- Deliverables:
  - Analytics event hooks for question views/answers and round progression
  - Admin export of quiz results per game
  - Optional per-question image/icon support (backward compatible)

Milestone: Admin Auth Hardening
- Priority: HIGH
- Target: 2025-09-18T18:00:00.000Z
- Dependencies: MVP admin login
- Deliverables:
  - Signed tokens or JWT-based sessions
  - Brute-force protections (rate limiting/lockout)
  - Admin audit logging and session invalidation strategy

Milestone: Documentation & Governance
- Priority: MEDIUM
- Target: 2025-09-18T18:00:00.000Z
- Dependencies: All previous milestones
- Deliverables:
  - Update TECH_STACK.md and governance docs (timestamp consistency, versioning automation notes)
  - Ensure all docs reference the QUIZZZ architecture and HexMap public API

Milestone: QA & Production Readiness
- Priority: CRITICAL
- Target: 2025-09-17T19:00:00.000Z
- Dependencies: QUIZZZ runtime in place
- Deliverables:
  - Manual verification checklist executed (tests prohibited)
  - vercel --prod successful deploy and smoke test

Milestone: Git Push — v4.4.1 to origin/main
- Priority: CRITICAL
- Target: 2025-09-23T08:00:00.000Z
- Dependencies: Local production build succeeded; docs synchronized
- Deliverables:
  - Push current HEAD to origin/main securely using environment token
  - Verify remote HEAD matches local HEAD
  - Log plan and outcome in ROADMAP.md, TASKLIST.md, and WARP.DEV_AI_CONVERSATION.md
- Logged: 2025-09-23 09:16 CET

Milestone: Git Push — v4.6.0 to origin/main
- Priority: CRITICAL
- Target: 2025-09-23T12:30:00.000Z
- Dependencies: Local production build succeeded; docs synchronized; version bump to v4.6.0
- Deliverables:
  - Push current HEAD to origin/main securely using environment token
  - Verify remote HEAD matches local HEAD
  - Log plan and outcome in ROADMAP.md, TASKLIST.md, and WARP.DEV_AI_CONVERSATION.md
- Logged: 2025-09-23T12:19:54.000Z
- Status: Completed — 2025-09-23T12:24:51.000Z
- Outcome: Pushed to origin/main; Remote HEAD equals Local HEAD (36f03e2)

Q4 2025 — Context-Aware Assistance & Governance Hardening

Milestone: Admin Post-Login Redirect Reliability
- Priority: HIGH
- Target: 2025-10-01T13:30:00.000Z
- Dependencies: Next.js App Router client navigation; Route Handlers cookie API
- Deliverables:
  - Set cookie on response in POST /api/admin/login (NextResponse.cookies)
  - Client success path uses router.replace('/admin') + router.refresh()
  - Add admin/loading.tsx to prevent blank UI during transitions
- Logged: 2025-10-01T12:38:34.000Z

Q4 2025 — Centralized Editor and Legacy Deprecation (v3)

Milestone: Centralized Game Editor Core 1.0
- Priority: CRITICAL
- Target: 2025-10-05T12:00:00.000Z
- Dependencies: QUIZZZ runtime and platform defaults in place
- Deliverables:
  - General Platform Editor finalized (hero/main/legal/CTAs/H1-H2-P mapping) and documented
  - Game-Type Editor SDK surface documented (props, config typing, UX do/don’t)
  - Minimal Loading patterns standardized for async resources


Milestone: New Game Module Template
- Priority: HIGH
- Target: 2025-10-15T12:00:00.000Z
- Dependencies: Core Editor 1.0 & SDK docs
- Deliverables:
  - Reference module with skeleton: config schema, board/cards, overlay, result mapping
  - Card management guidelines (coords→cards mapping, cover images, emojis, colors)
  - Design element governance: per-button BG CSS, font tokens, black defaults enforced

Milestone: Semantic Indexing Operationalization
- Priority: HIGH
- Target: 2025-10-01T12:00:00.000Z
- Dependencies: WARP.md consolidation (Indexing Guidelines present)
- Deliverables:
  - Define include/exclude sets for semantic tools (app/, docs/, scripts/; exclude node_modules/.next/.vercel/.git)
  - Confirm secrets excluded by VCS (.env, .env.local)
  - Validate search paths for types, models, and routes

Milestone: Governance Automation (Optional)
- Priority: MEDIUM
- Target: 2025-10-05T12:00:00.000Z
- Dependencies: None
- Deliverables:
  - Evaluate timestamp/version sync scripts for future cycles (manual execution only)

Milestone: v2.1.x Runtime Verification & Deploy
- Priority: HIGH
- Target: 2025-09-19T18:00:00.000Z
- Dependencies: Documentation updates complete
- Deliverables:
  - Manual dev verification (tests prohibited)
  - Build passes; deploy with vercel --prod
