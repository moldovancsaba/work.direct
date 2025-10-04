# PlayMass - Interactive Game Platform

Current Version: 4.8.3
Last Updated: 2025-10-04T10:45:03.333Z

## 🎮 Features

- **Board Quiz (QUIZZZ)**: Standardized board-based quiz game with DB-driven configuration (maps, questions, styles, legal, CTAs)
- **WHACKPOP**: Grid-based Whack-a-Mole game on map cells with progressive difficulty, combo scoring system, and customizable theming
- **Rewards Management**: Complete reward system with points, coupons, physical prizes, and custom rewards
- **Participant Management**: Track players across sessions
- **Analytics & Tracking**: Attempt-level session analytics with validated results
- **MongoDB Integration**: Robust data persistence with Mongoose ODM
- **Security Hardening** (Phase 3 ✅):
  - **Structured Logging**: Pino-based logging with PII sanitization and production-ready JSON output
  - **Input Validation**: Zod schemas with XSS protection on all user input
  - **Rate Limiting**: Comprehensive DDoS protection across all API endpoints
  - **Anti-Cheat**: Multi-layer validation on game play submissions

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.2 (App Router)
- **Database**: MongoDB Atlas with Mongoose ODM
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 3.4.1
- **Animation**: Framer Motion 10.18.0
- **Validation**: Zod 4.1.11 (schema-based validation with XSS protection)
- **Logging**: Pino (structured logging with PII sanitization)
- **Rate Limiting**: rate-limiter-flexible 8.0.1 (DDoS protection)
- **Linting**: ESLint with TypeScript support

## 🔐 Admin Login (MVP)

PlayMass includes a minimal admin login flow (mirroring MessMass) for MVP:
- POST /api/admin/login — Provide body { password } to authenticate
- GET /api/admin/auth — Returns { success, user } if cookie is valid; 401 otherwise
- DELETE /api/admin/login — Logs out by clearing the cookie

Cookie details:
- Name: `admin-session`
- Value: base64-encoded JSON `{ token, expiresAt, userId: 'admin', role: 'super-admin' }`
- Flags: `httpOnly`, `sameSite=lax`, `secure` (in production)
- Expiry: 7 days

Environment:
- Set `ADMIN_PASSWORD` in `.env.local` (example: `ADMIN_PASSWORD=playmass`)

Security note:
- This is intentionally simple and unsigned for MVP. See ROADMAP for future upgrade to signed tokens/JWT.
- **Rate Limiting**: Login endpoint is protected with 5 attempts/minute limit (brute force protection) ✅
- **Input Validation**: Password field validated and XSS-sanitized via Zod schemas ✅
- **Structured Logging**: All login attempts logged with structured data for security monitoring ✅

## 🔵 Facebook Login (SDK)

PlayMass uses the Facebook JavaScript SDK popup for user login. The flow is:
- The SDK is loaded globally in `app/layout.tsx` via `next/script` and initialized with your App ID
- The welcome page calls `FB.login({ scope: 'public_profile,email' })`
- On success, the browser POSTs the short-lived `accessToken` to `/api/auth/facebook/client`
- The server verifies the token with `debug_token`, fetches `me?fields=id,name,email`, and sets an httpOnly `user-session` cookie
- No access tokens are stored — only minimal session info is kept in a cookie

Required environment variables:
- `NEXT_PUBLIC_FACEBOOK_APP_ID=804700345578279` (client)
- `FACEBOOK_APP_ID=804700345578279` (server)
- `FACEBOOK_APP_SECRET=<REPLACE_WITH_REAL_SECRET>` (server)
- `NEXT_PUBLIC_APP_URL=http://localhost:3000` (or your production domain)

Facebook App configuration:
- App Domains: your domain(s) (and `localhost` in development)
- Valid OAuth Redirect URIs: `{NEXT_PUBLIC_APP_URL}/api/auth/facebook/callback` (kept for rollback compatibility)

Code reference:
- SDK load/init: `app/layout.tsx`
- Client login button and handler: `app/play/[gameId]/welcome/WelcomeClientPlatform.tsx`
- Server verification endpoint: `app/api/auth/facebook/client/route.ts`

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB Atlas account (database connection configured)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/moldovancsaba/playmass.git
cd playmass
```

2. Install dependencies:
```bash
npm install
```

3. Environment variables are already configured for MongoDB Atlas connection.

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
app/
├── admin/mapcreator        # Unified Map Creator (HEXA/SQUARE) with predictive search and CRUD
├── admin/                 # Admin interface for game creation
├── api/                   # API routes
│   ├── games/            # Game management endpoints
│   ├── participants/     # Participant management  
│   └── health/           # Health check endpoint
├── components/           # Reusable React components
├── lib/                  # Utility functions and database models
│   ├── models/          # Mongoose schemas
│   └── mongodb.ts       # Database connection
├── play/                # Game play interface
├── types/               # TypeScript type definitions
└── globals.css          # Global styles
```

## 🎯 API Endpoints

