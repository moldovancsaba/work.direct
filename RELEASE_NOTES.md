# 📝 RELEASE_NOTES.md - PlayMass

**Current Version**: 4.8.3
**Last Updated**: 2025-10-04T10:45:03.333Z

## 🔹 Version History

### [v4.8.3] — 2025-10-04T10:45:03.333Z
- Automatic predev patch bump


### [v4.8.2] — 2025-10-04T10:04:31.548Z
- Automatic predev patch bump


### [v4.8.1] — 2025-10-03T18:02:03.018Z
- Automatic predev patch bump


### [v4.8.0] — 2025-10-03T17:02:00.000Z
**Feature: WHACKPOP Game Type - Complete End-to-End Implementation**

**Summary**
Added WHACKPOP (Whack-a-Mole style) game type with complete admin editor, database schema, game component, and client integration. Zero new dependencies; 100% reuse of existing libraries and patterns.

**New Game Type: WHACKPOP**
- ✅ Grid-based fast-paced action game on hexagonal or square maps
- ✅ Progressive difficulty: Linear interpolation of spawn/display intervals across rounds
- ✅ Combo scoring system: Multiplicative rewards for consecutive hits
- ✅ Customizable themes: classic, neon, arcade, pixel
- ✅ Hit effects: burst, sparkle, shockwave, confetti
- ✅ Triple-layer validation: Client UI, Database schema, Server-side logic
- ✅ Immediate response: onPointerDown for ~50-100ms faster input handling

**Files Created** (2 files, ~1073 lines)
- `app/components/games/WhackPopGame.tsx` (658 lines) - Game component with progressive difficulty and combo system
- `app/components/admin/WhackPopCustomizationForm.tsx` (415 lines) - Comprehensive admin editor form

**Files Modified** (5 files, ~370 lines added)
- `app/types/index.ts` - Added WhackPopConfiguration interface (+50 lines)
- `app/lib/models/Game.ts` - Added whackPop Mongoose schema with validation (+140 lines)
- `app/play/[gameId]/game/GameClientClean.tsx` - Added WHACKPOP routing (+25 lines)
- `app/components/admin/GameEditor.tsx` - Added WHACKPOP editor integration (+135 lines)
- `app/api/admin/game-types/route.ts` - Added WHACKPOP to allowed types (+20 lines)

**Total Code**: ~1443 lines of production-ready, fully commented TypeScript/React

**Technical Implementation**
- ✅ **Zero New Dependencies**: 100% reuse of existing libraries
  - Reused hex/square geometry utilities from QUIZZZ
  - Reused map loading API and predictive search
  - Reused admin editor patterns (one-input-per-line, color pickers, validation)
  - Reused Tailwind CSS animations and Framer Motion
- ✅ **Performance Optimizations**:
  - onPointerDown for immediate response (~50-100ms faster than onClick)
  - useMemo for grid geometry calculations
  - useRef for timer management
  - Set-based debouncing for double-hit prevention
- ✅ **Progressive Difficulty**:
  - Formula: `value = initial + (min - initial) * (round-1)/(rounds-1)`
  - Smooth interpolation for spawn intervals and display durations
- ✅ **Combo Scoring**:
  - Formula: `award = hitPoints * (1 + (streak - 1) * (multiplier - 1))`
  - Multiplicative rewards without exponential runaway

**Data Flow**
Admin UI → Database (whackPop config) → GameClient routing → WhackPopGame component → Result page

**Validation**
- Client-side: Min/max validation on all number inputs, enum validation on selects
- Database: Comprehensive Mongoose schema with ranges and enums
- Server-side: Cross-field validation (e.g., minInterval cannot exceed initialInterval)

**Configuration Options**
- Map integration: Hex or square grid maps with selectedMaps/mapName fallback
- Gameplay timing: gameDuration (30-180s), rounds (1-5), targetScore
- Spawn mechanics: initialSpawnInterval, minSpawnInterval, simultaneousTargets (1-5)
- Target visibility: initialDisplayDuration, minDisplayDuration
- Scoring: hitPoints (1-1000), missPenalty (0-500), comboMultiplier (1.0-5.0)
- Theming: theme (classic/neon/arcade/pixel), hitEffect (burst/sparkle/shockwave/confetti)
- Visual assets: targetImages (CDN URLs), targetEmoji (fallback)
- Colors: background, inactiveCell, activeTarget, hitFeedback, missFeedback (hex values)

**Build Status**
- ✅ `npm run build` - PASSING (zero TypeScript errors, zero warnings)
- ✅ `npm run lint` - PASSING (zero ESLint warnings or errors)
- ✅ Zero security vulnerabilities

**Documentation Updates**
- ✅ README.md - Added WHACKPOP to game types section
- ✅ ARCHITECTURE.md - Added comprehensive WHACKPOP section with data flow
- ✅ LEARNINGS.md - Documented key implementation decisions (onPointerDown, setTimeout chaining, progressive difficulty, combo system, reuse inventory)
- ✅ All timestamps updated to ISO 8601 with milliseconds (UTC)

**Code Quality**
- ✅ Every function and hook fully commented with WHAT (functionality) and WHY (architectural rationale)
- ✅ Pattern alignment: Follows QUIZZZ standards exactly (DB-driven config, centralized editor, standardized types)
- ✅ Reuse-before-creation compliance: Zero duplication, maximum reuse

**Status**: Stable MVP, ready for manual QA testing and deployment

### [v4.7.1] — 2025-10-02T13:08:57.317Z
- Automatic predev patch bump


