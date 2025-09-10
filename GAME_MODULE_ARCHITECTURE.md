# PlayMass Game Module Architecture
## Building Fully Customizable Game Modules

### Version: 1.2.6
### Last Updated: 2025-01-06T13:35:21.000Z
### Document Type: Technical Architecture Guide

---

## Table of Contents

1. [Overview](#overview)
2. [Penalty Shootout Case Study](#penalty-shootout-case-study)
3. [Core PlayMass System Resources](#core-playmass-system-resources)
4. [Game Module Blueprint](#game-module-blueprint)
5. [Customization Architecture](#customization-architecture)
6. [Integration Patterns](#integration-patterns)
7. [Future Module Development Guide](#future-module-development-guide)
8. [Best Practices](#best-practices)
9. [Implementation Checklist](#implementation-checklist)

---

## Overview

The PlayMass platform is designed as a modular game system where each game type is a fully customizable, self-contained module that integrates seamlessly with core system resources. This document outlines how we achieved complete customizability in the Penalty Shootout module and provides a blueprint for future game development.

### Core Philosophy

- **Zero Hardcoded Text**: Every user-facing text element must be customizable
- **Complete Visual Control**: All colors, layouts, and styling must be configurable
- **Modular Integration**: Games use shared system resources (login, sharing, referrals)
- **Consistent Experience**: All games follow the same user flow and admin interface patterns

---

## Penalty Shootout Case Study

The Penalty Shootout module serves as our reference implementation for a fully customizable game module. Here's how we achieved complete customizability:

### 1. Text Customization System

#### Architecture Overview
```typescript
// Each game has a comprehensive texts configuration
interface PenaltyTexts {
  // Basic Information (2 fields)
  title: string
  description: string
  
  // Registration Flow (10 fields) 
  gameTitle: string
  registrationSubtitle: string
  namePlaceholder: string
  emailPlaceholder: string
  phonePlaceholder: string
  contactRequiredError: string
  startPlayingButton: string
  registeringText: string
  tryWithoutRegText: string
  tryWithoutRegButton: string
  
  // Game Rules & Description (8 fields)
  gameIcon: string
  howToPlayButton: string
  gameRulesTitle: string
  gameRulesText: string
  winConditionsTitle: string
  winConditionsText: string
  gameDescription: string
  playButton: string
  
  // In-Game UI (11 fields)
  penaltyShootoutTitle: string
  youLabel: string
  opponentLabel: string
  suddenDeathText: string
  selectPlayersText: string
  goalText: string
  missText: string
  youWonText: string
  youLostText: string
  homeTeamLabel: string
  visitorTeamLabel: string
  
  // Result Page (9 fields)
  gameResultsTitle: string
  gameSubtitle: string
  playAgainButton: string
  shareWithFriendsButton: string
  shareResultTitle: string
  copyLinkButton: string
  shareButton: string
  congratulationsText: string
  gameOverText: string
  
  // Result Messages (4 fields)
  victoryResultEmoji: string
  defeatResultEmoji: string
  victoryResultMessage: string
  defeatResultMessage: string
  
  // Legacy Fields (10 fields)
  defeatIcon: string
  defeatTitle: string
  trialModeIndicator: string
  visitorWinMessage: string
  drawIcon: string
  drawMessage: string
  visitorPenaltyWinMessage: string
  victoryIcon: string
  victoryTitle: string
  homeWinMessage: string
  
  // Loading & Error Messages (6 fields)
  loadingGameText: string
  gameNotFoundTitle: string
  gameNotFoundMessage: string
  tryAgainButton: string
  gameTypeNotSupportedTitle: string
  gameTypeNotSupportedMessage: string
}

// Total: 60 fully customizable text fields
```

#### Implementation Pattern
```typescript
// Components use customizable text with clean fallbacks
const displayText = customTexts?.fieldName || 'Clean Default Text'

// Example in PenaltyShootout component
<div className="text-lg">
  {customTexts.penaltyShootoutTitle || 'PENALTY SHOOTOUT'}
</div>
```

### 2. Visual Customization System

#### Color Configuration
```typescript
interface PenaltyColors {
  // Background Colors
  pageBackground: string        // Full page gradient
  blockBackground: string       // Game content blocks
  
  // Interactive Elements
  primaryButton: string         // Main action buttons
  secondaryButton: string       // Secondary actions
  
  // Game-Specific Elements
  homeScoreCard: string        // Home team colors
  visitorScoreCard: string     // Visitor team colors
  gameField: string            // Playing field background
  playerCard: string           // Player selection elements
  failedPenalty: string        // Miss indication color
}
```

#### Layout System
- Responsive design with Tailwind CSS
- Flexible component sizing based on screen size
- Customizable color schemes applied via CSS variables and direct styling

### 3. Admin Interface Integration

#### Customization Form Architecture
```typescript
// Field configuration system
const fieldConfig = {
  basicInfo: [
    { 
      key: 'title', 
      label: '1. Game Title *', 
      placeholder: 'My Penalty Shootout Game', 
      description: 'The main title of your game',
      required: true 
    }
    // ... more fields
  ],
  registration: [ /* registration fields */ ],
  gameRules: [ /* game rules fields */ ],
  inGameUI: [ /* gameplay fields */ ],
  resultPage: [ /* results fields */ ],
  resultMessages: [ /* result message fields */ ],
  legacyWinLoss: [ /* legacy compatibility fields */ ],
  loadingAndErrors: [ /* error handling fields */ ]
}
```

#### Form Organization
- **Tabbed Interface**: Texts vs Colors
- **Grouped Sections**: Related fields organized by game flow
- **Sequential Numbering**: Clear field identification (1-60)
- **Real-time Preview**: Changes reflected immediately
- **Reset to Defaults**: Quick cleanup option

---

## Core PlayMass System Resources

These shared resources are available to all game modules:

### 1. Login Module (`/app/components/game/UnifiedRegistration.tsx`)

#### Features
- **Unified Registration**: Name, email, phone collection
- **Validation System**: Required field enforcement
- **Trial Mode**: Play without registration
- **Custom Text Support**: All UI text customizable
- **Responsive Design**: Mobile-first approach

#### Integration Pattern
```typescript
// Game components can use the login module
<UnifiedRegistration
  gameTitle={game.title}
  gameName={game.title}
  customTexts={game.configuration?.penaltyShootout?.texts}
  onSubmit={handleRegistration}
  onTrialMode={handleTrialMode}
  showTrialOption={true}
  containerMode="embedded"
/>
```

#### Customizable Elements
- Registration subtitle
- Field placeholders (name, email, phone)
- Button text (submit, trial mode)
- Loading states
- Error messages

### 2. Result Share Module (`/app/play/[gameId]/result/GameResultClient.tsx`)

#### Features
- **Universal Results Display**: Works for any game type
- **Score Presentation**: Flexible scoring system
- **Social Sharing**: Built-in sharing capabilities
- **Play Again**: Seamless game restart
- **Custom Messaging**: Personalized result text

#### Integration Pattern
```typescript
// Results are automatically handled by the system
const resultParams = new URLSearchParams({
  won: won.toString(),
  userScore: userScore.toString(),
  opponentScore: opponentScore.toString(),
  ...(isTrialMode && { trial: 'true' })
})

router.push(`/play/${gameId}/result?${resultParams.toString()}`)
```

#### Customizable Elements
- Result emojis/icons
- Victory/defeat messages
- Score labels
- Action buttons
- Background themes

### 3. Invite Friends Module (`/app/components/game/GameLayout.tsx`)

#### Features
- **Referral Link Generation**: Unique participant links
- **QR Code Support**: Easy mobile sharing
- **Social Media Integration**: Platform-specific sharing
- **Analytics Tracking**: Referral performance monitoring

#### Integration Pattern
```typescript
// Automatic referral system
const shareLink = `${baseUrl}/play/${gameId}?ref=${participantUuid}`
// QR code and sharing buttons automatically generated
```

### 4. Referral Module (Integrated System-Wide)

#### Features
- **UUID Tracking**: Unique participant identification
- **Referral Chain**: Track invitation sources
- **Reward Distribution**: Automatic referral rewards
- **Analytics Dashboard**: Referral performance metrics

#### Integration Pattern
```typescript
// Referral tracking in game flow
const referralUuid = searchParams.get('ref')
if (referralUuid) {
  // Automatic referral attribution
  setReferringParticipant(referralUuid)
}
```

### 5. Admin Management System

#### Game Configuration
- **Visual Editor**: Drag-and-drop customization
- **Text Management**: Comprehensive text editing
- **Color Theming**: Visual customization tools
- **Preview System**: Real-time game preview
- **Version Control**: Configuration versioning

#### Analytics Dashboard
- **Performance Metrics**: Game engagement statistics
- **Participant Tracking**: User behavior analysis
- **Conversion Rates**: Registration and completion tracking
- **Referral Analytics**: Invitation effectiveness

---

## Game Module Blueprint

### 1. File Structure Template

```
app/
├── components/
│   └── games/
│       └── [GameName].tsx              # Main game component
│       └── [GameName]Layout.tsx        # Game-specific layout
├── types/
│   └── index.ts                        # Game type definitions
├── lib/
│   └── models/
│       └── Game.ts                     # Database schema extensions
└── components/
    └── admin/
        └── [GameName]CustomizationForm.tsx # Admin interface
```

### 2. Core Component Structure

```typescript
// Main Game Component Template
interface GameProps {
  players?: GameElement[]               // Game-specific data
  onFlip: (elementId: string) => Promise<GameOutcome>
  onResult: (result: GameOutcome) => void
  gameId?: string
  isTrialMode?: boolean
  referralUuid?: string | null
  customTexts?: GameTexts              // Customizable text
  customColors?: GameColors            // Customizable colors
  disabled?: boolean
}

export default function GameComponent({
  players = [],
  onFlip,
  onResult,
  gameId,
  isTrialMode = false,
  referralUuid,
  customTexts = {},
  customColors = {},
  disabled = false
}: GameProps) {
  // Game logic implementation
  // Always use: customTexts.fieldName || 'Clean Default'
  // Always use: customColors.fieldName || 'default-value'
}
```

### 3. Database Schema Extension

```typescript
// Game Model Schema Addition
const gameSchema = new Schema<Game>({
  // Existing base fields...
  
  configuration: {
    [gameName]: {
      // Game-specific configuration
      gameElements: [gameElementSchema],
      
      // Customizable texts
      texts: {
        // ALL user-facing text fields
        fieldName1: { type: String, default: '' },
        fieldName2: { type: String, default: '' },
        // ... comprehensive text coverage
      },
      
      // Customizable colors
      colors: {
        // ALL visual customization options
        primaryColor: { type: String, default: '#defaultvalue' },
        secondaryColor: { type: String, default: '#defaultvalue' },
        // ... comprehensive color coverage
      }
    }
  }
})
```

### 4. Admin Interface Template

```typescript
// Customization Form Component
interface GameCustomizationFormProps {
  texts?: Partial<GameTexts>
  colors?: Partial<GameColors>
  gameData?: { title?: string; description?: string }
  onChange: (texts: Partial<GameTexts>, colors: Partial<GameColors>) => void
  onGameDataChange?: (gameData: { title: string; description: string }) => void
}

export default function GameCustomizationForm(props: GameCustomizationFormProps) {
  // Field configuration for admin interface
  const fieldConfig = {
    section1: [
      { key: 'field1', label: '1. Field Label', placeholder: 'Default Value', description: 'Field purpose' }
      // ... organized by user flow sections
    ]
  }
  
  // Tabbed interface: Texts vs Colors
  // Grouped sections by game flow
  // Real-time updates
  // Reset functionality
}
```

---

## Customization Architecture

### 1. Text Customization Layers

#### Layer 1: Component Default Values
```typescript
// Clean, emoji-free defaults in components
const displayText = customTexts?.fieldName || 'Clean Default Text'
```

#### Layer 2: Database Schema Defaults
```typescript
// Database schema with empty string defaults
fieldName: { type: String, default: '' }
```

#### Layer 3: Admin Interface Placeholders
```typescript
// Helpful placeholders in admin interface
{ key: 'fieldName', placeholder: 'Example Text', description: 'When this appears' }
```

### 2. Visual Customization Layers

#### Layer 1: CSS Custom Properties
```css
/* Dynamic color application */
.game-element {
  background-color: var(--custom-bg, #defaultvalue);
  color: var(--custom-text, #defaultvalue);
}
```

#### Layer 2: Inline Styling
```typescript
// Direct style application for dynamic colors
<div style={{ backgroundColor: customColors.bgColor || '#default' }}>
```

#### Layer 3: Conditional Classes
```typescript
// Tailwind class switching based on customization
className={`base-classes ${customColors.theme === 'dark' ? 'dark-theme' : 'light-theme'}`}
```

### 3. Configuration Management

#### Storage Pattern
```typescript
// Configuration stored in game document
game.configuration.gameName = {
  texts: { /* all customizable text */ },
  colors: { /* all customizable colors */ },
  gameSpecificSettings: { /* game logic settings */ }
}
```

#### Retrieval Pattern
```typescript
// Components receive configuration
const customTexts = game?.configuration?.gameName?.texts || {}
const customColors = game?.configuration?.gameName?.colors || {}
```

---

## Integration Patterns

### 1. User Flow Integration

#### Standard Game Flow
```
Registration → Rules → Gameplay → Results → Social Sharing
     ↓           ↓        ↓         ↓           ↓
 UnifiedReg → GameRules → Game → Results → ShareModule
```

#### Trial Mode Flow
```
Trial Button → Rules → Gameplay → Results → Registration Prompt
     ↓          ↓        ↓         ↓              ↓
  TrialFlag → GameRules → Game → Results → ConversionFlow
```

### 2. State Management Integration

#### Game State Pattern
```typescript
interface GameState {
  // Base state for all games
  isGameComplete: boolean
  gameResult: GameOutcome | null
  currentStep: 'registration' | 'rules' | 'game' | 'results'
  
  // Game-specific state
  gameSpecificData: any
}
```

#### Result Handling Pattern
```typescript
const handleGameComplete = (result: GameOutcome) => {
  // Universal result processing
  const resultParams = new URLSearchParams({
    won: result.foundAllStars || result.type === 'WIN',
    // ... game-specific parameters
  })
  
  // Redirect to unified results page
  router.push(`/play/${gameId}/result?${resultParams}`)
}
```

### 3. API Integration Patterns

#### Game Play API
```typescript
// POST /api/games/[id]/play
interface PlayRequest {
  participant: ParticipantData
  sessionId: string
  gameAction: any  // Game-specific action data
}

interface PlayResponse {
  result: GameOutcome
  attemptsRemaining: number
  gameComplete: boolean
}
```

#### Admin API
```typescript
// PUT /api/admin/games/[id]
interface UpdateRequest {
  configuration: {
    gameName: {
      texts: GameTexts
      colors: GameColors
      gameSettings: GameSpecificSettings
    }
  }
}
```

---

## Future Module Development Guide

### 1. Planning Phase

#### Required Analysis
- **User Experience Flow**: Map complete user journey
- **Customization Points**: Identify every text/visual element
- **System Integration**: Determine shared resource usage
- **Game Logic**: Define core gameplay mechanics

#### Documentation Requirements
- **Game Rules**: Clear gameplay documentation
- **Customization Map**: Every customizable element
- **Integration Points**: System resource usage
- **API Specification**: Backend integration needs

### 2. Implementation Phase

#### Step 1: Core Game Component
```typescript
// Create main game component with full customization support
export default function NewGameComponent({
  // Standard props for all games
  onFlip, onResult, gameId, isTrialMode, referralUuid,
  // Game-specific props
  gameElements, customTexts, customColors, disabled
}: NewGameProps) {
  // Implementation with zero hardcoded text/colors
}
```

#### Step 2: Database Integration
```typescript
// Extend Game schema with new game configuration
const gameSchema = new Schema<Game>({
  configuration: {
    newGame: {
      texts: { /* comprehensive text fields */ },
      colors: { /* comprehensive color fields */ },
      gameSettings: { /* game-specific settings */ }
    }
  }
})
```

#### Step 3: Admin Interface
```typescript
// Create customization form with organized sections
export default function NewGameCustomizationForm(props) {
  const fieldConfig = {
    // Organize by user flow sections
    registration: [ /* registration fields */ ],
    gameplay: [ /* gameplay fields */ ],
    results: [ /* results fields */ ]
  }
}
```

#### Step 4: System Integration
```typescript
// Integrate with PlayMass system resources
const GameWithSystem = () => (
  <GameFlow>
    <UnifiedRegistration customTexts={gameTexts} />
    <GameRules customTexts={gameTexts} />
    <NewGameComponent customTexts={gameTexts} customColors={gameColors} />
    <GameResults customTexts={gameTexts} />
  </GameFlow>
)
```

### 3. Testing & Validation

#### Customization Testing
- **Text Customization**: Verify every text field works
- **Color Customization**: Test all visual elements
- **Edge Cases**: Empty fields, special characters
- **Responsive Design**: All screen sizes

#### Integration Testing
- **Login Flow**: Registration and trial modes
- **Sharing System**: Result sharing and referrals
- **Admin Interface**: Configuration management
- **API Integration**: Backend communication

---

## Best Practices

### 1. Code Organization

#### Component Structure
```typescript
// Clear separation of concerns
const GameComponent = () => {
  // 1. State management
  // 2. Game logic
  // 3. System integration
  // 4. Render with customization
}
```

#### File Organization
```
[GameName]/
├── index.tsx              # Main component
├── types.ts              # Type definitions
├── hooks/                # Custom hooks
├── utils/                # Game utilities
└── __tests__/            # Test files
```

### 2. Customization Patterns

#### Text Customization
```typescript
// Always provide clean fallbacks
const text = customTexts?.fieldName || 'Clean Default Text'

// Never hardcode user-facing text
// ❌ Bad
<button>🎮 Play Game</button>

// ✅ Good  
<button>{customTexts.playButton || 'Play Game'}</button>
```

#### Color Customization
```typescript
// Use flexible color application
style={{ 
  backgroundColor: customColors.bgColor || '#default',
  color: customColors.textColor || '#default'
}}

// Support both hex colors and CSS classes
const colorValue = customColors.primary?.startsWith('#') 
  ? customColors.primary 
  : `var(--${customColors.primary})`
```

### 3. Performance Optimization

#### Lazy Loading
```typescript
// Lazy load game components
const GameComponent = dynamic(() => import('./GameComponent'), {
  loading: () => <LoadingSpinner />
})
```

#### Memoization
```typescript
// Memoize expensive calculations
const gameConfiguration = useMemo(() => ({
  texts: customTexts,
  colors: customColors,
  settings: gameSettings
}), [customTexts, customColors, gameSettings])
```

### 4. Accessibility

#### ARIA Labels
```typescript
// Use customizable accessibility text
<button aria-label={customTexts.playButtonAria || 'Start playing the game'}>
  {customTexts.playButton || 'Play'}
</button>
```

#### Keyboard Navigation
```typescript
// Ensure all interactive elements are keyboard accessible
onKeyDown={(e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    handleGameAction()
  }
}}
```

---

## Implementation Checklist

### Pre-Development
- [ ] Game concept and rules defined
- [ ] User flow mapped completely
- [ ] All customization points identified
- [ ] Database schema planned
- [ ] API endpoints specified

### Core Implementation
- [ ] Main game component created
- [ ] Zero hardcoded text/emojis/colors
- [ ] Database schema extended
- [ ] Admin customization form built
- [ ] Type definitions complete

### System Integration
- [ ] UnifiedRegistration integrated
- [ ] GameRules component working
- [ ] Results page connected
- [ ] Referral system active
- [ ] Analytics tracking enabled

### Admin Interface
- [ ] Organized field sections
- [ ] Real-time preview working
- [ ] Color picker functional
- [ ] Reset to defaults works
- [ ] Validation implemented

### Testing
- [ ] All customization fields tested
- [ ] Edge cases covered
- [ ] Mobile responsive
- [ ] Accessibility verified
- [ ] Performance optimized

### Documentation
- [ ] Implementation guide written
- [ ] Admin user manual created
- [ ] API documentation updated
- [ ] Integration examples provided

---

## Conclusion

The PlayMass game module architecture provides a complete framework for building fully customizable game experiences. By following this blueprint, new game modules can be rapidly developed with:

- **Complete Customization**: Every text and visual element controllable
- **System Integration**: Seamless use of shared resources
- **Consistent Experience**: Unified user flows and admin interfaces
- **Scalable Architecture**: Easy to extend and maintain

The Penalty Shootout module serves as the reference implementation, demonstrating how to achieve zero hardcoded elements while maintaining clean, maintainable code that integrates perfectly with the PlayMass ecosystem.

---

**Document Maintained By**: AI Development Team  
**Next Review**: 2025-02-06  
**Related Documents**: `WARP.md`, `ARCHITECTURE.md`, `LEARNINGS.md`
