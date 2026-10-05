# Changelog

Generated from git history by `management/scripts/changelog-from-git.mjs`. Do not edit by hand: regenerate it.
Covers history up to commit `ae8b7f2` (2026-10-05).

## 2026-10-05

- Add a licence and a changelog generated from git history (`ae8b7f2`)
- Documentation baseline: handover, agent instructions, env example, README and plan accuracy fixes (`ee29bfa`)

## 2026-09-23

- vercel.json: rewrite the bare root too (`bdecb32`)
- Public home and privacy pages for the Google OAuth consent screen (`98335ea`)
- docs: production host is workdirect.vercel.app (`5b1b67a`)
- Google Tasks MCP server on Vercel + v2 plan (`973e417`)
- Reset repository for Inbox Triage v2 (`2e76b50`)

## 2025-10-06

- v4.11.0 - Complete PWA Implementation with Service Worker & Push Notifications (`bcec3d1`)
- v4.10.0 - Complete Referral & Viral Growth System + PWA Foundation (`b2af905`)

## 2025-10-05

- release: v4.10.0 — Referral & Viral Growth System + PWA Foundation (`92cb8d8`)
- docs: add comprehensive Q1 2025 development options guide (`abbac10`)
- docs(roadmap): update with v4.9.0 completion and Q1 2025 strategic options (`e2af2da`)

## 2025-10-04

- feat(analytics): fix multi-game analytics with game-type-aware calculations — v4.9.0 (`f16941d`)
- fix(whackpop): improve emoji centering for Safari (`6ec1231`)
- fix(whackpop): center emojis in hexagons (`fcb1f7e`)
- fix(whackpop): add map selection UI with predictive search (`b782a6d`)

## 2025-10-03

- feat(whackpop): add WHACKPOP game type end-to-end — v4.8.0 (`6beb3af`)
- docs: update documentation with Phase 3 security improvements (`719c1e6`)
- docs: add Phase 3 Task 15 rate limiting learning to LEARNINGS.md (`efdac43`)
- feat: implement comprehensive rate limiting across all API endpoints (`6218ac8`)

## 2025-10-02

- docs: add Phase 3 Task 14 validation learning to LEARNINGS.md (`f4396ed`)
- feat: add validation to admin and settings endpoints (`4637930`)
- feat: add input validation to game play and games endpoints (`f534b45`)
- feat: Apply Zod validation to admin login and participants endpoints [v4.7.1] (`c87946e`)
- feat: Add Zod validation schemas and middleware with XSS sanitization [v4.7.1] (`f58dbee`)
- docs: Update LEARNINGS.md with v4.7.1 worker thread fix (`fd38d42`)
- fix: Remove pino-pretty transport to avoid worker thread issues in Next.js dev mode [v4.7.1] (`4cf4b90`)
- docs: Update LEARNINGS.md with Phase 3 Task 13 completion status [v4.7.0] (`aeee8ef`)
- refactor: Replace console statements in components, hooks, and play pages batch 8 - TASK 13 COMPLETE [v4.7.0] (`7a9bf29`)
- refactor: Replace console statements in analytics API and admin pages batch 7 [v4.7.0] (`032fdc8`)
- refactor: Replace console statements in admin games routes batch 6 [v4.7.0] (`0db2283`)
- refactor: Replace console statements in games routes batch 5 - MAJOR MILESTONE (`faedc7b`)
- refactor: Replace console statements in squaremaps and games routes batch 4 (`6dc7fe6`)
- refactor: Replace console statements in admin API routes batch 3 (`59a10e4`)
- refactor: Replace console statements in API routes batch 2 (`37d036a`)
- refactor: Replace console statements with logger in critical infrastructure (`7e89e9b`)
- feat: Phase 3 Task 13 - Add structured logging with Pino [v4.7.0] (`20a04ef`)
- release: v4.7.0 — Phase 0-2 complete: governance, stabilization, security hardening [2025-10-02T11:59:58.000Z] (`7cc9753`)
- feat: Phase 2 complete - security and stability hardening [v4.6.17] (`11fecbd`)
- chore: Phase 0-1 complete - governance baseline and critical stabilization [v4.6.17] (`75007a5`)

## 2025-09-23

- release: v4.6.0 — Minor — version bump and docs sync [2025-09-23T12:19:54.000Z] (`36f03e2`)
- chore: remove legacy folders and fix imports; server-side /admin redirect; cleanup settings imports [2025-09-23T12:09:47Z] (`eece8c4`)
- release: v4.5.0 — QUIZZZ-only; purge legacy; stub unused; update docs [2025-09-23T08:44:43.000Z] (`81a7fbb`)