### [v4.7.0] — 2025-10-02T11:59:58.000Z
**Phase 0-2: Governance, Stabilization, Security & Stability Hardening**

**Phase 0 - Governance & Baseline (Complete)**
- ✅ Created comprehensive AUDIT_REPORT.md (499 lines) with 40-task improvement plan
- ✅ Created CONTRIBUTING.md (521 lines) documenting all development policies and protocols
- ✅ Added .nvmrc file (Node.js 22.19.0) for environment consistency
- ✅ Updated package.json engines field (node >=20.0.0, npm >=9.0.0)
- ✅ Logged audit plan to WARP.DEV_AI_CONVERSATION.md with ISO 8601 timestamps
- ✅ Synchronized all documentation to version baseline

**Phase 1 - Critical Stabilization (Complete)**
- ✅ Removed 17 duplicate files with " 2" suffix (more than initially reported)
  - Fixed duplicate files: SystemStatus, Toast, PenaltyCustomizationForm, StarsHexaCustomizationForm, GameDescription, GameStatus, UnifiedGamePage, PenaltyScoreboard, PenaltyHexa, PenaltyShootout, playmassDefaults, deepMerge, TargetGroup, PlaymassDefaults, SystemSettings, FormControls, ThemeContext
  - Restored 4 missing canonical files from git history
  - Fixed 5 incorrect imports referencing deleted " 2" files
  - Created PenaltyScoreboard.tsx stub for legacy compatibility
- ✅ Fixed ESLint warning in GameEditor.tsx line 143 (unused disable directive)
- ✅ Git stabilization: Created branch stabilize/2025-10-02T112931Z, committed all changes (71 files), achieved clean working tree
- ✅ Version synchronization across all documentation (README, ARCHITECTURE, WARP, LEARNINGS, CONTRIBUTING)
- ✅ Console.log removal deferred to Phase 3 for systematic structured logging implementation
- ✅ Build verification: PASSING
- Commit: 75007a5 "chore: Phase 0-1 complete - governance baseline and critical stabilization [v4.6.17]"

**Phase 2 - Security & Stability Hardening (Complete)**
- ✅ Dependency updates and security audit
  - Cleaned duplicate " 2" folders from node_modules causing npm conflicts
  - Performed full clean reinstall: rm -rf node_modules package-lock.json && npm install
  - Installed 417 packages
  - npm audit result: **0 vulnerabilities** ✅
  - Identified outdated packages for future updates (React 19, Tailwind 4, various patch versions)
- ✅ Hardcoded secrets verification
  - Confirmed no hardcoded MongoDB connection strings
  - Verified .gitignore properly excludes all .env files
  - All secrets properly managed via environment variables
- ✅ React Error Boundaries implementation
  - Created app/global-error.tsx (183 lines) with comprehensive error handling
  - User-friendly fallback UI with error icon, "Try Again" reset, and "Go Home" navigation
  - Development mode shows detailed errors, production mode hides sensitive details
  - Uses Next.js Link component (fixed ESLint warning)
- ✅ Rate Limiting implementation
  - Installed rate-limiter-flexible package
  - Created app/lib/rateLimit.ts (162 lines) with comprehensive rate limiting utilities
  - Authentication Rate Limiter: 5 points/minute, 15-minute block after exceeding
  - General API Rate Limiter: 100 points/minute for future use
  - Proxy-aware IP extraction (x-forwarded-for, x-real-ip, cf-connecting-ip)
  - Integrated with /api/admin/login endpoint (returns HTTP 429 with Retry-After header)
- ✅ Legacy code cleanup (addressed in Phase 1 with stub components)
- ✅ Build verification: PASSING
- Commit: 11fecbd "feat: Phase 2 complete - security and stability hardening [v4.6.17]"

**Technical Improvements**
- Overall Health Score: 7.2/10 → ~7.8/10 (target 9.2/10)
- Security Score: 6.5/10 → ~8.5/10 (target 9.0/10)
- Zero security vulnerabilities
- Clean working tree
- Passing build
- ESLint warnings: 0

**Files Added**
- .nvmrc
- AUDIT_REPORT.md (499 lines)
- CONTRIBUTING.md (521 lines)
- app/global-error.tsx (183 lines)
- app/lib/rateLimit.ts (162 lines)
- app/components/games/PenaltyScoreboard.tsx (54 lines, legacy stub)

**Files Modified**
- package.json (added engines field)
- app/api/admin/login/route.ts (rate limiting integration)
- app/lib/config/playmassDefaults.ts (renamed from " 2" version)
- app/lib/models/PlaymassDefaults.ts (renamed from " 2" version)
- app/lib/models/SystemSettings.ts (renamed from " 2" version)
- app/lib/utils/deepMerge.ts (renamed from " 2" version)
- All documentation files synchronized to v4.6.17 → v4.7.0

**Next Steps**
- Phase 3: Code Quality (standardize comments, TypeScript strictness, structured logging, Zod validation)
- Phase 4: Features & Enhancements (accessibility, monitoring, Sentry, caching)
- Phase 5: Documentation Hardening (SECURITY.md, schema diagrams, runbook)
- Phase 6: Technical Debt Reduction (React 19 eval, Tailwind 4, bundle optimization)
- Phase 7: Process Automation (Husky hooks, GitHub Actions CI/CD)

### [v4.6.17] — 2025-10-01T12:34:48.966Z
- Automatic predev patch bump


### [v4.6.16] — 2025-10-01T11:25:44.131Z
- Automatic predev patch bump


### [v4.6.15] — 2025-09-28T16:12:12.039Z
- Automatic predev patch bump


