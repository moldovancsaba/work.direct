# ROADMAP.md — PlayMass

Last Updated: 2025-01-08T22:00:00.000Z
- Forward-looking plan for PlayMass.
- Priorities and dependencies are explicitly stated to enable safe parallelization.

---

## ✅ COMPLETED MILESTONES

### Analytics & Multi-Game Support Enhancement — v4.9.0
- **Completed**: 2025-01-08T21:45:00.000Z
- **Priority**: HIGH
- **Dependencies**: WHACKPOP game type implementation (v4.8.0)
- **Deliverables Achieved**:
  - ✅ Fixed analytics data model for multi-game platform (QUIZZZ + WHACKPOP)
  - ✅ Added game-type-specific fields (hits, misses, score) to GameOutcome interface
  - ✅ Implemented game-type-aware analytics calculations (MongoDB $cond operator)
  - ✅ Enhanced admin UI with game type badges and visual indicators
  - ✅ Improved participants table with login type icons
  - ✅ All changes fully documented and backward compatible
- **Impact**: Platform now properly supports multiple game types with accurate, type-specific analytics
- **Status**: Deployed to GitHub (commit f16941d), production-ready

---

## 🎯 ACTIVE ROADMAP

---

## Q1 2025 — Growth, Scale & Enhancement Opportunities

### Option A: Third Game Type Implementation
- **Priority**: HIGH
- **Effort**: Large (3-5 days)
- **Value**: Platform diversification, market appeal
- **Dependencies**: WHACKPOP patterns established
- **Candidates**:
  1. **Memory Match** - Card matching pairs on grid (LOW complexity)
  2. **Spin Wheel** - Lucky wheel with customizable segments (LOW complexity)
  3. **Trivia Race** - Speed-based quiz with timer per question (MEDIUM complexity)
  4. **Puzzle Slide** - Sliding tile puzzle on hex/square grid (MEDIUM complexity)
  5. **Bingo Card** - Number-based bingo game (LOW complexity)
- **Deliverables**:
  - New game component following WHACKPOP/QUIZZZ patterns
  - Admin customization form
  - Database schema with validation
  - Game type integration and analytics support
  - Documentation updates

### Option B: Advanced Analytics Dashboard
- **Priority**: MEDIUM
- **Effort**: Medium (2-3 days)
- **Value**: Data-driven insights, business intelligence
- **Dependencies**: Current analytics API
- **Deliverables**:
  - Interactive charts library integration (recharts or Chart.js)
  - Time-series visualizations (plays over time, user growth)
  - Conversion funnel analytics (registration → play → completion)
  - Heatmap analytics for WHACKPOP/grid games
  - Export functionality (CSV/Excel)
  - Real-time dashboard updates (WebSocket or polling)
  - Filtering by date range, game type, participant segments

### Option C: Leaderboard System
- **Priority**: MEDIUM
- **Effort**: Medium (2-3 days)
- **Value**: Player engagement, viral growth
- **Dependencies**: Game results data, participant UUIDs
- **Deliverables**:
  - Global leaderboard (all-time, monthly, weekly, daily)
  - Per-game leaderboards
  - Real-time score updates
  - Rank calculation and caching strategy
  - Public leaderboard API endpoint
  - Embed widget for external sites
  - Social sharing integration

### Option D: Referral & Viral Growth System
- **Priority**: HIGH
- **Effort**: Medium (2-3 days)
- **Value**: Organic growth, user acquisition
- **Dependencies**: Participant UUID system (already in place)
- **Deliverables**:
  - Referral link generation with tracking
  - Referral rewards system (points, badges, prizes)
  - Viral share buttons (WhatsApp, Facebook, Twitter, email)
  - Referral analytics dashboard
  - Multi-level referral tracking (depth: 2-3 levels)
  - Referral campaign management

### Option E: Email & Notification System
- **Priority**: MEDIUM
- **Effort**: Medium (2-3 days)
- **Value**: Player retention, engagement
- **Dependencies**: Participant email collection
- **Deliverables**:
  - Email service integration (SendGrid, AWS SES, or Resend)
  - Transactional emails (welcome, game results, rewards)
  - Notification templates system
  - Email analytics (open rates, click rates)
  - Opt-in/opt-out management
  - Admin email campaign tool

### Option F: Reward Fulfillment Workflow
- **Priority**: LOW
- **Effort**: Large (3-4 days)
- **Value**: Complete reward lifecycle
- **Dependencies**: Reward system in place
- **Deliverables**:
  - Admin reward fulfillment dashboard
  - Coupon code generation and validation
  - Physical prize shipping workflow
  - Reward claim verification
  - Fraud detection and prevention
  - Reward inventory management
  - Integration with e-commerce platforms

### Option G: Mobile App (PWA)
- **Priority**: HIGH
- **Effort**: Medium (2-3 days)
- **Value**: Mobile-first experience, app store presence
- **Dependencies**: Current responsive design
- **Deliverables**:
  - PWA manifest and service worker
  - Offline game caching
  - Add to home screen prompts
  - Push notifications (web push API)
  - App shell architecture
  - iOS/Android splash screens
  - App store optimization (ASO) metadata

### Option H: Performance Optimization & Caching
- **Priority**: MEDIUM
- **Effort**: Small (1-2 days)
- **Value**: Speed, scalability, cost reduction
- **Dependencies**: Current architecture
- **Deliverables**:
  - Redis caching layer for analytics queries
  - Static asset CDN optimization
  - Database query optimization and indexing review
  - Image optimization pipeline (WebP, lazy loading)
  - Code splitting and bundle size optimization
  - API response compression
  - Rate limit optimization per user type

### Option I: Multi-Language Support (i18n)
- **Priority**: LOW
- **Effort**: Large (3-4 days)
- **Value**: Global market expansion
- **Dependencies**: Current English-only system
- **Deliverables**:
  - next-intl or i18next integration
  - Translation management system
  - Language selector UI
  - RTL support (Arabic, Hebrew)
  - Locale-specific date/time/number formatting
  - Admin translation editor
  - Default languages: English, Spanish, French, German

### Option J: Advanced Admin Tools
- **Priority**: MEDIUM
- **Effort**: Medium (2-3 days)
- **Value**: Operational efficiency
- **Dependencies**: Current admin system
- **Deliverables**:
  - Bulk operations (activate/deactivate multiple games)
  - Advanced filtering and search
  - Game cloning/duplication feature
  - Template system for game creation
  - Admin activity audit log
  - Role-based access control (super admin, editor, viewer)
  - Scheduled game activation/deactivation

---

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
