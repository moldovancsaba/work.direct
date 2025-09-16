# ROADMAP.md — PlayMass

Last Updated: 2025-09-16T19:41:30.000Z
- Forward-looking plan for PlayMass after QUIZZ release.
- Priorities and dependencies are explicitly stated to enable safe parallelization.

Q3 2025 — Post-Release Stabilization and Hardening

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