## 2025-09-22

- style(admin): enforce black text across GameEditor (all text and placeholders) (`c0f35b8`)
- chore(release): enforce single-type QUIZZZ editor, restore type dropdown, analytics attempt-level, DB indexes, docs — v4.4.0 (`0fa3ab6`)

## 2025-09-20

- release: v4.2.0 — Minor release (`2e06b1f`)
- chore: bump version to 4.1.0 and sync docs (ISO 8601 UTC) (`6f4fc2c`)
- release: v4.0.0 — enforce DB-driven font colors; remove baked-in overrides; persist hero/main colors and FG fields; fix TEXT_26/27; docs synced [ISO 8601 UTC] (`e6bfaa3`)

## 2025-09-17

- feat(typography-runtime): honor styles.textTypes using TypedText on Welcome/Rules/Result pages (`1f5611c`)
- chore(editor): move 'Use SCOREBOARD' checkbox to scoreboard group next to 'Show Labels' (`3998d46`)
- feat(editor): per-text type dropdown (H1/H2/P) in PlatformSettings; persist in styles.textTypes (`ee34af1`)
- feat(typography): group font controls in editor; apply Hero Title Class to HERO (scoreboard/plain); wire through pages (`47a5b30`)
- feat(fonts): allow Google Fonts per block — hero/main font URL+style; load dynamic CSS and apply family/weight (`e4b020d`)
- feat(hero): logo visible on all pages, optional SCOREBOARD toggle, half-height hero; docs + version bump to v2.1.0 (2025-09-17T11:56:16.000Z) (`e1c9ae8`)

## 2025-09-16

- docs: major update v2.0.0 — unified map creator, QUIZZ selectedMaps, card cover images; remove diamond; update README/ROADMAP/TASKLIST/ARCHITECTURE/LEARNINGS/WARP; bump version (`70cbf68`)
- QUIZZ: unified map selector with selectedMaps; remove diamond; predictive search + chips with reordering; card cover images with SVG clip; hide edges/labels when cover present; persist cardCoverImages; fix admin preview to next/image; add unified Map Creator; remove old creators (`870c160`)

## 2025-09-15

- fix(quizz): prevent Round from exceeding total; finish exactly at last round; clear flip cue on answer (`82099a1`)
- feat(quizz): finish on target or last round; admin-configurable overlay background; improved map sizing and flip cue (`2295cc4`)
- fix(quizz): ensure hex map renders by default; fit hex size to stage; correct Quizz form state emission and QuizzHexa geometry import; build clean (`a88d348`)
- fix(quizz): include QUIZZ in Game model enum; add hexmaps/random endpoint; fix StarsHexa hexGridStyles typing; bump version/docs to v1.28.0 (`ad1a518`)
- feat(quizz): release QUIZZ hexamap quiz type; add public /api/maps/[name]; docs sync and version bump to v1.27.0 (`a6a10ff`)
- feat(hexa): add Hexa Map Creator (/admin/hexacreator), hexmaps API/model, shared hex geometry; fix StarsHexa onRoundUpdate; remove duplicate Mongoose index; v1.26.0 (`e5e6e33`)
- feat(hexa): show current round : total rounds in hero scoreboard\n\n- StarsHexa exposes onRoundUpdate(current,total)\n- GameClient wires round values to GameLayout.scoreboard for STARS_HEXA\n- Uses platform scoreboard colors when available (`fedc68d`)
- feat(ui/ux): single pinned footer, safe bottom padding; taller centered buttons; welcome Next aligned with Facebook \n\n- Keep only one legal footer pinned to bottom across play pages\n- Add bottom padding so footer never overlaps content\n- Increase button min-height to 48px and center text vertically\n- Place Next With Login Button next to Continue with Facebook, aligned vertically\n- Remove extra margins between HERO and MAIN; remove bottom gap under MAIN\n\nRelease: v1.25.0 (2025-09-15T12:45:05.000Z)\nDocs: README, WARP.md, RELEASE_NOTES, TASKLIST, ROADMAP, LEARNINGS, Planning log (`59428ad`)
- style(ui): unify button sizing across play pages (40px height, width 240-400px) (`d2ee098`)
- style(welcome): scale fb-login-button to visually match primary login button (size=large + scale) (`3e022e6`)
- feat(auth/ui): use official FB plugin (fb-login-button) per snippet; fix footer links to stick to bottom of screen; ensure Main Background (CSS) applies (`ea560d3`)
- fix(ui): apply Main Background (CSS) to main block; pin footer links to bottom across pages; revert FB login to SDK-only path (`3028994`)
- fix(auth): make Continue with Facebook reliable (SDK -> client verify, fallback to OAuth redirect), add status hints; docs: v1.24.0 (`ea2db57`)
- chore(release): UI/UX fixes (Hexa rename, editor save stay, hero background CSS, FB button alignment, INVITE_REFERRAL share) — v1.23.0 (`b0c9b1a`)

