# Changelog

Generated from git history by `management/scripts/changelog-from-git.mjs`. Do not edit by hand: regenerate it.
Covers history up to commit `6879b81` (2026-10-05).

## 2026-10-05

- Add a licence and a changelog generated from git history (`c5eda7a`)
- Documentation baseline: handover, agent instructions, env example, README and plan accuracy fixes (`22cbd59`)

## 2026-09-23

- vercel.json: rewrite the bare root too (`45faa3e`)
- Public home and privacy pages for the Google OAuth consent screen (`522bb90`)
- docs: production host is workdirect.vercel.app (`73d037e`)
- Google Tasks MCP server on Vercel + v2 plan (`4dc4c7b`)
- Reset repository for Inbox Triage v2 (`75ab99d`)

## 2025-10-06

- v4.11.0 - Complete PWA Implementation with Service Worker & Push Notifications (`2a14e14`)
- v4.10.0 - Complete Referral & Viral Growth System + PWA Foundation (`b815568`)

## 2025-10-05

- release: v4.10.0 — Referral & Viral Growth System + PWA Foundation (`b2d8e9f`)
- docs: add comprehensive Q1 2025 development options guide (`2e32baa`)
- docs(roadmap): update with v4.9.0 completion and Q1 2025 strategic options (`6445383`)

## 2025-10-04

- feat(analytics): fix multi-game analytics with game-type-aware calculations — v4.9.0 (`629fdea`)
- fix(whackpop): improve emoji centering for Safari (`e87c11c`)
- fix(whackpop): center emojis in hexagons (`fe3178f`)
- fix(whackpop): add map selection UI with predictive search (`88ab8b9`)

## 2025-10-03

- feat(whackpop): add WHACKPOP game type end-to-end — v4.8.0 (`aa2962b`)
- docs: update documentation with Phase 3 security improvements (`6337cd7`)
- docs: add Phase 3 Task 15 rate limiting learning to LEARNINGS.md (`2e5ccdd`)
- feat: implement comprehensive rate limiting across all API endpoints (`7ada640`)

## 2025-10-02

- docs: add Phase 3 Task 14 validation learning to LEARNINGS.md (`74d1927`)
- feat: add validation to admin and settings endpoints (`2eccc6c`)
- feat: add input validation to game play and games endpoints (`1e022d7`)
- feat: Apply Zod validation to admin login and participants endpoints [v4.7.1] (`532193b`)
- feat: Add Zod validation schemas and middleware with XSS sanitization [v4.7.1] (`88275d1`)
- docs: Update LEARNINGS.md with v4.7.1 worker thread fix (`64cf86e`)
- fix: Remove pino-pretty transport to avoid worker thread issues in Next.js dev mode [v4.7.1] (`963d0a5`)
- docs: Update LEARNINGS.md with Phase 3 Task 13 completion status [v4.7.0] (`a384eb7`)
- refactor: Replace console statements in components, hooks, and play pages batch 8 - TASK 13 COMPLETE [v4.7.0] (`318a3d3`)
- refactor: Replace console statements in analytics API and admin pages batch 7 [v4.7.0] (`936b545`)
- refactor: Replace console statements in admin games routes batch 6 [v4.7.0] (`c8ca42e`)
- refactor: Replace console statements in games routes batch 5 - MAJOR MILESTONE (`aeb8686`)
- refactor: Replace console statements in squaremaps and games routes batch 4 (`255b92f`)
- refactor: Replace console statements in admin API routes batch 3 (`ee101a5`)
- refactor: Replace console statements in API routes batch 2 (`7c99f43`)
- refactor: Replace console statements with logger in critical infrastructure (`64ec15c`)
- feat: Phase 3 Task 13 - Add structured logging with Pino [v4.7.0] (`faa20a7`)
- release: v4.7.0 — Phase 0-2 complete: governance, stabilization, security hardening [2025-10-02T11:59:58.000Z] (`057727a`)
- feat: Phase 2 complete - security and stability hardening [v4.6.17] (`7c3536f`)
- chore: Phase 0-1 complete - governance baseline and critical stabilization [v4.6.17] (`259ded4`)

## 2025-09-23