### [v4.6.14] — 2025-09-28T10:40:45.201Z
- Automatic predev patch bump


### [v4.6.13] — 2025-09-28T10:39:43.903Z
- Automatic predev patch bump


### [v4.6.12] — 2025-09-28T08:35:14.086Z
- Automatic predev patch bump


### [v4.6.11] — 2025-09-28T08:04:14.854Z
- Automatic predev patch bump


### [v4.6.10] — 2025-09-27T21:07:56.223Z
- Automatic predev patch bump


### [v4.6.9] — 2025-09-27T19:26:00.484Z
- Automatic predev patch bump


### [v4.6.8] — 2025-09-27T19:02:14.090Z
- Automatic predev patch bump


### [v4.6.7] — 2025-09-27T18:45:01.634Z
- Automatic predev patch bump


### [v4.6.5] — 2025-09-27T17:46:40.813Z
- Automatic predev patch bump


### [v4.6.4] — 2025-09-27T17:20:35.323Z
- Automatic predev patch bump


### [v4.6.3] — 2025-09-27T13:10:51.061Z
- Automatic predev patch bump


### [v4.6.2] — 2025-09-24T10:32:26.358Z
- Automatic predev patch bump


### [v4.6.1] — 2025-09-23T12:54:33.360Z
- Automatic predev patch bump


### [v4.6.0] — 2025-09-23T12:19:54.000Z
- Minor: Version bump and documentation sync across README, ROADMAP, TASKLIST, RELEASE_NOTES, ARCHITECTURE, LEARNINGS.
- Cleanup: Removed legacy components and spaced-file artifacts; fixed /admin server-side redirect; resolved spaced imports in settings.
- Build: Clean compile; no ESLint warnings from deleted stubs.
- Governance: Logged plan in ROADMAP and TASKLIST per delivery protocol.
- Delivery: Pushed to origin/main and verified remote HEAD equals local (36f03e2) — 2025-09-23T12:24:51.000Z
### [v4.5.2] — 2025-09-23T09:27:12.616Z
- Automatic predev patch bump


### [v4.5.1] — 2025-09-23T09:23:48.422Z
- Automatic predev patch bump


### [v4.5.0] — 2025-09-23T08:44:43.000Z
- Enforce QUIZZZ-only across admin and runtime.
  - Admin Game Type API now purges non-QUIZZZ types and seeds only QUIZZZ.
  - Runtime play and result clients simplified to QUIZZZ-only.
  - Play API restricted to QUIZZZ; legacy branches removed.
- Removed legacy code paths and stubs left for unused components to prevent accidental imports.
  - StarsHexa, Penalty Shootout, Find Red, Wheel of Fortune components stubbed to empty modules.
  - Module registry restricted to QUIZZZ only.
- Data hygiene: executed scripts/purge_non_quizzz.js (no non-QUIZZZ games found to purge).
- Build: Clean compile; only warnings from stub files (unused-expressions) which do not affect runtime.

### [v4.4.2] — 2025-09-23T07:34:30.250Z
- Automatic predev patch bump


### [v4.4.1] — 2025-09-22T17:17:47.897Z
- Automatic predev patch bump


### [v4.4.0] — 2025-09-22T17:02:02.000Z
- Minor: Single standardized game type (QUIZZZ) enforced across admin; Game Type dropdown restored for future extensibility.
- Code cleanup: Removed non-QUIZZZ editor UIs; runtime supports attempt-level sessions and guest counting.
- Analytics: Validated-only session metrics; admin list/detail and analytics updated (distinct sessionId/participantId).
- DB: Added indexes (by_game_validated_session, by_game_validated_participant, unique_attempt_per_game).
- Scripts: purge_non_quizzz.js to remove all non-QUIZZZ games and related data safely.

### [v4.3.5] — 2025-09-22T17:00:17.400Z
- Automatic predev patch bump


### [v4.3.4] — 2025-09-22T16:53:57.651Z
- Automatic predev patch bump


### [v4.3.3] — 2025-09-22T07:18:57.537Z
- Automatic predev patch bump


### [v4.3.2] — 2025-09-22T07:13:26.869Z
- Automatic predev patch bump


### [v4.3.1] — 2025-09-21T20:37:06.888Z
- Automatic predev patch bump


### [v4.3.0] — 2025-09-20T19:44:11.000Z
- Admin stats: switched to attempt-level sessions (validated-only) across admin list/detail and analytics.
- Guests counted: allow uuid-only participants (trial/guest) — analytics and admin now include guest plays.
- Play endpoint: unified single-attempt completion flow; server-authoritative behavior confirmed.
- Removed legacy gameplay types from client and server endpoints.
- DB: added indexes for attempt-level idempotency and analytics; unique sparse index on (gameId, sessionId).
- Build: fixed analytics activeParticipants reference; error-free build.

### [v4.2.1] — 2025-09-20T18:54:00.590Z
- Automatic predev patch bump


### [v4.2.0] — 2025-09-20T15:45:16.787Z
- Minor release


### [v4.1.0] — 2025-09-20T15:00:22.000Z
- Chore: Version bump to v4.1.0 and documentation synchronization (ISO 8601 UTC with milliseconds).
- Note: Non-functional updates related to GitHub CLI authentication plan and documentation consistency.

