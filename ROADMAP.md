# ROADMAP.md — PlayMass

Last Updated: 2025-09-20T15:00:22.000Z
- Forward-looking plan for PlayMass after QUIZZ release.
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

Milestone: QUIZZ Enhancements & Analytics
- Priority: HIGH
- Target: 2025-09-17T18:00:00.000Z
- Dependencies: QUIZZ release
- Deliverables:
  - Analytics event hooks for question views/answers and round progression
  - Admin export of QUIZZ results per game
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
  - Ensure all docs reference the QUIZZ architecture and HexMap public API

Milestone: QA & Production Readiness
- Priority: CRITICAL
- Target: 2025-09-17T19:00:00.000Z
- Dependencies: QUIZZ release
- Deliverables:
  - Manual verification checklist executed (tests prohibited)
  - vercel --prod successful deploy and smoke test

Q4 2025 — Context-Aware Assistance & Governance Hardening

Q4 2025 — Centralized Editor and Legacy Deprecation (v3)

Milestone: Centralized Game Editor Core 1.0
- Priority: CRITICAL
- Target: 2025-10-05T12:00:00.000Z
- Dependencies: QUIZZZ runtime and platform defaults in place
- Deliverables:
  - General Platform Editor finalized (hero/main/legal/CTAs/H1-H2-P mapping) and documented
  - Game-Type Editor SDK surface documented (props, config typing, UX do/don’t)
  - Minimal Loading patterns standardized for async resources

Milestone: Legacy Deprecation Plan Execution
- Priority: CRITICAL
- Target: 2025-10-12T12:00:00.000Z
- Dependencies: Core Editor 1.0
- Deliverables:
  - QUIZZ (legacy) editor screens removed; runtime retained until migration complete
  - StarsHexa editor tabs replaced by the General Platform Editor + type-specific fragment
  - Removal PRs staged with toggles; documentation for migration and rollback

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