- release: v4.6.0 — Minor — version bump and docs sync [2025-09-23T12:19:54.000Z] (`6eb7b42`)
- chore: remove legacy folders and fix imports; server-side /admin redirect; cleanup settings imports [2025-09-23T12:09:47Z] (`5b5acbf`)
- release: v4.5.0 — QUIZZZ-only; purge legacy; stub unused; update docs [2025-09-23T08:44:43.000Z] (`726ff59`)

## 2025-09-22

- style(admin): enforce black text across GameEditor (all text and placeholders) (`f9e1dec`)
- chore(release): enforce single-type QUIZZZ editor, restore type dropdown, analytics attempt-level, DB indexes, docs — v4.4.0 (`fdeb80a`)

## 2025-09-20

- release: v4.2.0 — Minor release (`e28765d`)
- chore: bump version to 4.1.0 and sync docs (ISO 8601 UTC) (`98ff951`)
- release: v4.0.0 — enforce DB-driven font colors; remove baked-in overrides; persist hero/main colors and FG fields; fix TEXT_26/27; docs synced [ISO 8601 UTC] (`905b80b`)

## 2025-09-17

- feat(typography-runtime): honor styles.textTypes using TypedText on Welcome/Rules/Result pages (`62dff7a`)
- chore(editor): move 'Use SCOREBOARD' checkbox to scoreboard group next to 'Show Labels' (`48bdc9d`)
- feat(editor): per-text type dropdown (H1/H2/P) in PlatformSettings; persist in styles.textTypes (`1a706c6`)
- feat(typography): group font controls in editor; apply Hero Title Class to HERO (scoreboard/plain); wire through pages (`4eac223`)
- feat(fonts): allow Google Fonts per block — hero/main font URL+style; load dynamic CSS and apply family/weight (`1f10a98`)
- feat(hero): logo visible on all pages, optional SCOREBOARD toggle, half-height hero; docs + version bump to v2.1.0 (2025-09-17T11:56:16.000Z) (`d01b5ef`)

## 2025-09-16

- docs: major update v2.0.0 — unified map creator, QUIZZ selectedMaps, card cover images; remove diamond; update README/ROADMAP/TASKLIST/ARCHITECTURE/LEARNINGS/WARP; bump version (`44f0a71`)
- QUIZZ: unified map selector with selectedMaps; remove diamond; predictive search + chips with reordering; card cover images with SVG clip; hide edges/labels when cover present; persist cardCoverImages; fix admin preview to next/image; add unified Map Creator; remove old creators (`cf54576`)

## 2025-09-15

- fix(quizz): prevent Round from exceeding total; finish exactly at last round; clear flip cue on answer (`1b3305f`)
- feat(quizz): finish on target or last round; admin-configurable overlay background; improved map sizing and flip cue (`e86c3f7`)
- fix(quizz): ensure hex map renders by default; fit hex size to stage; correct Quizz form state emission and QuizzHexa geometry import; build clean (`e4c9daf`)
- fix(quizz): include QUIZZ in Game model enum; add hexmaps/random endpoint; fix StarsHexa hexGridStyles typing; bump version/docs to v1.28.0 (`52e7011`)
- feat(quizz): release QUIZZ hexamap quiz type; add public /api/maps/[name]; docs sync and version bump to v1.27.0 (`da7e83f`)
- feat(hexa): add Hexa Map Creator (/admin/hexacreator), hexmaps API/model, shared hex geometry; fix StarsHexa onRoundUpdate; remove duplicate Mongoose index; v1.26.0 (`04ac007`)
- feat(hexa): show current round : total rounds in hero scoreboard\n\n- StarsHexa exposes onRoundUpdate(current,total)\n- GameClient wires round values to GameLayout.scoreboard for STARS_HEXA\n- Uses platform scoreboard colors when available (`718c646`)
- feat(ui/ux): single pinned footer, safe bottom padding; taller centered buttons; welcome Next aligned with Facebook \n\n- Keep only one legal footer pinned to bottom across play pages\n- Add bottom padding so footer never overlaps content\n- Increase button min-height to 48px and center text vertically\n- Place Next With Login Button next to Continue with Facebook, aligned vertically\n- Remove extra margins between HERO and MAIN; remove bottom gap under MAIN\n\nRelease: v1.25.0 (2025-09-15T12:45:05.000Z)\nDocs: README, WARP.md, RELEASE_NOTES, TASKLIST, ROADMAP, LEARNINGS, Planning log (`831190a`)
- style(ui): unify button sizing across play pages (40px height, width 240-400px) (`9554605`)
- style(welcome): scale fb-login-button to visually match primary login button (size=large + scale) (`5800c7f`)
- feat(auth/ui): use official FB plugin (fb-login-button) per snippet; fix footer links to stick to bottom of screen; ensure Main Background (CSS) applies (`773b7c4`)
- fix(ui): apply Main Background (CSS) to main block; pin footer links to bottom across pages; revert FB login to SDK-only path (`71629d6`)
- fix(auth): make Continue with Facebook reliable (SDK -> client verify, fallback to OAuth redirect), add status hints; docs: v1.24.0 (`5dc1348`)
- chore(release): UI/UX fixes (Hexa rename, editor save stay, hero background CSS, FB button alignment, INVITE_REFERRAL share) — v1.23.0 (`858d455`)