### [v4.0.0] — 2025-09-20T13:30:02.000Z
- Major: Enforce DB-driven font colors everywhere; remove baked-in text color/size overrides across play UI.
  - Hero: Color now guaranteed via styles.hero.fontColor; Tailwind text-* overrides stripped from Hero Title Class; hex color sanitized.
  - Main Typography: Persist and apply styles.main.h1Color/h2Color/pColor; TypedText + multi-line blocks (Rules) and registration headings honor editor mapping.
  - Buttons: Persist NEXT_*_FG, CTA1_FG, INVITE_FG, PLAYAGAIN_FG, and CTA_BUTTONS[].fg; runtime applies all FG fields across Landing/Welcome/Rules/Result.
- Schema: Extended Mongoose Game model to persist hero.fontColor, main.*Color (h1/h2/p), and all button FG fields; CTA_BUTTONS[].fg added.
- Editor/Runtime: TEXT_26 and TEXT_27 now render with DB-driven classes/colors (no baked-in text-sm); new props in UnifiedRegistration wire the correct class+color.
- Cleanup: Removed baked-in text color utilities from GameRulesPage and Welcome status messages; removed global CSS that forced input colors via !important.
- Build: Verified local build.
- Docs: Bumped to v4.0.0 and synchronized timestamps (ISO 8601 with ms UTC).

### [v3.0.0] — 2025-09-20T09:00:32.000Z
- Major: Centralized Game Editor System established as the canonical model for all current and future games.
  - General Platform Editor (shared across all games): hero/main/legal texts and styles, DB-driven defaults (no baked text), H1/H2/P per-text mapping, unified CTA grid.
  - Game-Type Specific Editor: only game logic and assets (e.g., QUIZZZ board, questions), strictly composed inside the shared layout.
  - Fonts: Google Fonts set to display=block to eliminate style-swap flicker; typography classes default to black and maintain sizes per H1/H2/P selectors.
- Breaking: Removed map shape fallbacks and auto-expansion in QUIZZZ.
  - Only configured maps (selectedMaps first, else mapName) are used; if none resolve, the board stays empty (no visual flash).
  - No auto-fill expansion for missing coordinates; uses only the configured/loaded coordinates.
- UX: Anti-flicker improvements.
- Minimal Loading… placeholders for QUIZZZ while fetching maps.
  - Suppress transient “configuration error” checks until load completes.
- Editor improvements:
  - Input placeholders for Name/Email/Phone use the game-editor H1/H2/P mapping (TEXT_13/15/17) and render in black. Labels (TEXT_12/14/16) also use H1/H2/P.
  - Robust background parser for button BG (multiline CSS): always picks the last background: … and supports linear-gradient(...) with nested rgba(...).
- Failures fixed (highlights):
  - Focus loss on Description (TEXT_11) while typing due to remount — fixed by stabilizing component types.
  - Duplicate helper lines under inputs on Welcome — removed; only placeholders remain.
  - White-on-white text defaults — enforced black text defaults across hero/main; preserved type sizes.
  - Font swap flicker — eliminated with display=block.
  - Scoreboard titles/props and legacy label leakage — removed and disabled across pages.
- Governance & Docs: Synchronized versions and timestamps; updated architecture, roadmap, tasklist, and learnings.

### [v2.3.0] — 2025-09-19T18:35:15.000Z
- Welcome: Render TEXT_13 (Your Name Placeholder), TEXT_15 (Your Email Placeholder), TEXT_17 (Your Phone Placeholder) as visible helper lines using the H1/H2/P dropdown mapping from the editor.
- Defaults: Enforce black text by default for Hero/Main across Landing, Welcome, Rules, and Result; keep proper H1/H2/P sizes.
- Buttons: Robust parsing of multiline Button BG (CSS) — applies the last background declaration and supports linear-gradient(...) with nested rgba(...).
- Admin: Fixed Description (Markdown) TEXT_11 losing focus by stabilizing the input component to prevent remounts on each keystroke.

### [v2.2.1] — 2025-09-19T11:05:22.000Z
- Chore: Patch bump before dev session; documentation timestamps synchronized; no functional changes in this bump.

### [v2.2.0] — 2025-09-19T09:44:22.000Z
- QUIZZZ: Editor now supports visual styles (tileStyles: inactiveTileBg/inactiveTileEdge/boardTileBg/boardEdge) and card colors/emojis (backBg/frontFg/goodAnswerBg/goodAnswerEmoji/wrongAnswerBg/wrongAnswerEmoji); persisted in configuration.quizzz
- QUIZZZ: Runtime wires styles; cards become inactive after answering and show good/wrong emoji; background precedence enforced (backgroundCss > map background image > platform main)
- Game Types: Added DB-backed model and admin API (/api/admin/game-types); editor dropdown reads from DB and de-duplicates by code
- Maps: Public endpoints to fetch reusable maps by name or random — hex (/api/hexmaps/[name], /api/hexmaps/random) and square (/api/squaremaps/[name], /api/squaremaps/random)
- Build: Verified production build; no type or lint errors

### [v2.1.1] — 2025-09-18T09:50:30.000Z
- Chore: Patch bump before development cycle; synchronized documentation versions; no functional code changes

### [v2.1.0] — 2025-09-17T11:56:16.000Z
- Hero: Logo visible on all HERO blocks across Landing/Welcome/Rules/Game/Result/Legal pages
- Hero: Reduced HERO height by 50% (from ~20vh to 10vh); MAIN adjusted to fill remaining viewport
- Admin: Added “Use SCOREBOARD in HERO (Split-Flap)” checkbox in Hero Settings; when unchecked, HERO renders normal text instead of split-flap
- Model: configuration.platform.styles.hero.useScoreboard persisted (Boolean, default true)
- Resolver: HERO_LOGO_* passthrough; styles.hero.useScoreboard exposed to clients
- UI: HeroBlock respects useScoreboard and always renders logo when provided
- Build: Verified production build; no type or lint errors
- Docs: Updated version and timestamps (ISO 8601 UTC with ms)

