# 📝 RELEASE_NOTES.md - PlayMass

**Current Version**: 2.0.0
**Last Updated**: 2025-09-16T19:41:30.000Z

## 🔹 Version History

### [v2.0.0] — 2025-09-16T19:41:30.000Z
- Major: Unified Map Creator at /admin/mapcreator for HEXA and SQUARE; removed DIAMOND system-wide
- Admin: QUIZZ map selector now predictive across types with selectedMaps chips and reordering (↑/↓)
- Runtime: QUIZZ loads first selected map strictly by type; strict fetch removes cross-type 404 noise
- Feature: QUIZZ card cover images (transparent PNGs) clipped to tile polygon; hides edges/card back and labels when cover present
- Model/Types: Added configuration.quizz.selectedMaps and cardCoverImages; removed DIAMOND from enums; added SquareMap model and admin/public APIs
- Docs: Updated README, ROADMAP, TASKLIST, ARCHITECTURE, LEARNINGS, WARP.md; timestamps synchronized (ISO 8601 UTC with ms)
- Build: Verified production build

### [v1.28.0] — 2025-09-15T17:30:23.000Z
- Fix: Allow QUIZZ game type in Game model enum so admin can create QUIZZ games without validation errors

### [v1.27.0] — 2025-09-15T17:12:04.000Z
- New Game Type: QUIZZ (Hexamap Quiz) released
  - Types: Added 'QUIZZ' to GameType; QuizzQuestion with exactly 3 answers (multiple correct supported)
  - Model: Extended Game schema with configuration.quizz (rounds, targetCorrect, questions[], optional mapName, activeCoords[])
  - Admin: QuizzCustomizationForm for adding/removing questions (3 answers), rounds and target correct
  - Runtime: QuizzHexa gameplay component with overlay hex question UI and round/score tracking
  - Registry/Editor: Integrated into module registry and GameEditor (create/edit)
  - Result: Result client updated to handle QUIZZ outcomes
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
- Changed: UI labels "Stars Hexa" → "Hexa" (internal id STARS_HEXA preserved)
- Added: Consistent "Game Settings & Configuration" subheading across editors
- Improved: Edit save workflow keeps you on the page and shows ISO timestamp
- Fixed: Hero Background (CSS) now applies to Hero across Landing/Welcome/Rules/Game/Result
- Improved: "Continue with Facebook" aligned next to primary Next button with identical size
- Fixed: INVITE_REFERRAL now shares/copies a referral link using participant uuid instead of navigating back
- Docs: Updated metadata and README keywords; version/timestamps synchronized (ISO 8601 with ms UTC)

### [v1.22.0] — 2025-09-14T16:12:23.000Z
- Admin: Fixed login route and auth hook import; /admin/login now resolves correctly
- Backend: Removed unique index from shareLinks.id in Game schema; added migration script to drop existing index and ensured sparse unique index on shareLinks.shortCode
- API: Hardened defaults in admin game creation for FIND_RED and WHEEL_OF_FORTUNE to avoid undefined access during build
- Build: Verified successful Next.js production build
- Docs: Synchronized version and timestamps (ISO 8601 with ms)
### [v1.21.0] — 2025-09-14T08:35:53.000Z
- New Game: Get Shorty (Find Red) implemented with configurable pack size (X), reds per pack (Y), selections per round, target reds (Z), and total rounds (W); theme colors and Shorty label.
- Model: Extended Mongoose Game schema with configuration.findRed sub-schema and validation defaults.
- API: /api/games/[id]/play supports FIND_RED — records picks; unified gtype comparisons.
- UI: New FindRed component with 3D flips (~200ms), early win, per-round shuffles; integrated into standardized 5-page flow.
- Resolver/Registry: Added module registry and playConfig resolver for Find Red and Wheel; standardized Welcome/Rules/Game/Result mapping.
- Wheel: Reintroduced WHEEL_OF_FORTUNE type, schema and resolver; client rendering via LuckyWheel; server-weighted selection in play endpoint.
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
- Types: Add FIND_RED and WHEEL_OF_FORTUNE to GameType
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
- **WHEEL_OF_FORTUNE Game Type** - Added to core GameType enum
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
- Basic Stars Hexa game implementation
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