## 2025-09-14

- fix(wheel): cancel currentRotation when computing target delta so visual aligns with selected segment (2025-09-14T19:36:33.000Z) (`e856814`)
- fix(wheel): align visual landing with chosen segment by correcting target angle math for -90deg SVG pre-rotation (2025-09-14T19:19:22.000Z) (`5391e8a`)
- feat(wheel): wire onSpin for Wheel of Fortune with server call and trial fallback; enable spin button (2025-09-14T18:47:27.000Z) (`04c3da9`)
- chore(db): set explicit DB_NAME=playmass and resolve dbName in Mongoose connection (avoid defaulting to 'test') (2025-09-14T18:01:06.000Z) (`6f7cd19`)
- chore(release): v1.22.0 — fix admin login route; drop bad shareLinks.id unique index; ensure sparse shortCode index; docs sync (2025-09-14T16:12:23.000Z) (`323e927`)
- fix(admin): return specific validation reason in error field for create game API (`f1dd705`)
- feat(admin): seed defaults for game creation to avoid 500s (Stars Hexa, Find Red, Wheel, Penalty); normalize config using registry; add creation correlation id (`f31d9e2`)
- fix(analytics): add proper /api/analytics route; remove duplicate file; harden admin game creation defaults for FIND_RED, WHEEL_OF_FORTUNE, STARS_HEXA, PENALTY_SHOOTOUT (`06e5e9a`)
- chore(release): v1.21.0 — Get Shorty (Find Red) + Wheel registry/resolver + standardized 5-page flow (2025-09-14T08:07:28.000Z) (`89ce8a7`)

## 2025-09-13

- fix: resolve merge conflict markers in package.json and docs; set version 1.20.0 and sync timestamps (ISO 8601 UTC with ms) (`e28984b`)
- feat(admin): rename Platform Settings→Hero Settings; move Scoreboard under Hero; add inline Cancel/Update bars between sections\n\nchore: version bump to v1.19.0 and sync docs (ISO 8601 UTC with ms) (`ef74683`)
- ui(result): remove Participated (TEXT_41) and CTA_DESCRIPTION; admin: remove TEXT_41 and CTA_DESCRIPTION fields; add inline Cancel/Update buttons between editor sections (`7ab9620`)
- ui(game): show only game content in main block; fill full area; disable scroll within main block (`a792f5e`)
- ui(result): grid layout for CTA buttons; separate grid for Invite + Play Again to align in a row when wide enough (`cf15467`)
- fix(rules): close div properly to resolve build error (`c936714`)
- ui(play): ensure content is never narrower than 80vw across welcome/rules/result and game layout; widen registration container accordingly (`5cb40b9`)
- ui(play): standardize content width to match game page (max-w-6xl) for welcome, rules, and result; widen registration container (`f840ed3`)
- ui(welcome): two-column Q/A layout — H2 question on left (right-aligned), input on right with same width (Name, Email, Phone) (`2652ce5`)
- ui(buttons): increase primary and CTA button sizes by ~50% across landing/welcome/rules/result and registration (`3cae359`)
- ui(play): enforce no-scroll on welcome, rules, game, and result pages; fix containers to viewport (`0647bea`)
- ui(landing): remove paddings on Hero/Main; enforce no-scroll via fixed viewport and document overflow lock (`5357709`)
- ui(landing): no-scroll full-screen; remove margins around Hero/Main; bump 1.18.1 and sync docs (`d977242`)
- docs: whitespace in README; chore: version bump to 1.18.0; sync docs and release notes (`37bf3b2`)
- docs: sync to v1.17.0 and ISO 8601 ms timestamps (`52050df`)
- build: fix Next.js compile by adding app/globals.css; chore: bump to v1.17.0 and sync docs (ISO 8601 ms) (`fcc333b`)
- fix(landing): resolver exposes LANDING_TITLE, LANDING_IMAGE_URL, NEXT_WELCOME_* so landing page renders saved config (`d136a4b`)
- fix(admin): restore /admin/games route with page.tsx (`af8f929`)
- chore: v1.16.0 — Landing config persistence and UI overhaul\n\n- Schema: configuration.platform.texts adds LANDING_TITLE, LANDING_IMAGE_URL, NEXT_WELCOME_TEXT/_ACTION/_BG\n- Admin: Landing Title in Hero Settings; Next Welcome Button block (text/action/bg)\n- UI: Landing image cover, centered CTA, legal links pinned; NEXT_WELCOME_ACTION respected\n- Build: import fixes to align with existing files\n- Docs: version bump + ISO 8601 with ms timestamps (`b12e246`)