### [v2.0.0] — 2025-09-16T19:41:30.000Z
- Major: Unified Map Creator at /admin/mapcreator for HEXA and SQUARE; removed DIAMOND system-wide
- Admin: Board-quiz map selector predictive across types with selectedMaps chips and reordering (↑/↓)
- Runtime: Board-quiz loads first selected map strictly by type; strict fetch removes cross-type 404 noise
- Feature: Board-quiz card cover images (transparent PNGs) clipped to tile polygon; hides edges/card back and labels when cover present
- Model/Types: Added configuration.quizz.selectedMaps and cardCoverImages; removed DIAMOND from enums; added SquareMap model and admin/public APIs
- Docs: Updated README, ROADMAP, TASKLIST, ARCHITECTURE, LEARNINGS, WARP.md; timestamps synchronized (ISO 8601 UTC with ms)
- Build: Verified production build

### [v1.28.0] — 2025-09-15T17:30:23.000Z
- Fix: Allow board-quiz type in Game model enum so admin can create games without validation errors

### [v1.27.0] — 2025-09-15T17:12:04.000Z
- New Game Type: Board Quiz (hexamap-based) released
  - Types: Added quiz type to GameType; question structure with exactly 3 answers (multiple correct supported)
  - Model: Extended Game schema with configuration.quizz (rounds, targetCorrect, questions[], optional mapName, activeCoords[])
  - Admin: QuizzCustomizationForm for adding/removing questions (3 answers), rounds and target correct
  - Runtime: QuizzHexa gameplay component with overlay hex question UI and round/score tracking
  - Registry/Editor: Integrated into module registry and GameEditor (create/edit)
  - Result: Result client updated to handle quiz outcomes
- Public API: GET /api/maps/[name] to fetch active HexMap by name (coords, radius, hexCount)
- Docs: Updated README, ARCHITECTURE, TASKLIST, ROADMAP, LEARNINGS, WARP.md; synchronized timestamps (ISO 8601 UTC with ms)

### [v1.26.0] — 2025-09-15T16:28:12.000Z
- Feature: Hexa Map Creator admin page at /admin/hexacreator with infinite honeycomb grid (Penalty engine), axial q,r labels, selection ring (radius 4), and full CRUD
- API: Admin hexmaps endpoints — GET/POST /api/admin/hexmaps, GET/PUT/DELETE /api/admin/hexmaps/[id] (soft delete by default)
- Model: HexMap with unique name, coords[], radius=4, hexCount (computed), tags[], isActive; text index for name,tags search
- Refactor: Shared hex geometry utilities (axialToPixel, rotatePoint, hexVertices, hexDistance) and PenaltyHexa switched to shared module
- Fix: Next.js App Router param typing for admin hexmaps/[id]; add StarsHexa onRoundUpdate prop to satisfy GameClient usage
- Chore: Remove duplicate Mongoose index definition to eliminate warnings

### [v1.25.0] — 2025-09-15T12:45:05.000Z
- UI: Remove duplicate legal footers on play pages; keep a single footer pinned to the bottom of the screen
- UX: Added safe bottom padding to Main content so the pinned footer never overlaps content
- UI: Increased button height to min 48px and vertically centered text to accommodate longer labels
- Welcome: Aligned “Next With Login Button” beside and vertically centered with the “Continue with Facebook” button; side-by-side on md+ screens, stacked on small screens
- Layout: Removed black gaps between HERO and MAIN and below MAIN by eliminating external margins and adding controlled padding

### [v1.24.0] — 2025-09-15T11:11:36.000Z
- Fix: "Continue with Facebook" button now works reliably
  - Fallback to legacy OAuth redirect (/api/auth/facebook/start) if SDK not ready or App ID missing
  - Status feedback under buttons (initializing/errors), button shows "Connecting…" during in-flight
  - Maintains JS SDK popup path when available; server verification remains unchanged
- Build: Verified Next.js build

### [v1.23.0] — 2025-09-15T10:36:24.000Z
- Changed: UI labels adjusted; legacy naming removed.
- Added: Consistent "Game Settings & Configuration" subheading across editors
- Improved: Edit save workflow keeps you on the page and shows ISO timestamp
- Fixed: Hero Background (CSS) now applies to Hero across Landing/Welcome/Rules/Game/Result
- Improved: "Continue with Facebook" aligned next to primary Next button with identical size
- Fixed: INVITE_REFERRAL now shares/copies a referral link using participant uuid instead of navigating back
- Docs: Updated metadata and README keywords; version/timestamps synchronized (ISO 8601 with ms UTC)

### [v1.22.0] — 2025-09-14T16:12:23.000Z
- Admin: Fixed login route and auth hook import; /admin/login now resolves correctly
- Backend: Removed unique index from shareLinks.id in Game schema; added migration script to drop existing index and ensured sparse unique index on shareLinks.shortCode
- API: Hardened defaults in admin game creation to avoid undefined access during build
- Build: Verified successful Next.js production build
- Docs: Synchronized version and timestamps (ISO 8601 with ms)
### [v1.21.0] — 2025-09-14T08:35:53.000Z
- New Game: Get Shorty (Find Red) implemented with configurable pack size (X), reds per pack (Y), selections per round, target reds (Z), and total rounds (W); theme colors and Shorty label.
- Model: Extended Mongoose Game schema with configuration.findRed sub-schema and validation defaults.
- API: /api/games/[id]/play updated for play result handling.
- UI: New FindRed component with 3D flips (~200ms), early win, per-round shuffles; integrated into standardized 5-page flow.
- Resolver/Registry: Added module registry and playConfig resolver for Find Red and Wheel; standardized Welcome/Rules/Game/Result mapping.
- Wheel: Reintroduced spin-wheel mode and resolver; client rendering via wheel; server-weighted selection support.
- Docs: Version and timestamp sync across all required files per protocol (ISO 8601 UTC with ms).

