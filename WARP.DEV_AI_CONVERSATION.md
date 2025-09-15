# WARP.DEV_AI_CONVERSATION.md — Planning Log

2025-09-15T11:11:36.000Z — Delivery: Facebook login button reliability — fallback to legacy OAuth when SDK not ready; status feedback and connecting state; minor version bump to v1.24.0; docs synchronized; commit and push to main.

2025-09-15T10:36:24.000Z — Delivery: UI/UX fixes and renames — Hexa rename, editor save stays on page with timestamp, Hero Background CSS applied across play flow, aligned Facebook button next to Next, INVITE_REFERRAL shares/copies referral link; version bump to v1.23.0; docs synchronized; commit and push to main.

2025-09-14T16:12:23.000Z — Delivery: Fixed admin login 404 and E11000 duplicate index; dropped shareLinks.id_1; ensured sparse unique index on shareLinks.shortCode; bumped to v1.22.0; synchronized docs; commit and push to main.
2025-09-13T12:44:07.090Z — Plan: Housekeeping — bump to v1.18.0; add whitespace to README; synchronize documentation timestamps; add release note; commit and push to main. No code changes. ISO 8601 timestamps with ms enforced.
2025-09-13T16:27:18.176Z — Plan: Landing page UI tweak — disable scroll and remove margins on Hero/Main for full-screen experience; patch bump and docs sync per protocol; commit and push.
2025-09-13T18:47:30.559Z — Plan: Admin editor polish — rename Platform Settings → Hero Settings; move Scoreboard Styles under Hero; add inline Cancel/Update action bars between all specified sections; minor version bump and docs sync; commit and push.
2025-09-13T19:48:48.015Z — Plan: Enforce no-scroll across all play pages; add document-level overflow lock to the Game layout; minor version bump and docs sync; commit and push.

Timestamp: 2025-09-06T16:58:38.000Z
Author: Agent Mode (AI)
Topic: Stars Hexa Game — Modular Refactor & Integration in PlayMass

---

Timestamp: 2025-09-10T13:01:23.000Z
Author: AI Development Team
Topic: Basic Admin Login (MVP parity with MessMass)
Plan:
- Implement cookie-based admin auth using /api/admin/login (POST/DELETE) and /api/admin/auth (GET)
- Add app/lib/auth.ts (server cookie validator) and app/hooks/useAdminAuth.ts (client gate)
- Gate admin layout for all routes except /admin/login; guard admin API routes
- Set ADMIN_PASSWORD in .env.local; document endpoints and cookie behavior in README
- Update ROADMAP (admin auth hardening), LEARNINGS (MVP rationale), TASKLIST (in progress)
Notes:
- Unsigned base64 JSON token appropriate for MVP; future upgrade to signed tokens/JWT required

Objective
Refactor Stars Hexa into a first-class PlayMass module (no new type, no duplication) and align with Penalty architecture, enabling centralized configuration (Rules, Texts, Colors), standardized 4-page flow, and loyalty/referral readiness.

Scope Summary
- Game Refactor: STARS_HEXA remains the type, refactor for modular configurability; editable rules/texts/colors/assets via admin tabs.
- Centralized Management: Registry-based game modules; shared PlayMass defaults; per-game overrides; deterministic deep-merge precedence.
- Setup Tabs: Rules, Texts, Colors for Stars Hexa; validation; preview.
- Documentation: Core module docs + module-specific docs; onboarding template.
- Standardized Pages: Welcome → Rules → Game → Result; mobile-first; referral propagation.
- Loyalty/Referral: Pseudo-UUID users, ?ref= referral tracking on Result and Welcome; analytics events.

Execution Plan (High-Level)
1) Core Module System
   - Create /app/modules/core/{types.ts,registry.ts,config.ts}
   - Implement registerGameModule(), getGameModule(), resolveConfig(gameId)
   - Config merge order: module defaults → PlayMass defaults → per-game overrides
   - Endpoints: /api/config/get, /api/config/update (scope: playmass|game), with schema validation

2) Data Model Updates
   - Game.configuration.starsHexa: add texts, colors, optional assets[]
   - SystemSettings: add gameDefaults.{STARS_HEXA, PENALTY_SHOOTOUT}
   - Enforce hex color and text length validation; preserve backward compatibility

3) Stars Hexa Module Refactor
   - Add /app/modules/stars-hexa/index.ts exporting GameModule with defaultConfig
   - Update StarsHexa.tsx to consume config-driven labels/colors/messages without breaking performance