## 2025-09-12

- fix(build): remove duplicate middleware implementation; keep single /play enforcement logic (`41ac949`)
- fix(routing): add middleware to enforce /play/:id -> /play/:id/landing and scrub ref=landing from /welcome (`21d8022`)
- chore(routing): disable legacy dynamic referral route /play/[gameId]/[ref] by returning 404; keep only explicit steps (`9a08d10`)
- fix(routing): force /play/[id]/welcome?ref=landing to /play/[id]/landing; keep ref strictly for referrals (`8d39448`)
- fix(routing): do not propagate reserved keywords like 'landing' via ?ref when redirecting to landing (`fe43ca0`)
- fix(routing): disambiguate /play/[gameId]/[ref] so 'landing' (and other step names) route to step instead of referral (`4fadfc7`)
- feat(admin): add Landing fields (LANDING_TITLE, LANDING_IMAGE_URL) to PlatformSettingsForm; landing fallbacks to empty (`6c8afec`)
- feat(play): add Landing step (/play/[gameId]/landing) with title/image/CTA; entry redirects to landing; result CTAs: Play Again → welcome, Invite Friend → landing (`05ac06d`)
- feat(ui): logout redirects to specific game's welcome (preserves ?ref) and clears local playmass session (`e0a5c3b`)
- feat(ui): show Logout only when user session exists (checks /api/auth/session) (`b976889`)
- feat(ui): add Logout link in footer next to Terms/Privacy/Data Deletion; clears user-session via /api/auth/logout (`be7f725`)
- feat(admin): add Login column to participants; persist loginProvider (facebook/email) and expose via API (`becdd47`)
- fix(build): move FB SDK Scripts into client component to satisfy prerender constraints (`598e5a0`)
- feat(auth): integrate official fb-login-button (en_GB, XFBML); subscribe auth.statusChange; clearer SDK guards (`292847b`)
- feat(auth): 24h cross-game user session (POC) via /api/auth/session; auto-continue on welcome; unify cookie expiry (`49f8ff8`)
- feat(auth): Facebook JS SDK login with server verification; docs + env updates, v1.15.0 (`319e4fe`)
- chore(admin): stack Additional CTAs as 3-line blocks and bump to v1.14.0 (docs synced) (`d02b102`)

## 2025-09-11

- feat(admin): standardized 3-line CTA blocks with ACTIONs in editor; add CTA1_TEXT/CTA1_URL and NEXT_*/INVITE/PLAYAGAIN schema/types; legacy mirroring; docs+version v1.13.0 (`f89e7ce`)
- chore(release): bump to v1.12.0 — move Facebook login from home to game Welcome; allow choice of Facebook or email (`1fa4f4c`)
- fix(legal): ensure per-game Terms/Privacy/Deletion pages render defaults if API/game fetch fails (`a59e559`)
- docs(release): bump to v1.11.0 — add Facebook Login; update timestamps (`a939cbd`)
- feat(fb): add public Data Deletion pages (global + per-game), admin fields, footer links; release v1.10.0 (`00ef207`)
- feat(site): add top-level Terms & Privacy pages with hero/main; footer links on home; center gameplay container horizontally; release v1.10.0 (`ba14418`)
- feat(docs): add public Terms & Privacy pages; footer links on all play steps; editor fields for TERMS/PRIVACY; center game on game page; release v1.9.0 (`653280a`)
- chore(release): bump to v1.8.0 — per-CTA backgrounds on result page and center-aligned content across play pages (`e685e1d`)
- chore(release): bump to v1.7.0 — admin editor finetuning (welcome/result layout, markdown + paired inputs), new fields (WON_TEXT/LOST_TEXT/CTA1_BG), multiline color CSS, full-width main block, centered welcome description, result headline & CTA background (`750aea3`)
- chore(release): bump to v1.6.0 — platform result CTA UX, admin new-game unification, CTA field fixes (`86ac3a0`)
- feat(result): reorganize result settings with CTA_TITLE/DESCRIPTION and dynamic CTA buttons; center and stack result buttons; back-compat with TEXT_44[_URL] (`ddf84f9`)
- fix(platform): persist TEXT_26, TEXT_27, TEXT_44_URL in Game schema so CTA URL and helper texts load on result page (`84aabc8`)
- chore(platform): welcome H2 + helper texts, result CTA Action URL, full latin-ext fonts, scoreboard diacritics, remove legacy selector — v1.5.0 (`82d7172`)