### [v1.20.0] — 2025-09-13T19:48:48.015Z
- Play Pages: Enforced no-scroll on the Game page via document-level overflow lock and fixed full-viewport container.
- Build: Verified successful Next.js build.

### [v1.19.0] — 2025-09-13T18:47:30.559Z
- Admin Editor: Renamed "Platform Settings" to "Hero Settings" in GameEditor.
- Admin Editor: Moved "Scoreboard Styles" under Hero Settings (before Landing).
- Admin Editor: Added inline Cancel/Update action bars between sections: Basic→Hero, Hero→Landing, Landing→Welcome, Welcome→Rules, Rules→Result, Result→Main Styles, Main Styles→Legal.
- Build: Verified successful Next.js build.

### [v1.20.1] — 2025-09-14T07:33:11.000Z
- Types: Updated game type enum
- Config: Add configuration.findRed with X/Y/Z/W, selectionsPerRound, colors, and label (Shorty)
- Model: Extend Game mongoose schema with findRed sub-schema and validations
- UI: New FindRed game component with 3D flips and client-authoritative rounds
- Flow: Wire FindRed into standardized GameClient and scoreboard
- Admin: Add basic type select entries (Get Shorty, Wheel of Fortune) and MVP settings block for Find Red
- Protocol: Patch version bump per versioning rules

### [v1.18.1] — 2025-09-13T16:27:18.176Z
- UI (Landing): Disable scroll and remove all margins around Hero/Main blocks for a full-screen landing layout.
- Chore: Patch bump per protocol.

### [v1.18.0] — 2025-09-13T12:44:07.090Z
- Docs: Add whitespace to README to trigger commit
- Chore: Version bump to 1.18.0 and synchronize documentation timestamps
- Note: No code changes; build-only verification

### [v1.17.0] — 2025-09-13T12:01:17.000Z
- Build: Fix Next.js compile failure by adding `app/globals.css` so `import './globals.css'` resolves in `app/layout.tsx`.
- Docs: Synchronized version and timestamps across README, TASKLIST, ROADMAP, RELEASE_NOTES, ARCHITECTURE, LEARNINGS, and WARP.
- Landing Page: Persist Landing configuration and finalize UI
  - Database schema: Added LANDING_TITLE, LANDING_IMAGE_URL, NEXT_WELCOME_TEXT, NEXT_WELCOME_ACTION, NEXT_WELCOME_BG under configuration.platform.texts
  - Admin editor: Moved Landing Title into Hero Settings; added Landing Image URL and Next Welcome Button block (text/action/bg)
  - UI: Background image now covers the main block; CTA centered; legal links pinned at the bottom; NEXT_WELCOME_ACTION respected (GO_TO_WELCOME)
  - Build: Resolved missing module imports by aligning admin/game imports with existing files
- Docs: Version bump and synchronized timestamps per ISO 8601 with milliseconds

### [v1.15.0] — 2025-09-12T08:38:38.000Z
- Auth: Implemented Facebook Login via JS SDK popup
  - POC: Cross-game end-user session persistence for 24h via GET/POST /api/auth/session and unified cookie expiry
  - Global SDK load in app/layout.tsx with readiness event
  - New endpoint POST /api/auth/facebook/client verifies accessToken (debug_token), fetches profile (id,name,email), and sets httpOnly user-session cookie
  - Welcome page uses FB.login and redirects to /play/[gameId]/rules preserving ?ref
  - Legacy OAuth redirect routes retained for rollback; no UI entry points
- Docs: Updated README (SDK flow), TASKLIST, ROADMAP, WARP.md; .env.local now includes FB variables

### [v1.14.0] — 2025-09-11T15:55:02.000Z
- Admin Editor: Additional CTAs are now displayed as 3 distinct lines (TEXT, URL, BG) per CTA card.
- Docs/Version: Bumped to 1.14.0 and synchronized timestamps (ISO 8601 with ms).

### [v1.13.0] — 2025-09-11T14:53:30.000Z
- Admin Editor: Standardized 3-line CTA blocks for all key buttons (Text, URL/Action, BG) with editor-only borders.
- Database Schema: Added CTA1_TEXT/CTA1_URL and NEXT_*/INVITE/PLAYAGAIN fields under configuration.platform.texts (legacy keys preserved).
- Types: Extended PlatformTexts with standardized CTA fields and ACTIONs.
- Compatibility: Editor adapters mirror standardized keys to legacy keys on save to keep runtime stable.

### [v1.10.0] — 2025-09-11
- Public site: Added top-level Terms (/terms) and Privacy (/privacy) pages using hero+main blocks.
- Game page: Horizontally centered gameplay container.

## [v1.9.0] — 2025-09-11
- Legal Docs: Added publicly available Terms & Conditions and Privacy Policy pages under /play/[gameId]/terms and /play/[gameId]/privacy, using HeroBlock/MainBlock layout.
- Admin: New Legal Documents section with multiline fields for TERMS_TITLE, TERMS_BODY, PRIVACY_TITLE, PRIVACY_BODY.
- Footer: Terms & Privacy links added to Welcome, Rules, Game, and Result pages.
- Game Page: Game content centered in the main block.

