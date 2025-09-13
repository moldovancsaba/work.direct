# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Purpose

This document serves as the operational guide for WARP AI instances working within the **PlayMass** repository - an interactive game platform for creating and distributing simple games like Lucky Wheel to target groups with rewards management.

PlayMass is built with Next.js 15.5.2, TypeScript 5, MongoDB 6.18.0, and follows strict versioning and documentation protocols as part of an MVP Factory development approach.

## Quick Start Commands

### Development Workflow
```bash
# Start development server (requires version increment first)
npm run dev

# Build for production
npm run build

# Start production server locally
npm run start

# Lint code
npm run lint

# Deploy to production
vercel --prod
```

### Health Check
```bash
# Check system status
curl http://localhost:3000/api/health
```

## Codebase Architecture

### Core Structure
```
playmass/
├── app/                    # Next.js App Router (primary application)
│   ├── api/               # API routes (health, games, participants)
│   ├── components/        # React components (SystemStatus, etc.)
│   ├── lib/              # Utilities (MongoDB connection, models)
│   ├── types/            # TypeScript definitions (comprehensive type system)
│   ├── layout.tsx        # Root layout with metadata
│   └── page.tsx          # Landing page
├── public/               # Static assets
├── TASKLIST.md          # Active development tasks
├── README.md            # Project overview and documentation index
└── package.json         # Dependencies and scripts
```

### Key Components

**Database Layer**: 
- MongoDB with Mongoose ODM
- Singleton connection pattern in `app/lib/mongodb.ts`
- Comprehensive models in `app/lib/models/` (Game schema with validation)
- Health monitoring with `checkDBConnection()` utility

**API Layer**:
- Next.js App Router API routes
- Standardized `ApiResponse<T>` type system
- Health check endpoint with comprehensive system monitoring

**Type System**:
- Comprehensive TypeScript definitions in `app/types/index.ts`
- Game types (LUCKY_WHEEL, SCRATCH_CARD, QUIZ, POLL)
- Reward system types (POINTS, COUPON, PHYSICAL_PRIZE, etc.)
- Complete validation and error handling types

## Critical Operational Protocols

### 🔢 Versioning Protocol (MANDATORY)
**Format**: `MAJOR.MINOR.PATCH` (e.g., 1.0.0)

**Before `npm run dev`**:
- Increment PATCH version (+1): `1.0.0` → `1.0.1`

**Before committing to GitHub**:
- Increment MINOR version (+1), reset PATCH to 0: `1.0.1` → `1.1.0`
- Update ALL documentation files with new version

**Major releases** (only when explicitly instructed):
- Increment MAJOR version (+1), reset others to 0: `1.1.0` → `2.0.0`

### 📋 Definition of Done (MANDATORY)
A task is complete ONLY when ALL conditions are met:
1. **Manual verification** in development environment
2. **Version increment** according to change type
3. **Documentation fully updated** (all relevant .md files)
4. **Code committed and pushed** to main branch
5. **Successful deployment** with `vercel --prod`

### 📚 Documentation Requirements
Update these files for ANY significant change:
- `README.md` - High-level overview and version info
- `TASKLIST.md` - Task status and completion details
- `ARCHITECTURE.md` - System architecture changes
- `LEARNINGS.md` - Insights and implementation decisions
- `ROADMAP.md` - Future development impacts
- `RELEASE_NOTES.md` - Version history and changes

## Technical Implementation Standards

### 💬 Code Comments (MANDATORY)
ALL code must include comments explaining:
1. **What** the code does (functional explanation)
2. **Why** this approach was chosen (strategic justification)

Example from `app/lib/mongodb.ts`:
```typescript
// Global variable for MongoDB client connection
// This implements the singleton pattern to prevent multiple connections in serverless environments
let client: MongoClient
```

### 🔍 Reuse Before Creation Rule (MANDATORY)
Before creating ANY new component, function, or utility:
1. **Search existing codebase** for reusable elements
2. **Evaluate fitness** for reuse or extension
3. **Document why** no reusable option was found (if creating new)

### 🗄️ Database Conventions
- **MongoDB** with Mongoose ODM for schema validation
- **ALL storable values must be persisted** (even if conditionally relevant)
- Connection singleton pattern in `app/lib/mongodb.ts`
- Comprehensive validation in model schemas
- Health monitoring and graceful error handling

### 🛡️ Error Handling
- Use `ApiResponse<T>` type for all API responses
- Include proper HTTP status codes
- Comprehensive error details in development mode only
- Connection pooling and timeout management for database

## WARP-Specific Guidelines