## 2025-09-10

- fix(admin): avoid ConflictingUpdateOperators by removing ; delete legacy configuration.general before setting configuration [2025-09-10T13:54:32.000Z] (`918bbc3`)
- fix(admin): map simplified rewards to full Reward schema on create/update; ensure configuration + createdBy + game linkage [2025-09-10T13:48:07.000Z] (`a4159f5`)
- fix(admin): prevent input focus loss by hoisting TextInput to module scope (PlatformSettingsForm); stable component type to avoid remounts [2025-09-10T13:13:34.000Z] (`9df2b8c`)
- Add comprehensive penalty game customization system (`99fab7e`)

## 2025-09-04

- Add comprehensive penalty game customization system (`682dd14`)
- Fix admin game editing API configuration handling (`5411afc`)
- Fix penalty game infinite re-initialization and game logic (`1896227`)
- 🎮 MAJOR: Transform all game pages to full-screen app-like experience (`b631515`)
- CRITICAL FIX: Game completion logic for penalty shootout (`7e0b598`)
- Remove description section from game page (`4270f0e`)
- Implement 4-page game flow with rules page (`207000b`)
- Fix input field visibility - white background black text everywhere (`5bf0664`)
- Implement exact split-flap scoreboard with DOM manipulation (`5b0b8cf`)
- Implement train-station split-flap scoreboard and square game containers (`db84183`)

## 2025-09-03

- Fix referral system and input field visibility (`2b4685e`)
- feat: Update PenaltyHexa game with jersey numbers and improved UX (`b751347`)

## 2025-08-31

- Remove legacy advanced wheel configuration and simplify to triple wheel only (`adabbc8`)

## 2025-08-30

- 🎯 MAJOR: Complete Wheel of Fortune Spinning Fixes & Game Type Rename (`97bc975`)

## 2025-08-29

- v1.6.0: Wheel of Fortune Game Type Integration (`1f59d39`)
- v1.5.0: Flash Gaming Performance Optimization (`4b976dc`)
- Complete admin UI improvements and navigation cleanup (`6417410`)
- v1.4.0 - Complete admin UI overhaul with analytics dashboard and uniform input styling (`1c1dfbe`)
- v1.3.0 - Fix share functionality: clean copy links and dynamic meta tags (`56fb594`)
- v1.2.0 - Complete admin system implementation with analytics, settings, and enhanced game management (`88a6f7f`)
- feat: Add game result page with sharing functionality and user-friendly error messages (`391e5bf`)

## 2025-08-28

- Fix Date type error in formatDate function (`0a53cf9`)
- Fix ObjectId rendering errors - convert to strings for display (`f686576`)
- Fix GameStatus type error - use PAUSED instead of INACTIVE (`ba0b4ed`)
- Fix TypeScript errors: Convert ObjectId to string for comparisons (`cff560f`)
- Complete games management system and fix wheel wins (`40091bb`)
- Fix attempts remaining calculation and wheel text positioning (`7ed0b58`)
- Remove IP-based rate limiting for hostess/event use cases (`2db4601`)
- Fix: Play Game button in admin opens game in new tab (`f1f62e1`)
- 🎮 Complete PlayMass interactive game platform implementation (`04cda8a`)

## 2025-08-27

- Initial commit from Create Next App (`ac8e273`)