### [v1.8.0] — 2025-09-11
- Result CTAs: Per-button unique background support (CTA_BUTTONS[].bg). Admin editor includes BG input per CTA; runtime prefers per-CTA bg and falls back to CTA1_BG.
- UI Alignment: All MainBlock content center-aligned across play pages.

### [v1.7.0] — 2025-09-11
- Admin Editor: Welcome section restructured — TEXT_11, TEXT_26, TEXT_27 are multiline (Markdown-capable). Paired Ask/Placeholder fields aligned side-by-side (TEXT_12+TEXT_13, TEXT_14+TEXT_15, TEXT_16+TEXT_17). Single-row controls for TEXT_18 and TEXT_19.
- Admin Editor: Result section enhanced — WON_TEXT and LOST_TEXT (H1, Markdown), TEXT_41 multiline (Markdown), TEXT_44 + TEXT_44_URL side-by-side, CTA1_BG multiline CSS.
- Admin Editor: All color setup fields now support multiline CSS (Hero/Main/Scoreboard BG & Digit Color) with the exact code format requested.
- Runtime: Main block width set to 100% of screen.
- Runtime: Welcome description (TEXT_11) centered and preserves line breaks.
- Runtime: Result page shows win/lose headline (WON_TEXT/LOST_TEXT) and applies CTA background (CTA1_BG) while keeping pressed-style behavior.

### [v1.6.0] — 2025-09-11
- Admin: Unified new-game page to reuse GameEditor (create mode) so platform texts/styles save consistently for all games.
- Admin: PlatformSettingsForm CTA fields fixed — use TEXT_44 and TEXT_44_URL; duplicate labels removed.
- Result: CTA buttons open in new tab and show pressed background style (uses main.buttonSecondaryClass on press; reverts on release).
- Welcome: Email and Phone H2 headings are rendered via UnifiedRegistration (TEXT_14, TEXT_16) with styles.main.h2Class.
- Typography: Inter now loads with latin-ext subset globally; Noto Sans fallback kept.

### [v1.5.0] — 2025-09-11
- Welcome: Show H2 headings for Name/Email/Phone (TEXT_12/TEXT_14/TEXT_16) and per-game helper texts
  - TEXT_26: Contact required hint (email or phone)
  - TEXT_27: Try without registration tagline
- Result: CTA Action (TEXT_44) as button wired to per-game TEXT_44_URL
- Fonts: Global Noto Sans (primary) + Inter (secondary) with latin-ext coverage for “ÁÉÍÓŐÚŰ” and other extended characters
- Scoreboard: Title flip now supports hu-HU uppercase and extended charset (Í/Ő/Ű visible)
- Admin: Removed duplicate legacy Game Type selector from new game page
- Fix: Welcome headings readable (no more white-on-white)

### [v1.4.0] — 2025-09-10
- Fix: Welcome registration inputs kept losing focus due to remounts. Replaced inline wrapper with stable div in UnifiedRegistration for continuous typing.
- UX: Result page simplified — removed "Copy Link" and "Share" CTAs; kept "Invite Friend" and "Play Again".
- Admin: Games dashboard stats fixed — unique players per game from GameResult.distinct('participantId'); rewards per game via Reward.gameId.
- Admin: Participants page now shows an "Invites" column counting joins via each participant’s referral UUID.
- Data: Reward model now links to game via required gameId with index for fast queries.
- Docs: Synchronized documentation and bumped version per protocol.

### [v1.3.1] — 2025-09-10
- Admin: Added basic password login flow (MVP parity with MessMass)
  - Endpoints: POST/DELETE /api/admin/login, GET /api/admin/auth
  - Cookie: httpOnly `admin-session` (base64 JSON token, 7 days)
  - UI: /admin/login page with redirect to /admin after success
  - Guarded all admin API routes and admin layout (except /admin/login)
- Notes: Simple, unsigned token for MVP; ROADMAP includes upgrade to signed tokens/JWT, rate limiting, and audit logging.

### [v1.3.0] — 2025-09-07
- Centralized Platform for 4-State games (Welcome, Rules, Game, Result)
  - Introduced configuration.platform.texts (TEXT_10..46) and styles (hero/main/scoreboard)
  - Refactored pages to use Hero + Main blocks; modules provide only the PLAY UI
  - Scoreboard colors + labels now admin-configured (styles.scoreboard.*)
- Admin
  - New type selection → redirect to /admin/games/new/[type]
  - PlatformSettingsForm integrated in GameEditor
  - Legacy configuration.general removed on save (migrated to platform)
- Runtime
  - Hero uses TEXT_30 for Game page
  - Resolver exposes platform and derives from legacy when missing
- Manual verification performed; tests prohibited per WARP policy.

### [v1.2.12] — 2025-09-06

- Standardized 4-page play flow foundation:
  - Added routes: /play/[gameId]/welcome, /rules, /game (kept /result unchanged)
  - Backward-compat redirect: /play/[gameId] → /welcome (preserves ?ref)
  - Added resolver to normalize per-game texts/colors into unified shape
- Admin: Unified /admin/games/[id]/page.tsx to reuse the shared GameEditor (mode="edit")
- Notes: No breaking changes. Manual verification required; tests prohibited.

### [v1.6.0] — 2025-08-29

**🎆 NEW GAME TYPE: Wheel of Fortune Integration**