### ⏱️ Timestamp Format (MANDATORY)
**ALL timestamps must use**: `YYYY-MM-DDTHH:MM:SS.sssZ`
**Example**: `2025-08-27T15:50:46.789Z`

### 🧪 Testing Policy
**Tests are PROHIBITED** in this MVP Factory environment. Manual verification only.

### 🧭 Navigation Policy
**Breadcrumbs are PROHIBITED**. Use clear, direct top-level navigation only.

### 📂 File Navigation Reference
| Path | Purpose |
|------|---------|
| `app/api/health/` | System health monitoring endpoint |
| `app/lib/mongodb.ts` | Database connection management |
| `app/lib/models/` | Mongoose schemas and models |
| `app/types/index.ts` | Complete TypeScript definitions |
| `app/components/` | React components |
| `TASKLIST.md` | Current development priorities |
| `README.md` | Documentation index and overview |

## Technology Stack Reference

### Core Dependencies
- **Next.js**: 15.5.2 (App Router)
- **React**: 18 (UI framework)
- **TypeScript**: 5 (type safety)
- **MongoDB**: 6.18.0 (database)
- **Mongoose**: 8.18.0 (ODM)
- **Tailwind CSS**: 3.4.1 (styling with custom animations)
- **Framer Motion**: 10.18.0 (animations)

### Build Tools
- **ESLint**: Code linting with Next.js config
- **PostCSS**: CSS processing with Autoprefixer
- **Vercel**: Deployment platform

## Environment Configuration

### Required Environment Variables
```env
MONGODB_URI=mongodb://localhost:27017/playmass
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=PlayMass
ADMIN_PASSWORD=playmass
NEXT_PUBLIC_FACEBOOK_APP_ID=804700345578279
FACEBOOK_APP_ID=804700345578279
FACEBOOK_APP_SECRET=<set-in-vercel-or-.env.local>
```

## Game Engine Architecture

### Lucky Wheel Implementation
- **Segments**: Configurable with probability weighting (must total 100%)
- **Animation**: CSS-based with custom Tailwind keyframes
- **Validation**: Anti-cheat mechanisms and attempt limits
- **Results**: Comprehensive outcome tracking with rewards integration

### Reward System
- **Types**: Points, Coupons, Physical Prizes, Discounts, Custom
- **Status Tracking**: Available, Claimed, Expired, Used
- **Validation**: Unique codes and expiration handling

## Pre-Deployment Checklist

Before running `vercel --prod`:
- [ ] Version incremented according to protocol
- [ ] All documentation files updated
- [ ] Manual testing completed successfully
- [ ] Database connection verified
- [ ] Environment variables configured
- [ ] Build passes without errors: `npm run build`
- [ ] Development server runs without errors: `npm run dev`

## Common Development Patterns

### API Route Structure
```typescript
import { NextRequest, NextResponse } from 'next/server'
import { ApiResponse } from '../../types'

export async function GET(request: NextRequest): Promise<NextResponse<ApiResponse>> {
  // Implementation with proper error handling and response typing
}
```

### Database Model Pattern
```typescript
import mongoose, { Schema } from 'mongoose'

const schema = new Schema({
  // Schema definition with validation
}, {
  timestamps: true,
  collection: 'collection_name'
})

// Add indexes and methods
// Export with model reuse pattern
```

## Documentation Links

- [📚 README.md](./README.md) - Project overview and quick start
- [📋 TASKLIST.md](./TASKLIST.md) - Current development tasks
- [🗺️ ROADMAP.md](./ROADMAP.md) - Future development plans
- [💡 LEARNINGS.md](./LEARNINGS.md) - Implementation insights
- [📝 RELEASE_NOTES.md](./RELEASE_NOTES.md) - Version history

---

<<<<<<< HEAD
**Current Version**: 1.18.1  
**Last Updated**: 2025-09-13T16:27:18.176Z
=======
**Current Version**: 1.17.0  
**Last Updated**: 2025-09-13T11:38:30.000Z
>>>>>>> c1f583a (feat(admin): rename Platform Settings→Hero Settings; move Scoreboard under Hero; add inline Cancel/Update bars between sections\n\nchore: version bump to v1.19.0 and sync docs (ISO 8601 UTC with ms))
**Maintainer**: AI Development Team

## Important Notes for WARP Instances

1. **Always increment version** before running dev or committing
2. **Update ALL relevant documentation** for any change
3. **Search existing code** before creating new components
4. **Comment code** with both what and why explanations
5. **Follow Definition of Done** completely for task completion
6. **Use ISO 8601 timestamps** with milliseconds in UTC
7. **No tests allowed** - manual verification only
8. **No breadcrumbs** in UI design
9. **Persist all data** to MongoDB for future traceability
