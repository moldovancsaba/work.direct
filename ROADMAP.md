# ROADMAP.md — PlayMass

Last Updated: 2025-09-15T10:36:24.000Z
- Forward-looking plan for modular game architecture and Stars Hexa refactor within PlayMass.
- Priorities and dependencies are explicitly stated to enable parallelization where safe.

Q3 2025 — Modular Game System Rollout

Milestone: Core Module System (Registry + Config Resolver)
- Priority: CRITICAL
- Target: 2025-09-09T18:00:00.000Z
- Dependencies: Existing game types and settings model
- Deliverables:
  - Module registry, deep-merge config resolution (module defaults → PlayMass defaults → game overrides)
  - Config endpoints: /api/config/get and /api/config/update (scope: playmass|game)
  - Validation safeguards for updates

Milestone: Stars Hexa Module Refactor
- Priority: CRITICAL
- Target: 2025-09-11T18:00:00.000Z
- Dependencies: Core Module System
- Deliverables:
  - Stars Hexa registered as first-class module (no new game type, no duplication)
  - StarsHexa.tsx refactored to consume texts/colors/rules from resolved config
  - Maintain performance semantics: parallel flips, 200ms flip, 1s auto-flip-back, instant result redirect

Milestone: Admin Setup Tabs (Stars Hexa)
- Priority: HIGH
- Target: 2025-09-12T18:00:00.000Z
- Dependencies: Core Module System
- Deliverables:
  - Tabs: Rules, Texts, Colors with validation and preview
  - Persist per-game overrides via /api/admin/games/[id]

Milestone: Standardized 4-Page Flow
- Priority: HIGH
- Target: 2025-09-13T18:00:00.000Z
- Dependencies: Stars Hexa Module registered
- Deliverables:
- Routes: /play/[gameId]/welcome, /rules, /game (keep /result)
- Backward-compat redirect from /play/[gameId] → /welcome
- Referral param (?ref=) propagation across pages
- Hero/Main centralized blocks used across Welcome/Rules/Game/Result with unified defaults (page bg #000000FF; hero #000000FF; main #444444FF; text #FFFFFFFF; Noto Sans)

Milestone: Facebook JS SDK Login Integration
- Priority: HIGH
- Target: 2025-09-12T10:00:00.000Z
- Dependencies: Standardized 4-Page Flow
- Deliverables:
  - Global FB SDK load with readiness event
  - Client popup login replacing legacy redirect
  - Server token verification endpoint and session cookie
  - Redirect to /play/[gameId]/rules preserving ?ref

Milestone: PlayMass Defaults Management UI
- Priority: MEDIUM
- Target: 2025-09-14T18:00:00.000Z
- Dependencies: Config endpoints
- Deliverables:
  - Admin settings “Games” tab for global defaults per module
  - Reset-to-defaults operation

Milestone: Admin Auth Hardening
- Priority: HIGH
- Target: 2025-09-16T18:00:00.000Z
- Dependencies: MVP admin login
- Deliverables:
  - Signed tokens or JWT-based sessions
  - Brute-force protections (rate limiting/lockout)
  - Admin audit logging and session invalidation strategy

Milestone: Loyalty & Referral Enhancements
- Priority: MEDIUM
- Target: 2025-09-15T18:00:00.000Z
- Dependencies: Standardized 4-Page Flow
- Deliverables:
  - Confirm ?ref= acceptance on Welcome and registration post
  - Analytics event hooks (view, start, action, finish, invite)

Milestone: Documentation & Governance
- Priority: HIGH
- Target: 2025-09-16T18:00:00.000Z
- Dependencies: All previous milestones
- Deliverables:
  - PLAYMASS_CORE.md (module system, registry, config precedence, endpoints)
  - GAME_MODULE_TEMPLATE.md (contracts, defaults.json, renderers, server hooks)
  - STARS_HEXA.md and PENALTY.md (module specifics)
  - All timestamps in ISO 8601 with milliseconds (UTC)

Milestone: QA, Versioning, Deploy
- Priority: CRITICAL
- Target: 2025-09-17T18:00:00.000Z
- Dependencies: All previous milestones
- Deliverables:
  - Manual verification (tests prohibited)
  - Version bump per protocol (MINOR before commit), document sync
  - vercel --prod successful deploy