## 2025-09-14

- fix(wheel): cancel currentRotation when computing target delta so visual aligns with selected segment (2025-09-14T19:36:33.000Z) (`2e51888`)
- fix(wheel): align visual landing with chosen segment by correcting target angle math for -90deg SVG pre-rotation (2025-09-14T19:19:22.000Z) (`a58bddd`)
- feat(wheel): wire onSpin for Wheel of Fortune with server call and trial fallback; enable spin button (2025-09-14T18:47:27.000Z) (`52c2a0d`)
- chore(db): set explicit DB_NAME=playmass and resolve dbName in Mongoose connection (avoid defaulting to 'test') (2025-09-14T18:01:06.000Z) (`435e4b4`)
- chore(release): v1.22.0 — fix admin login route; drop bad shareLinks.id unique index; ensure sparse shortCode index; docs sync (2025-09-14T16:12:23.000Z) (`63e6929`)
- fix(admin): return specific validation reason in error field for create game API (`88a2b1f`)
- feat(admin): seed defaults for game creation to avoid 500s (Stars Hexa, Find Red, Wheel, Penalty); normalize config using registry; add creation correlation id (`f91d8cc`)
- fix(analytics): add proper /api/analytics route; remove duplicate file; harden admin game creation defaults for FIND_RED, WHEEL_OF_FORTUNE, STARS_HEXA, PENALTY_SHOOTOUT (`25052dd`)
- chore(release): v1.21.0 — Get Shorty (Find Red) + Wheel registry/resolver + standardized 5-page flow (2025-09-14T08:07:28.000Z) (`94d7465`)

## 2025-09-13

- fix: resolve merge conflict markers in package.json and docs; set version 1.20.0 and sync timestamps (ISO 8601 UTC with ms) (`6ffaeda`)
- feat(admin): rename Platform Settings→Hero Settings; move Scoreboard under Hero; add inline Cancel/Update bars between sections\n\nchore: version bump to v1.19.0 and sync docs (ISO 8601 UTC with ms) (`6782926`)
- ui(result): remove Participated (TEXT_41) and CTA_DESCRIPTION; admin: remove TEXT_41 and CTA_DESCRIPTION fields; add inline Cancel/Update buttons between editor sections (`39aa354`)
- ui(game): show only game content in main block; fill full area; disable scroll within main block (`143ae5d`)
- ui(result): grid layout for CTA buttons; separate grid for Invite + Play Again to align in a row when wide enough (`8e45ce9`)
- fix(rules): close div properly to resolve build error (`6e1db23`)
- ui(play): ensure content is never narrower than 80vw across welcome/rules/result and game layout; widen registration container accordingly (`916a02c`)
- ui(play): standardize content width to match game page (max-w-6xl) for welcome, rules, and result; widen registration container (`3f00f84`)
- ui(welcome): two-column Q/A layout — H2 question on left (right-aligned), input on right with same width (Name, Email, Phone) (`c00fa9b`)
- ui(buttons): increase primary and CTA button sizes by ~50% across landing/welcome/rules/result and registration (`1fe44c9`)
- ui(play): enforce no-scroll on welcome, rules, game, and result pages; fix containers to viewport (`3cfb4cd`)
- ui(landing): remove paddings on Hero/Main; enforce no-scroll via fixed viewport and document overflow lock (`7242776`)
- ui(landing): no-scroll full-screen; remove margins around Hero/Main; bump 1.18.1 and sync docs (`5424d7b`)
- docs: whitespace in README; chore: version bump to 1.18.0; sync docs and release notes (`7ad804d`)
- docs: sync to v1.17.0 and ISO 8601 ms timestamps (`e8f3173`)
- build: fix Next.js compile by adding app/globals.css; chore: bump to v1.17.0 and sync docs (ISO 8601 ms) (`b193ffc`)
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