4) Standardized 4-Page Flow
   - New routes: /play/[gameId]/welcome, /rules, /game (keep existing /result)
   - Redirect /play/[gameId] → /welcome for backward compatibility
   - Preserve ?ref= and session through the flow via query/URL state

5) Admin Setup Tabs (Stars Hexa)
   - Extend /admin/games/[id]/page.tsx with Rules | Texts | Colors tabs
   - Save per-game config via existing PUT /api/admin/games/[id]
   - Add validations and live preview

6) PlayMass Defaults UI
   - Extend /admin/settings/page.tsx with a “Games” tab to maintain defaults per module
   - Wire to /api/config/update?scope=playmass

7) Documentation
   - PLAYMASS_CORE.md, GAME_MODULE_TEMPLATE.md, STARS_HEXA.md, PENALTY.md
   - Update README, TASKLIST, ROADMAP, RELEASE_NOTES, LEARNINGS

8) QA, Versioning, Deploy
   - Manual verification (tests prohibited)
   - Version bump per protocol; doc sync; vercel --prod

Acceptance Criteria
- STARS_HEXA functions as a module without creating a new game type or duplicating systems.
- All Stars Hexa properties (rules, texts, colors) editable via admin tabs; persisted and reflected in play UI.
- 4-page standardized flow implemented and responsive.
- Config precedence working predictably.
- Documentation added and consistent; timestamps ISO 8601 with milliseconds (UTC).

Notes on Compliance
- 2025-09-06T18:46:30.000Z — Implemented standardized 4-page flow foundation and unified admin GameEditor usage. Added resolver and defaults for normalized config; introduced backward-compat redirect /play/[gameId] → /welcome preserving ?ref.
- Reuse Before Creation: Extend existing components (UnifiedRegistration, GameRulesPage, GameStatus, layouts) before adding new ones.
- Code Comments: Add what/why comments for new code paths.
- No breadcrumbs; tests prohibited.

---

Timestamp: 2025-09-07T17:15:13.000Z
Author: Agent Mode (AI)
Topic: Proceed with 4-Page Flow Standardization & Documentation Finalization

---

Timestamp: 2025-09-08T08:56:53.000Z
Author: Agent Mode (AI)
Topic: Enforce centralized Hero/Main defaults across all play pages

Summary
- Implemented unified 2% / 18% / 2% / 76% / 2% layout via shared HeroBlock/MainBlock
- Default page background #000000FF, hero #000000FF, main #444444FF
- Global text color #FFFFFFFF; font family Noto Sans
- Titles rendered using scoreboard cards (PenaltyCardText); Game hero renders live SplitFlapScoreboard for penalty
- Fixed Next.js App Router page prop signatures (params/searchParams are objects, not Promises)

Next
- Patch bump before dev verification if requested
- After manual verification, minor version bump, docs sync, commit, deploy

Plan (Forward-Looking)
- Verify resolver and standardized pages are present and wired (done); focus on documentation alignment and release protocol.
- Update ROADMAP.md and TASKLIST.md with current plan and timestamps (ISO 8601 UTC with milliseconds).
- Ensure referral (?ref) is propagated across /welcome → /rules → /game → /result (verified in clients).
- Confirm admin edit route uses the unified GameEditor wrapper (present) and retain single-source layout.
- Prepare manual verification plan, then follow versioning: MINOR bump before commit; update all docs; deploy via vercel --prod.

Dependencies
- Existing game types and configuration schema
- Platform texts/styles integration in GameEditor

Compliance
- Timestamps strictly ISO 8601 with milliseconds (UTC)
- Tests prohibited; manual verification only
- No breadcrumbs; consistent hero scoreboard pattern

---

Timestamp: 2025-09-12T08:21:57.000Z
Author: Agent Mode (AI)
Topic: Facebook JS SDK Login Integration
Plan:
- Load FB SDK globally in app/layout.tsx (next/script), init with NEXT_PUBLIC_FACEBOOK_APP_ID, emit fb-sdk-ready
- Replace anchor-based redirect login with FB.login popup on the welcome page
- Add POST /api/auth/facebook/client to verify token (debug_token) and set httpOnly user-session cookie
- Redirect to /play/[gameId]/rules preserving ?ref; no anchor fallback
- Update env (.env.local), README (SDK flow), TASKLIST/ROADMAP
Notes:
- Tokens are never stored; only minimal cookie with provider,id,name,email,iat
- Legacy OAuth routes retained for rollback only (annotated)
- All timestamps ISO 8601 with ms (UTC)