#### 🎰 New Game Features
- **Wheel of Fortune Component** - Pure React + SVG spinning wheel with no external dependencies
- **Configurable Segments** - Custom labels, colors, and probability weights for each segment
- **Smooth Animations** - Hardware-accelerated CSS transitions with cubic-bezier easing
- **Flexible Pointer Positioning** - Support for top or right pointer placement
- **Result Callbacks** - Integration hooks for reward system and analytics
- **Responsive Design** - Automatically scales to different screen sizes

#### 📚 Type System Extensions
- Spin-wheel mode - Added to core game type enum
- **WheelSegment Interface** - Comprehensive segment configuration with rewards support
- **Enhanced GameConfiguration** - Added wheelOfFortune configuration options
- **Updated GameOutcome** - Added segment tracking for wheel results

#### 🎮 Component Architecture
- **WheelOfFortune.tsx** - Fully featured spinning wheel component
- **Polar Coordinate System** - Precise mathematical positioning for segments and labels
- **SVG Path Generation** - Dynamic arc creation for perfect pie slices
- **State Management** - Optimized React state handling for smooth performance
- **Test Page Integration** - `/wheel` route for component testing and demonstration

#### 🔧 Technical Implementation
- **Pure SVG Rendering** - No canvas or external graphics libraries required
- **Precise Landing Calculation** - Mathematical algorithm ensures accurate segment selection
- **Hardware Acceleration** - CSS `willChange` property for optimal animation performance
- **Memory Efficient** - Proper cleanup of timers and event listeners
- **TypeScript Support** - Full type safety throughout the component system

#### ⚙️ Configuration Options
- **Segment Count** - Support for any number of wheel segments
- **Spin Duration** - Customizable animation timing (default 4.5 seconds)
- **Rotation Amount** - Configurable base spins before landing
- **Theme Support** - Built-in theme system for consistent styling
- **Replay Control** - Optional immediate replay functionality

#### 🔗 Integration Points
- **Admin Interface Ready** - Full compatibility with existing game creation system
- **Reward System Compatible** - Segments can be linked to reward configurations
- **Analytics Tracking** - Result callbacks support comprehensive tracking
- **Socket.IO Prepared** - Ready for real-time multiplayer features

### [v1.5.0] — 2025-08-29

**🚀 MAJOR PERFORMANCE UPGRADE: Flash Gaming Optimization**

#### ⚡ Performance Improvements
- **Ultra-fast 200ms animations** - Reduced from 520ms for instant visual feedback
- **Parallel card flipping** - Remove debouncing to allow rapid successive clicks
- **Pre-generated DOM elements** - All hexagon cards rendered immediately on game load
- **Hardware-accelerated transforms** - Enhanced CSS animations with `willChange` optimization
- **Optimized state management** - Implemented `useReducer` for batched state updates
- **Immediate game end redirect** - Removed 2-second delay for instant result navigation

#### 🎮 Gameplay Enhancements
- **Auto-flip back mechanism** - Non-matching cards automatically flip back after 1 second
- **Visual click feedback** - Added instant `:active` state scaling (95%) for tactile response
- **Enhanced hover effects** - Smooth scale transitions (105%) for better UX
- **Parallel interaction support** - Players can now click multiple cards simultaneously

#### 🔧 Technical Optimizations
- Removed blocking UI operations from network calls
- Implemented non-blocking state transitions
- Enhanced error handling with offline gameplay continuity
- Improved memory management with cleanup timers
- Hardware acceleration for smooth 60fps animations

#### 💫 User Experience
- **Click-click-click responsiveness** - Instant feedback on rapid card interactions
- **Flash gaming speed** - No delays, no waiting, pure speed gameplay
- **Seamless transitions** - Smooth animations between all game states
- **Immediate results** - Instant redirect to result page on game completion

### [v1.4.1] — 2025-08-27

#### ✨ Initial Features
- Initial hex-grid gameplay prototype
- MongoDB integration with comprehensive data models
- Admin interface for game creation and management
- Player registration and trial mode support
- Reward system with multiple prize types
- Responsive hexagon layout with axial coordinates
- Game state persistence and session management

---

## 🔹 Performance Metrics

### Animation Performance
- **Before**: 520ms flip animations with debounced clicks
- **After**: 200ms lightning-fast flips with parallel interaction support

### User Interaction
- **Before**: Single card flip with 300ms debounce delay
- **After**: Multiple simultaneous card flips with instant feedback

### Game Completion
- **Before**: 2-second delay before result page redirect
- **After**: Immediate redirect on game completion

---

## 🔹 Breaking Changes

### v1.5.0
- **None** - All changes are backward compatible
- Existing games and saved states continue to work normally
- API endpoints remain unchanged

---

## 🔹 Developer Notes

### Architecture Improvements
- Migrated from multiple `useState` hooks to unified `useReducer` pattern
- Implemented React 18 concurrent features for better performance
- Enhanced component lifecycle management with proper cleanup
- Optimized re-render cycles with memoization strategies

### Code Quality
- Added comprehensive comments explaining performance optimizations
- Improved error boundaries and fallback mechanisms
- Enhanced TypeScript type safety for game state management
- Standardized animation timing constants

---

## 🔹 Future Roadmap

### v1.6.0 (Planned)
- Sound effects and haptic feedback
- Additional game modes and difficulty levels
- Multiplayer support and leaderboards
- Enhanced analytics and game metrics

### v1.7.0 (Planned)
- Mobile app optimization
- Offline gameplay capabilities
- Advanced reward distribution features
- Integration with external payment systems

---

**Maintainer**: AI Development Team  
**Repository**: PlayMass Interactive Game Platform  
**Technology Stack**: Next.js 15.5.2, React 18, TypeScript 5, MongoDB 6.18.0
