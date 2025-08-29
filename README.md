# PlayMass - Interactive Game Platform

A Next.js-based platform for creating and distributing interactive games like Stars Hexa with comprehensive rewards management.

## 🎮 Features

- **Stars Hexa Games**: Interactive hexagonal star-finding games with customizable text and hidden stars
- **Rewards Management**: Complete reward system with points, coupons, physical prizes, and custom rewards
- **Participant Management**: Track players across multiple games and sessions
- **Target Groups**: Organize participants into groups for targeted campaigns
- **Analytics & Tracking**: Monitor game performance, participant engagement, and reward distribution
- **MongoDB Integration**: Robust data persistence with Mongoose ODM

## 🛠️ Tech Stack

- **Framework**: Next.js 15.5.2 (App Router)
- **Database**: MongoDB Atlas with Mongoose ODM
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Validation**: Built-in Mongoose validation
- **Linting**: ESLint with TypeScript support

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
- `GET /api/health` - System health check

## 🎲 Game Types

### Stars Hexa
- 7 hexagonal cards in 2-3-2 formation layout
- Customizable text for each hexagon
- Hidden stars (1-3 per game) for discovery gameplay
- Visual themes (default, colorful, minimal)
- Limited attempts and flip mechanics

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

- **Real-time Game Play**: Interactive hexagonal star-finding with smooth flip animations
- **Anti-cheat Protection**: Session tracking, IP monitoring, and validation
- **Scalable Architecture**: Designed for high-volume game participation
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Type Safety**: Full TypeScript implementation with strict typing
- **Error Handling**: Comprehensive error handling and user feedback

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

## 📝 License

This project is private and proprietary.

## 👥 Contributing

This is a private project. Contact the maintainer for collaboration opportunities.