- `GET /api/games` - List all games
- `POST /api/games` - Create a new game
- `GET /api/games/[id]` - Get specific game
- `POST /api/games/[id]/play` - Play a game
- `POST /api/participants` - Register participant
- `POST /api/auth/facebook/client` - Verify Facebook SDK access token and create session cookie
- `GET /api/auth/session` - Get current end-user session (POC)
- `POST /api/auth/session` - Create/refresh end-user session for 24h (POC)
- `GET /api/health` - System health check
- `GET /api/maps/[name]` - Get public HexMap by name (coords, radius, hexCount)
- `GET /api/hexmaps/random?tag=` - Get random hex map by tag
- `GET /api/squaremaps/[name]` - Get public SquareMap by name (coords, radius, cellCount)
- `GET /api/squaremaps/random?tag=` - Get random square map by tag

## 🎲 Game Types

Two game types are currently supported:

### QUIZZZ (Board Quiz)
- Board-based quiz game on hexagonal or square grid maps
- Multiple questions with answer validation
- Customizable card styling and backgrounds
- DB-driven configuration for all content and styling

### WHACKPOP (Whack-a-Mole)
- Grid-based fast-paced action game
- Progressive difficulty across multiple rounds
- Combo scoring system with multipliers
- Customizable themes: classic, neon, arcade, pixel
- Hit effects: burst, sparkle, shockwave, confetti
- Configurable spawn rates and target visibility timing

Both types follow the standardized QUIZZZ pattern: DB-driven, one-input-per-line admin editor, usage toggles, centered CTA grid, and legal+typography from DB.

To enable additional game types in the future, add or update entries via the admin API:

```bash
curl -X POST \ 
  -H "Content-Type: application/json" \ 
  http://localhost:3000/api/admin/game-types \ 
  -d '{
    "types": [
      { "code": "NEW_TYPE", "name": "My New Game", "enabled": true, "order": 70 }
    ]
  }'
```

Once enabled, they will appear in the Game Type dropdown in Create Game. Implement their editor/runtime modules following the QUIZZZ editor standard (centralized platform config + minimal type-specific fragment).

## 🔒 Security Features (Phase 3)

### Structured Logging
- **Pino-based**: High-performance JSON logging for production
- **PII Sanitization**: Automatic redaction of emails, phones, tokens, passwords
- **Environment-aware**: Debug level in dev, info in production
- **Log Aggregation Ready**: Compatible with Datadog, CloudWatch, Splunk

### Input Validation & XSS Protection
- **Zod Schemas**: Schema-based validation for all API endpoints
- **XSS Sanitization**: `xss` library removes malicious scripts/HTML
- **Type Safety**: Schema-derived TypeScript types (single source of truth)
- **Validated Endpoints**: Admin login, participants, game play, games listing, settings

### Rate Limiting & DDoS Protection
- **4 Rate Limit Tiers**:
  - Auth: 5 req/min (brute force protection)
  - Admin: 30 req/min (admin operations)
  - Gameplay: 20 req/min (spam prevention)
  - Public: 60 req/min (browsing, health checks)
- **Protected Endpoints**: All critical API routes
- **Standard Responses**: HTTP 429 with Retry-After headers
- **Security Monitoring**: All violations logged with structured data

### Anti-Cheat Protection
- **Multi-layer Validation**: Rate limiting + input validation + session tracking
- **IP Monitoring**: Per-IP rate limits and attempt tracking  
- **Session Management**: Idempotency and duplicate detection
- **Outcome Validation**: Game results validated against schemas

## 🏆 Reward System

- **Points**: Configurable point values with custom currencies
- **Coupons**: Percentage or fixed amount discounts with expiration
- **Physical Prizes**: Real-world items with shipping management
- **Custom Rewards**: Flexible reward types with metadata

## 💾 Database Schema

The system uses MongoDB with the following main collections:
- `games` - Game configurations and settings
- `participants` - Player information and history
- `rewards` - Available rewards and configurations
- `rewardclaims` - Individual reward claims and status
- `gameresults` - Game play results and outcomes
- `targetgroups` - Participant group management

## 🔧 Development

### Build for Production
```bash
npm run build
```

### Start Production Server
```bash
npm start
```

### Linting
```bash
npm run lint
```

## 🌟 Key Features

- **Real-time Game Play**: Interactive board-quiz gameplay with smooth transitions
- **Anti-cheat Protection**: Multi-layer security (rate limiting + validation + session tracking)
- **Scalable Architecture**: Designed for high-volume game participation
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Type Safety**: Full TypeScript implementation with schema-derived types
- **Error Handling**: Comprehensive error handling with structured logging
- **Security Hardened**: Zod validation, XSS protection, rate limiting, structured logging

## 📊 Analytics

The platform provides detailed analytics including:
- Game participation rates
- Reward distribution statistics  
- Player engagement metrics
- Performance monitoring
- Anti-cheat detection

## 🔐 Security

- Input validation and sanitization
- Rate limiting and abuse prevention
- Session management
- Secure reward code generation
- IP-based anti-cheat measures

## 📚 Documentation Links

- ROADMAP.md — Forward-looking milestones and dependencies
- TASKLIST.md — Active tasks and delivery tracking
- RELEASE_NOTES.md — Versioned change log
- LEARNINGS.md — Implementation insights and decisions
- WARP.DEV_AI_CONVERSATION.md — Planning session logs

## 📝 License

This project is private and proprietary.

## 👥 Contributing

This is a private project. Contact the maintainer for collaboration opportunities.

---

**Maintainer**: AI Development Team
