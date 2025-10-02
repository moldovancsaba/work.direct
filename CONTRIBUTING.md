# CONTRIBUTING.md — PlayMass

**Version**: 4.6.17  
**Last Updated**: 2025-10-02T10:52:09.000Z

---

## Welcome Contributors

Thank you for your interest in contributing to **PlayMass**, an interactive game platform built with Next.js 15.5.2, TypeScript 5, and MongoDB. This document outlines the standards, policies, and workflows you must follow to maintain code quality and project integrity.

---

## Table of Contents

1. [Core Principles](#core-principles)
2. [Technology Stack](#technology-stack)
3. [Development Environment](#development-environment)
4. [Code Standards](#code-standards)
5. [Versioning Protocol](#versioning-protocol)
6. [Definition of Done](#definition-of-done)
7. [Documentation Requirements](#documentation-requirements)
8. [Git Workflow](#git-workflow)
9. [Testing Policy](#testing-policy)
10. [Security Guidelines](#security-guidelines)

---

## Core Principles

### 1. Reuse Before Creation

**MANDATORY**: Before creating any new component, function, or utility:

1. **Search the existing codebase** for reusable elements
2. **Evaluate fitness** for reuse or extension
3. **Document why** no reusable option was found (if creating new)

This prevents fragmentation, redundant complexity, and uncontrolled divergence.

### 2. Mandatory Code Comments

**ALL code must include comments explaining**:

1. **What** the code does (functional explanation)
2. **Why** this approach was chosen (strategic justification)

#### Good Example:
```typescript
// Global variable for MongoDB client connection
// This implements the singleton pattern to prevent multiple connections in serverless environments
let client: MongoClient
```

#### Bad Example:
```typescript
// MongoDB client
let client: MongoClient
```

### 3. No Breadcrumbs Policy

**Breadcrumb navigation is explicitly prohibited** across all UI. Use clear, direct top-level navigation only.

### 4. Tests Are Prohibited

**No automated tests are allowed** in this MVP Factory environment. All verification must be done manually.

- ❌ No unit tests
- ❌ No integration tests
- ❌ No E2E tests
- ✅ Manual verification required per Definition of Done

---

## Technology Stack

### Core Dependencies (Fixed Versions)

- **Framework**: Next.js 15.5.2 (App Router)
- **Language**: TypeScript 5
- **Database**: MongoDB 6.18.0+ with Mongoose 8.18.0+
- **Styling**: Tailwind CSS 3.4.1+
- **Animation**: Framer Motion 10.18.0+
- **Runtime**: Node.js >=20.0.0

### Technology Stack Compliance

**Before developing new features**:

1. Review established technology stack specifications
2. Validate against current standards (versions, patterns, conventions)
3. Maintain strict alignment with existing stack
4. Reuse established patterns, tools, and APIs

**If proposing changes or additions**:

1. Document rationale behind deviation
2. Assess impact on existing systems
3. Submit for formal approval **before implementation**

No non-compliant technology or pattern may be introduced without explicit, pre-approved justification.

---

## Development Environment

### Prerequisites

- **Node.js**: 20.0.0+ (use `.nvmrc`: `nvm use`)
- **npm**: 9.0.0+
- **MongoDB**: Atlas account or local instance
- **Git**: Latest stable version

### Setup

```bash
# 1. Clone repository
git clone https://github.com/moldovancsaba/playmass.git
cd playmass

# 2. Use correct Node.js version
nvm use

# 3. Install dependencies
npm install

# 4. Configure environment variables
# Copy .env.local.example to .env.local (if exists)
# Or set required variables:
# - MONGODB_URI
# - NEXT_PUBLIC_APP_URL
# - NEXT_PUBLIC_APP_NAME
# - ADMIN_PASSWORD
# - NEXT_PUBLIC_FACEBOOK_APP_ID
# - FACEBOOK_APP_ID
# - FACEBOOK_APP_SECRET

# 5. Verify build
npm run build

# 6. Start development server
npm run dev
```

---

## Code Standards

### TypeScript

- Use strict typing (no `any` without documented justification)
- Define proper interfaces and types
- Use type inference where appropriate
- Avoid type assertions unless absolutely necessary

### File Structure

```
app/
├── api/              # API routes (Next.js App Router)
├── components/       # React components
│   ├── admin/       # Admin-specific components
│   ├── game/        # Game-specific components
│   ├── games/       # Individual game implementations
│   └── ui/          # Reusable UI components
├── lib/             # Utilities and core logic
│   ├── models/     # Mongoose schemas
│   └── mongodb.ts  # Database connection
├── types/          # TypeScript type definitions
└── modules/        # Game module registry
```

### Naming Conventions

- **Components**: PascalCase (`GameEditor.tsx`)
- **Utilities**: camelCase (`playConfigResolver.ts`)
- **Constants**: UPPER_SNAKE_CASE (`ADMIN_PASSWORD`)
- **Types/Interfaces**: PascalCase (`GameConfiguration`, `ApiResponse<T>`)
- **CSS Classes**: kebab-case (Tailwind utilities)

### Import Organization

```typescript
// 1. External dependencies
import { NextRequest, NextResponse } from 'next/server'
import mongoose from 'mongoose'

// 2. Internal absolute imports
import { ApiResponse } from '@/types'
import { dbConnect } from '@/lib/mongodb'

// 3. Relative imports
import { GameEditor } from './GameEditor'
```

### Error Handling

- Use proper HTTP status codes
- Provide meaningful error messages (dev only: full stack trace)
- Never expose sensitive data in errors
- Log errors appropriately (structured logging preferred)

---

## Versioning Protocol

**Format**: `MAJOR.MINOR.PATCH` (Semantic Versioning)

### Before `npm run dev`

- **Increment PATCH** version (+1): `4.6.17` → `4.6.18`

```bash
# Automated via predev script
npm run dev  # Automatically bumps patch
```

### Before Committing to GitHub

- **Increment MINOR** version (+1), reset PATCH to 0: `4.6.18` → `4.7.0`

```bash
# Use release scripts
npm run release:minor
```

### Major Releases (Explicit Instruction Only)

- **Increment MAJOR** version (+1), reset MINOR and PATCH to 0: `4.7.0` → `5.0.0`

```bash
npm run release:major
```

### Version Synchronization

**ALL version references must be updated**:
- `package.json`
- `README.md`
- `ARCHITECTURE.md`
- `WARP.md`
- `ROADMAP.md`
- `TASKLIST.md`
- `RELEASE_NOTES.md`
- `LEARNINGS.md`

Use automated sync scripts where available.

---

## Definition of Done

A task is **ONLY complete** when **ALL** conditions are met:

### ✅ Completion Checklist

1. **Manual Verification**
   - Changes tested in development environment
   - Expected behavior confirmed under real usage scenarios

2. **Version Increment**
   - Version bumped according to protocol
   - Consistently reflected across all files and systems

3. **Documentation Fully Updated**
   - `ARCHITECTURE.md` — System or component-level changes
   - `TASKLIST.md` — Task status and details
   - `LEARNINGS.md` — Insights, challenges, or decisions encountered
   - `README.md` — High-level understanding and usage context
   - `RELEASE_NOTES.md` — Summary of changes introduced
   - `ROADMAP.md` — Impact on future tasks and milestones

4. **Code Committed and Pushed**
   - Clear, versioned commit message
   - Pushed to main branch (or approved PR merged)

5. **Build Verification**
   - `npm run build` passes successfully
   - `npm run dev` verified and approved
   - No ESLint warnings (`--max-warnings=0`)

**Reminder**: Partial fulfillment does NOT qualify as "done."

---

## Documentation Requirements

### Timestamp Format (MANDATORY)

**ALL timestamps must use ISO 8601 with milliseconds (UTC)**:

```
YYYY-MM-DDTHH:MM:SS.sssZ

Example: 2025-10-02T10:52:09.000Z
```

### Required Documentation Files

Update these files for **ANY significant change**:

| File | Purpose |
|------|---------|
| `README.md` | High-level overview and version info |
| `ARCHITECTURE.md` | System architecture and component details |
| `TASKLIST.md` | Task status and completion tracking |
| `LEARNINGS.md` | Implementation insights and decisions |
| `ROADMAP.md` | Future development plans and milestones |
| `RELEASE_NOTES.md` | Versioned change log |

### Documentation Standards

- **Current Only**: No outdated or deprecated content
- **No Placeholders**: Remove "TBD", "coming soon", "maybe"
- **Structured**: Use proper headings, lists, tables
- **Precise**: Include file locations, exact commands, clear examples
- **Timestamped**: ISO 8601 with milliseconds (UTC)

---

## Git Workflow

### Branch Naming

```
feature/description
fix/description
refactor/description
docs/description
stabilize/YYYY-MM-DDTHH:MM:SS.sssZ
```

### Commit Messages

**Format**:
```
type: brief summary [vX.Y.Z]

Detailed description (optional)

- Bullet points for specific changes
- Reference issues if applicable
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `refactor`: Code restructuring
- `docs`: Documentation only
- `chore`: Maintenance (version bumps, etc.)
- `style`: Formatting, no logic change

**Examples**:
```
feat: add rate limiting to admin login [v4.7.0]

- Implement rate limiter with 5 attempts/min/IP
- Return HTTP 429 on exceeded limits
- Add error handling and logging

chore: stabilize, remove duplicates, align docs [v4.7.0]

- Removed 8 duplicate files with " 2" suffix
- Fixed 49 uncommitted changes
- Synchronized version across all docs
```

### Pull Request Process

1. **Create feature branch** from `main`
2. **Make changes** following all standards
3. **Ensure build passes** locally
4. **Update all documentation**
5. **Commit with proper message**
6. **Open PR** with clear description
7. **Manual QA** per Definition of Done
8. **Merge** only after approval

---

## Testing Policy

### ⛔ Automated Tests Are PROHIBITED

This is an **MVP Factory** environment. **No automated tests** are allowed:

- ❌ No unit tests (Jest, Vitest, etc.)
- ❌ No integration tests
- ❌ No E2E tests (Playwright, Cypress, etc.)
- ❌ No test coverage tools

### ✅ Manual Verification Required

**All changes must be verified manually**:

1. Run `npm run dev` and test in browser
2. Test happy paths and edge cases
3. Verify across different screen sizes (if UI change)
4. Check console for errors
5. Verify database state (if data change)
6. Test with different user roles (if auth change)

---

## Security Guidelines

### Secrets Management

**NEVER commit secrets to repository**:

❌ **PROHIBITED**:
- Hardcoded API keys
- Database connection strings with credentials
- Authentication tokens
- Private keys
- Passwords

✅ **REQUIRED**:
- All secrets in `.env.local` (gitignored)
- Use `process.env.VARIABLE_NAME`
- Central config loader for validation
- Clear error if required env var missing

### Environment Variables

**Required variables** (see `.env.local.example`):
```bash
MONGODB_URI=mongodb+srv://...
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=PlayMass
ADMIN_PASSWORD=secure_password_here
NEXT_PUBLIC_FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_app_secret
```

### Data Persistence

**ALL storable values must be persisted** to MongoDB, even if conditionally relevant:
- Ensures future traceability
- Enables reuse across application components
- Supports analytics and debugging

### Input Validation

- Validate all user input server-side
- Sanitize before storage or echo
- Use proper HTTP status codes (400 for invalid input)
- Never trust client-side validation alone

---

## Additional Guidelines

### Performance

- Avoid blocking operations in request handlers
- Use proper database indexes
- Optimize images and assets
- Lazy load heavy components where appropriate

### Accessibility

- Use semantic HTML
- Include proper ARIA labels (when implemented)
- Ensure keyboard navigation works (when implemented)
- Maintain color contrast ratios

### Database Conventions

- Use Mongoose ODM for schema validation
- Implement singleton connection pattern
- Add indexes for frequently queried fields
- Use timestamps (createdAt, updatedAt)

---

## Need Help?

### Resources

- **Project Documentation**: See README.md for links to all docs
- **Architecture Guide**: ARCHITECTURE.md
- **Task Tracking**: TASKLIST.md
- **Known Issues**: LEARNINGS.md

### Contact

- **Repository**: https://github.com/moldovancsaba/playmass
- **Maintainer**: AI Development Team

---

## Summary Checklist

Before submitting any contribution:

- [ ] Code follows all standards (naming, structure, comments)
- [ ] Reused existing code where possible
- [ ] Added mandatory comments (what and why)
- [ ] No automated tests added
- [ ] Manual verification completed
- [ ] Version incremented per protocol
- [ ] All documentation updated
- [ ] Build passes (`npm run build`)
- [ ] ESLint clean (`--max-warnings=0`)
- [ ] No secrets committed
- [ ] Proper commit message format
- [ ] Definition of Done satisfied

---

**Thank you for contributing to PlayMass!**

By following these guidelines, you help maintain a high-quality, secure, and maintainable codebase.

---

**Document Version**: 1.0.0  
**Last Updated**: 2025-10-02T10:52:09.000Z
