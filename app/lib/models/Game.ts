import mongoose, { Schema, Model } from 'mongoose'
import { Game, GameType, GameStatus, HexagonCard, PenaltyCard, ShareLink } from '../../types'

// HexagonCard subdocument schema
// This defines the structure for individual hexagon cards
const hexagonCardSchema = new Schema<HexagonCard>({
  id: {
    type: String,
    required: [true, 'Hexagon ID is required'],
    trim: true
  },
  text: {
    type: String,
    required: [true, 'Hexagon text is required'],
    trim: true,
    maxlength: [50, 'Hexagon text cannot exceed 50 characters']
  },
  hasHiddenStar: {
    type: Boolean,
    required: [true, 'Hidden star flag is required'],
    default: false
  },
  isRevealed: {
    type: Boolean,
    default: false
  },
  position: {
    type: Number,
    required: [true, 'Hexagon position is required'],
    min: [0, 'Position must be at least 0'],
    max: [6, 'Position cannot exceed 6 (for 7 hexagons: 0-6)']
  },
  color: {
    type: String,
    default: '#3B82F6', // Default blue color
    match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color']
  },
  backgroundColor: {
    type: String,
    default: '#EFF6FF', // Default light blue background
    match: [/^#[0-9A-Fa-f]{6}$/, 'Background color must be a valid hex color']
  },
  rewardId: {
    type: String,
    default: null
  }
}, { _id: false }) // Disable automatic _id for subdocuments

// PenaltyCard subdocument schema
// This defines the structure for individual penalty cards in Penalty Shootout games
const penaltyCardSchema = new Schema<PenaltyCard>({
  id: {
    type: String,
    required: [true, 'Penalty card ID is required'],
    trim: true
  },
  playerNumber: {
    type: Number,
    required: [true, 'Player number is required'],
    min: [2, 'Player number must be at least 2'],
    max: [22, 'Player number cannot exceed 22']
  },
  hasGoal: {
    type: Boolean,
    required: [true, 'Goal flag is required'],
    default: false
  },
  isRevealed: {
    type: Boolean,
    default: false
  },
  position: {
    type: Number,
    required: [true, 'Position is required'],
    min: [0, 'Position must be at least 0'],
    max: [10, 'Position cannot exceed 10 (for 11 players: 0-10)']
  },
  color: {
    type: String,
    default: '#22C55E', // Default green color for football
    match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color']
  },
  backgroundColor: {
    type: String,
    default: '#DCFCE7', // Default light green background
    match: [/^#[0-9A-Fa-f]{6}$/, 'Background color must be a valid hex color']
  }
}, { _id: false }) // Disable automatic _id for subdocuments


// ShareLink subdocument schema
// This manages the sharing links and QR codes for games
const shareLinkSchema = new Schema<ShareLink>({
  id: {
    type: String,
    required: [true, 'Share link ID is required']
    // IMPORTANT: Do NOT set unique:true here on subdocument arrays.
    // WHAT: A unique index on 'shareLinks.id' across the collection causes E11000
    //       when documents either have no shareLinks or null/duplicate values.
    // WHY: MongoDB enforces uniqueness globally for the index, not per-parent doc.
    //      We rely on app-level randomness for this id and enforce uniqueness on
    //      shortCode instead via a sparse unique index defined on the parent schema.
  },
  url: {
    type: String,
    required: [true, 'Share URL is required'],
    match: [/^https?:\/\/.+/, 'URL must be a valid HTTP/HTTPS URL']
  },
  shortCode: {
    type: String,
    required: [true, 'Short code is required'],
    trim: true,
    minlength: [4, 'Short code must be at least 4 characters'],
    maxlength: [12, 'Short code cannot exceed 12 characters']
  },
  qrCodeUrl: {
    type: String,
    default: null,
    match: [/^https?:\/\/.+/, 'QR code URL must be a valid HTTP/HTTPS URL']
  },
  expiresAt: {
    type: Date,
    default: null
  },
  clickCount: {
    type: Number,
    default: 0,
    min: [0, 'Click count cannot be negative']
  },
  isActive: {
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false })

// Main Game schema
// This defines the complete structure for game documents in MongoDB
const gameSchema = new Schema<Game>({
  title: {
    type: String,
    required: [true, 'Game title is required'],
    trim: true,
    minlength: [3, 'Title must be at least 3 characters'],
    maxlength: [200, 'Title cannot exceed 200 characters']
  },
  
  description: {
    type: String,
    trim: true,
    maxlength: [1000, 'Description cannot exceed 1000 characters']
  },
  
  type: {
    type: String,
    required: [true, 'Game type is required'],
    enum: {
      values: ['QUIZZZ', 'WHACKPOP'] as GameType[],
      message: 'Game type must be one of: QUIZZZ, WHACKPOP'
    }
  },
  
  status: {
    type: String,
    required: [true, 'Game status is required'],
    enum: {
      values: ['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'] as GameStatus[],
      message: 'Status must be one of: DRAFT, ACTIVE, PAUSED, COMPLETED, ARCHIVED'
    },
    default: 'DRAFT'
  },
  
  // Game configuration object with type-specific settings
  configuration: {
    // Central platform configuration for 4-page flow
    platform: {
      texts: {
        TEXT_10: { type: String, default: '' },
        TEXT_20: { type: String, default: '' },
        TEXT_30: { type: String, default: '' },
        TEXT_40: { type: String, default: '' },
        // Hero Logo fields (persisted under platform texts)
        // What: Allow admins to set a logo image in the HERO block with specific dimensions.
        // Why: Product requirement to brand the header area consistently across all play pages.
        HERO_LOGO_URL: { type: String, default: '' },
        HERO_LOGO_WIDTH: { type: String, default: '' },
        HERO_LOGO_HEIGHT: { type: String, default: '' },
        TEXT_11: { type: String, default: '' },
        TEXT_12: { type: String, default: '' },
        TEXT_13: { type: String, default: '' },
        TEXT_14: { type: String, default: '' },
        TEXT_15: { type: String, default: '' },
        TEXT_16: { type: String, default: '' },
        TEXT_17: { type: String, default: '' },
        TEXT_18: { type: String, default: '' },
        TEXT_19: { type: String, default: '' },
        TEXT_21: { type: String, default: '' },
        TEXT_22: { type: String, default: '' },
        TEXT_23: { type: String, default: '' },
        TEXT_24: { type: String, default: '' },
        TEXT_25: { type: String, default: '' },
        TEXT_41: { type: String, default: '' },
        TEXT_42: { type: String, default: '' },
        TEXT_43: { type: String, default: '' },
        TEXT_44: { type: String, default: '' },
        TEXT_45: { type: String, default: '' },
        TEXT_46: { type: String, default: '' },
        
        // Per-button background CSS (multiline CSS supported)
        // What: Allow admins to set exact CSS backgrounds (including gradients) for primary CTAs across the flow
        // Why: Product requirement to control button visuals with full CSS, not only utility classes
        TEXT_18_BG: { type: String, default: '' }, // Next With Login (Welcome) button background
        TEXT_19_BG: { type: String, default: '' }, // Next Without Login (Welcome) button background
        TEXT_25_BG: { type: String, default: '' }, // Next Play (Rules) button background
        TEXT_45_BG: { type: String, default: '' }, // Invite Friend (Result) button background
        TEXT_46_BG: { type: String, default: '' }, // Play Again (Result) button background
        
        // Extended per-game platform texts
        TEXT_26: { type: String, default: '' },
        TEXT_27: { type: String, default: '' },
        TEXT_44_URL: { type: String, default: '' },
        CTA_TITLE: { type: String, default: '' },
        CTA_DESCRIPTION: { type: String, default: '' },
        WON_TEXT: { type: String, default: '' },
        LOST_TEXT: { type: String, default: '' },
        // Standardized CTA keys for Admin Editor (Option B migration)
        // What: Introduce consistent 3-line setups across buttons and dedicated ACTION fields where applicable.
        // Why: Future-proof CTA configuration and keep backward compatibility by preserving legacy keys.
        // Note: CTA1_BG already existed historically; we add CTA1_TEXT and CTA1_URL to complete the trio.
        CTA1_TEXT: { type: String, default: '' },
        CTA1_URL: { type: String, default: '' },
        CTA1_BG: { type: String, default: '' },
        CTA1_FG: { type: String, default: '' },

        // Welcome — Next With Login (maps from/to TEXT_18, TEXT_18_BG)
        NEXT_LOGIN_TEXT: { type: String, default: '' },
        NEXT_LOGIN_ACTION: { type: String, default: '' },
        NEXT_LOGIN_BG: { type: String, default: '' },
        NEXT_LOGIN_FG: { type: String, default: '' },

        // Welcome — Next Without Login (maps from/to TEXT_19, TEXT_19_BG)
        NEXT_GUEST_TEXT: { type: String, default: '' },
        NEXT_GUEST_ACTION: { type: String, default: '' },
        NEXT_GUEST_BG: { type: String, default: '' },
        NEXT_GUEST_FG: { type: String, default: '' },

        // Rules — Next Play (maps from/to TEXT_25, TEXT_25_BG)
        NEXT_PLAY_TEXT: { type: String, default: '' },
        NEXT_PLAY_ACTION: { type: String, default: '' },
        NEXT_PLAY_BG: { type: String, default: '' },
        NEXT_PLAY_FG: { type: String, default: '' },

        // Result — Invite Friend (maps from/to TEXT_45, TEXT_45_BG)
        INVITE_TEXT: { type: String, default: '' },
        INVITE_ACTION: { type: String, default: '' },
        INVITE_BG: { type: String, default: '' },
        INVITE_FG: { type: String, default: '' },

        // Result — Play Again (maps from/to TEXT_46, TEXT_46_BG)
        PLAYAGAIN_TEXT: { type: String, default: '' },
        PLAYAGAIN_ACTION: { type: String, default: '' },
        PLAYAGAIN_BG: { type: String, default: '' },
        PLAYAGAIN_FG: { type: String, default: '' },

        // Landing Page — Fields and Next Welcome CTA
        // What: Persist configuration for the Landing screen (title, image) and its CTA button.
        // Why: Admin reported LANDING_* fields not saving; strict schema requires explicit keys.
        LANDING_TITLE: { type: String, default: '' },
        LANDING_IMAGE_URL: { type: String, default: '' },
        NEXT_WELCOME_TEXT: { type: String, default: '' },
        NEXT_WELCOME_ACTION: { type: String, default: 'GO_TO_WELCOME' },
        NEXT_WELCOME_BG: { type: String, default: '' },
        NEXT_WELCOME_FG: { type: String, default: '' },

        CTA_BUTTONS: {
          type: [
            new Schema({
              text: { type: String, default: '' },
              url: { type: String, default: '' },
              bg: { type: String, default: '' },
              fg: { type: String, default: '' }
            }, { _id: false })
          ],
          default: []
        },
        // Public documents
        TERMS_TITLE: { type: String, default: '' },
        TERMS_BODY: { type: String, default: '' },
        PRIVACY_TITLE: { type: String, default: '' },
        PRIVACY_BODY: { type: String, default: '' },
        DELETION_TITLE: { type: String, default: '' },
        DELETION_BODY: { type: String, default: '' }
      },
      styles: {
        hero: {
          background: { type: String, default: '' },
          titleClass: { type: String, default: '' },
          // Use scoreboard allows switching between SplitFlap and standard text in the HERO block.
          // Default true to preserve existing visual design unless the admin opts out in editor.
          useScoreboard: { type: Boolean, default: true },
          // Google Font configuration for HERO
          // What: Allow admins to set a Google Fonts family using a specimen URL and style (e.g., "SemiBold 600").
          // Why: Brand-specific typography for the header.
          fontUrl: { type: String, default: '' },
          fontStyle: { type: String, default: '' },
          fontColor: { type: String, default: '' }
        },
        main: {
          background: { type: String, default: '' },
          // Typography classes
          h1Class: { type: String, default: '' },
          h2Class: { type: String, default: '' },
          pClass: { type: String, default: '' },
          // Inputs and buttons
          inputClass: { type: String, default: '' },
          buttonPrimaryClass: { type: String, default: '' },
          buttonSecondaryClass: { type: String, default: '' },
          // Google Font configuration for MAIN (per-type)
          // What: Allow admins to set different Google Fonts for H1/H2/P to fully control hierarchy.
          // Why: Prevent style bleeding and enable precise visual customization per text type.
          h1FontUrl: { type: String, default: '' },
          h1FontStyle: { type: String, default: '' },
          h2FontUrl: { type: String, default: '' },
          h2FontStyle: { type: String, default: '' },
          pFontUrl: { type: String, default: '' },
          pFontStyle: { type: String, default: '' },
          // Per-type colors for MAIN typography
          h1Color: { type: String, default: '' },
          h2Color: { type: String, default: '' },
          pColor: { type: String, default: '' }
        },
        scoreboard: {
          homeBg: { type: String, default: '' },
          visitorBg: { type: String, default: '' },
          digitColor: { type: String, default: '' }
        },
        // Per-text display type mapping (H1/H2/P) used by the editor and optionally runtime rendering
        // What: Allow admins to select a semantic type for each platform text.
        // Why: Fine-tune visuals by mapping texts to H1/H2/P classes.
        textTypes: { type: Schema.Types.Mixed, default: {} }
      }
    },

    // General (global) texts and colors for all games
    general: {
      texts: {
        // 🎯 Welcome & Registration
        gameTitle: { type: String, default: '' },
        namePlaceholder: { type: String, default: '' },
        emailPlaceholder: { type: String, default: '' },
        phonePlaceholder: { type: String, default: '' },
        contactRequiredError: { type: String, default: '' },
        startPlayingButton: { type: String, default: '' },
        tryWithoutRegText: { type: String, default: '' },
        tryWithoutRegButton: { type: String, default: '' },

        // 📋 Game Rules & Description
        gameRulesTitle: { type: String, default: '' },
        playButton: { type: String, default: '' },
        gameRulesText: { type: String, default: '' },
        winConditionsTitle: { type: String, default: '' },
        winConditionsText: { type: String, default: '' },
        gameDescription: { type: String, default: '' },

        // 🏆 Result Page & Result Messages
        gameResultsTitle: { type: String, default: '' },
        playAgainButton: { type: String, default: '' },
        shareWithFriendsButton: { type: String, default: '' },
        victoryResultMessage: { type: String, default: '' },
        defeatResultMessage: { type: String, default: '' },

        // 📊 Win/Loss Messages
        defeatTitle: { type: String, default: '' },
        victoryTitle: { type: String, default: '' },
        drawMessage: { type: String, default: '' },

        // ⚠️ Loading & Error Messages
        loadingGameText: { type: String, default: '' },
        gameNotFoundTitle: { type: String, default: '' },
        gameNotFoundMessage: { type: String, default: '' },
        tryAgainButton: { type: String, default: '' },
        gameTypeNotSupportedTitle: { type: String, default: '' },
        gameTypeNotSupportedMessage: { type: String, default: '' }
      },
      colors: {
        // 🎨 Background Colors
        pageBackground: { type: String, default: 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900' },
        blockBackground: { type: String, default: 'bg-white/10 backdrop-blur-sm' },

        // 🔘 Button Colors
        primaryButton: { type: String, default: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' },
        secondaryButton: { type: String, default: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' },

        // ⚽ Game Field Colors
        homeScoreCard: { type: String, default: '#c00000' },
        visitorScoreCard: { type: String, default: '#0066cc' },
        gameField: { type: String, default: '#2ecc71' },
        playerCard: { type: String, default: '#c00000' },
        failedPenalty: { type: String, default: '#ffffff' }
      }
    },
    // Find Red (Get Shorty) specific configuration — persisted to ensure traceability of all values
    // What: Round-based card picking game where the user tries to find red cards.
    // Why: Extend platform with a simple, fast, highly configurable game.
    // Quizzz (board quiz) configuration
    quizzz: {
      mapType: { type: String, enum: ['hex','square'], default: 'hex' },
      mapName: { type: String, default: '' },
      selectedMaps: { type: [{ type: new Schema({ type: { type: String }, name: { type: String } }, { _id: false }) }], default: [] },
      numberOfCards: { type: Number, min: [1,'Must be >=1'], default: 6 },
      rounds: { type: Number, min: [1,'Must be >=1'], default: 5 },
      winLimit: { type: Number, min: [1,'Must be >=1'], default: 3 },
      questions: { type: [{ type: new Schema({ id: String, text: String, answers: [{ text: String, isCorrect: Boolean }] }, { _id: false }) }], default: [] },
      backgroundCss: { type: String, default: '' },
      tileStyles: { type: Schema.Types.Mixed, default: {} },
      cardCoverImages: { type: [String], default: [] },
      cardCoverFill: { type: Boolean, default: true },
      cardColors: { type: Schema.Types.Mixed, default: {} },
      overlayBg: { type: String, default: '#00000044' }
    },

    // WHAT: WhackPop (Whack-a-Mole style) game configuration
    // WHY: Persists grid-based target-clicking game settings with progressive difficulty
    whackPop: {
      // Map integration (reuses existing hex/square map system)
      mapType: { 
        type: String, 
        enum: ['hex', 'square'], 
        default: 'hex' 
      },
      mapName: { 
        type: String, 
        default: '' 
      },
      selectedMaps: { 
        type: [{ type: new Schema({ type: { type: String }, name: { type: String } }, { _id: false }) }], 
        default: [] 
      },
      
      // Core gameplay timing
      gameDuration: { 
        type: Number, 
        min: [30, 'Game duration must be at least 30 seconds'], 
        max: [180, 'Game duration cannot exceed 180 seconds'], 
        default: 60 
      },
      rounds: { 
        type: Number, 
        min: [1, 'Must have at least 1 round'], 
        max: [5, 'Cannot exceed 5 rounds'], 
        default: 3 
      },
      targetScore: { 
        type: Number, 
        min: [0, 'Target score cannot be negative'], 
        max: [1000000, 'Target score too high'], 
        default: 1000 
      },
      
      // Spawn mechanics (dynamic difficulty progression)
      initialSpawnInterval: { 
        type: Number, 
        min: [200, 'Initial spawn interval must be at least 200ms'], 
        max: [5000, 'Initial spawn interval cannot exceed 5000ms'], 
        default: 1200 
      },
      minSpawnInterval: { 
        type: Number, 
        min: [100, 'Min spawn interval must be at least 100ms'], 
        max: [3000, 'Min spawn interval cannot exceed 3000ms'], 
        default: 400 
      },
      simultaneousTargets: { 
        type: Number, 
        min: [1, 'Must have at least 1 simultaneous target'], 
        max: [5, 'Cannot exceed 5 simultaneous targets'], 
        default: 3 
      },
      
      // Target visibility timing
      initialDisplayDuration: { 
        type: Number, 
        min: [200, 'Initial display duration must be at least 200ms'], 
        max: [5000, 'Initial display duration cannot exceed 5000ms'], 
        default: 1000 
      },
      minDisplayDuration: { 
        type: Number, 
        min: [100, 'Min display duration must be at least 100ms'], 
        max: [3000, 'Min display duration cannot exceed 3000ms'], 
        default: 400 
      },
      
      // Scoring system
      hitPoints: { 
        type: Number, 
        min: [1, 'Hit points must be at least 1'], 
        max: [1000, 'Hit points cannot exceed 1000'], 
        default: 100 
      },
      missPenalty: { 
        type: Number, 
        min: [0, 'Miss penalty cannot be negative'], 
        max: [500, 'Miss penalty cannot exceed 500'], 
        default: 0 
      },
      comboMultiplier: { 
        type: Number, 
        min: [1.0, 'Combo multiplier must be at least 1.0'], 
        max: [5.0, 'Combo multiplier cannot exceed 5.0'], 
        default: 1.25 
      },
      
      // Theming and visual assets
      theme: { 
        type: String, 
        enum: ['classic', 'neon', 'arcade', 'pixel'], 
        default: 'arcade' 
      },
      targetImages: { 
        type: [String], 
        default: [] 
      },
      targetEmoji: { 
        type: [String], 
        default: ['🎯', '🟢', '💥'] 
      },
      hitEffect: { 
        type: String, 
        enum: ['burst', 'sparkle', 'shockwave', 'confetti'], 
        default: 'burst' 
      },
      
      // Color customization (inline theming)
      colors: {
        background: { 
          type: String, 
          default: '#0B0F19',
          match: [/^#[0-9A-Fa-f]{6}$/, 'Background must be a valid hex color']
        },
        inactiveCell: { 
          type: String, 
          default: '#1F2937',
          match: [/^#[0-9A-Fa-f]{6}$/, 'Inactive cell color must be a valid hex color']
        },
        activeTarget: { 
          type: String, 
          default: '#22C55E',
          match: [/^#[0-9A-Fa-f]{6}$/, 'Active target color must be a valid hex color']
        },
        hitFeedback: { 
          type: String, 
          default: '#F59E0B',
          match: [/^#[0-9A-Fa-f]{6}$/, 'Hit feedback color must be a valid hex color']
        },
        missFeedback: { 
          type: String, 
          default: '#EF4444',
          match: [/^#[0-9A-Fa-f]{6}$/, 'Miss feedback color must be a valid hex color']
        }
      }
    },

    findRed: {
      packSize: { type: Number, min: [3, 'packSize must be at least 3'], max: [32, 'packSize cannot exceed 32'], default: 6 },
      redsPerPack: { type: Number, min: [1, 'redsPerPack must be at least 1'], default: 2 },
      selectionsPerRound: { type: Number, min: [1, 'selectionsPerRound must be at least 1'], default: 1 },
      targetReds: { type: Number, min: [1, 'targetReds must be at least 1'], default: 3 },
      totalRounds: { type: Number, min: [1, 'totalRounds must be at least 1'], default: 5 },
      theme: { type: String, enum: ['default', 'minimal'], default: 'default' },
      texts: {
        shortyLabel: { type: String, default: 'Shorty' }
      },
      colors: {
        background: { type: String, default: '#0B1220', match: [/^#([0-9A-Fa-f]{6})$/, 'background must be hex color'] },
        winForeground: { type: String, default: '#FF1A1A', match: [/^#([0-9A-Fa-f]{6})$/, 'winForeground must be hex color'] },
        neutralForeground: { type: String, default: '#A0AEC0', match: [/^#([0-9A-Fa-f]{6})$/, 'neutralForeground must be hex color'] },
        cardBack: { type: String, default: '#1F2937', match: [/^#([0-9A-Fa-f]{6})$/, 'cardBack must be hex color'] },
        cardBorder: { type: String, default: '#374151', match: [/^#([0-9A-Fa-f]{6})$/, 'cardBorder must be hex color'] }
      },
      defaultRewardId: { type: String, default: '' }
    },

    // Wheel of Fortune configuration — integrates LuckyWheel into standardized flow
    wheelOfFortune: {
      segments: {
        type: [new Schema({
          id: { type: String, required: [true, 'Wheel segment id is required'] },
          label: { type: String, required: [true, 'Wheel segment label is required'], trim: true, maxlength: 100 },
          probability: { type: Number, min: [0, 'Probability cannot be negative'], max: [100, 'Probability cannot exceed 100'], default: 0 },
          color: { type: String, match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'], default: '#3B82F6' },
          backgroundColor: { type: String, match: [/^#[0-9A-Fa-f]{6}$/, 'Background must be a valid hex color'], default: '#3B82F6' },
          isActive: { type: Boolean, default: true }
        }, { _id: false })],
        default: []
      },
      spins: { type: Number, default: 8 },
      spinsPerGame: { type: Number, default: 1 },
      durationMs: { type: Number, default: 4500 },
      pointerAt: { type: String, enum: ['top', 'right', 'bottom', 'left'], default: 'top' },
      size: { type: Number, default: 280 },
      theme: { type: String, enum: ['default', 'colorful', 'minimal'], default: 'default' },
      allowImmediateReplay: { type: Boolean, default: false }
    },

// Structured Pages Editor — persisted page/box/content model
    pages: {
      type: [new Schema({
        id: { type: String, required: true },
        name: { type: String, required: true, trim: true, maxlength: 100 },
        isActive: { type: Boolean, default: true },
        layout: { type: String, default: '' },
        boxes: [new Schema({
          id: { type: String, required: true },
          name: { type: String, default: '', trim: true, maxlength: 100 },
          block: { type: String, enum: ['HERO','MAIN'], default: 'MAIN' },
          columns: { type: Number, enum: [1,2,3], default: 1 },
          items: [new Schema({
            id: { type: String, required: true },
            kind: { type: String, enum: ['TEXT','BUTTON','INPUT'], required: true },
            // TEXT
            name: { type: String, default: '', trim: true, maxlength: 200 },
            text: { type: String, default: '' },
style: { type: String, enum: ['HERO','H1','H2','P'], default: 'P' },
                // BUTTON
                mode: { type: String, enum: ['PREDEFINED','URL'], default: 'URL' },
                action: { type: String, enum: ['GOTO_PAGE','INVITE_FRIEND','PLAY_AS_GUEST','START_GAME','REGISTER','RESTART_GAME','FB_LOGIN'], default: undefined },
                targetPageName: { type: String, default: '' },
                url: { type: String, default: '' },
                backgroundCss: { type: String, default: '' },
                fontColor: { type: String, default: '' },
                command: { type: String, default: '' },
                // INPUT
                field: { type: String, enum: ['NAME','EMAIL','PHONE','CUSTOM'], default: undefined },
                label: { type: String, default: '' },
                placeholder: { type: String, default: '' },
                required: { type: Boolean, default: false }
          }, { _id: false })]
        }, { _id: false })]
      }, { _id: false })],
      default: []
    },

    // Hex-grid specific configuration
    starsHexa: {
      hexagons: {
        type: [hexagonCardSchema]
        // Validation handled in pre-save middleware
      },
      totalStars: {
        type: Number,
        required: false // Validation handled in pre-save middleware
      },
      maxFlipsPerAttempt: {
        type: Number
        // Validation handled in pre-save middleware
      },
      theme: {
        type: String,
        enum: ['default', 'colorful', 'minimal'],
        default: 'default'
      },
      // Optional UI texts for the 4-page flow
      // Why: allows clean admin customization while preserving backwards compatibility
      texts: {
        welcomeTitle: { type: String, default: '' },
        welcomeSubtitle: { type: String, default: '' },
        ctaStart: { type: String, default: '' },
        ctaGuest: { type: String, default: '' },
        rulesTitle: { type: String, default: '' },
        rulesBody: { type: String, default: '' },
        resultTitle: { type: String, default: '' },
        resultInviteCTA: { type: String, default: '' },
        resultPlayAgainCTA: { type: String, default: '' },
        resultPartnerCTA: { type: String, default: '' },
        gameHUD: { type: String, default: '' }
      },
      // Optional color palette with strict hex validation
      colors: {
        palette: {
          primary: { type: String, match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'], default: '#0EA5E9' },
          accent: { type: String, match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'], default: '#F59E0B' },
          bg: { type: String, match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'], default: '#0B1220' },
          text: { type: String, match: [/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color'], default: '#FFFFFF' }
        },
        // Hex grid specific styling for the main block (accepts any CSS-safe string for backgrounds)
        // WHAT: Allow admin to customize hex visuals without hardcoding, including gradients.
        // WHY: Product requirement to brand the active/inactive faces and edges per game.
        hexGrid: {
          activeHexBg: { type: String, default: '' },
          flipGoodBg: { type: String, default: '' },
          flipBadBg: { type: String, default: '' },
          inactiveHexBg: { type: String, default: '' },
          edgeStrokeColor: { type: String, default: '' }
        }
      },
      // Emoji customization for hex-grid games
      emojis: {
        win: { type: String, default: '⭐️' },
        lose: { type: String, default: '🍄' }
      }
    },
    
    // Penalty Shootout specific configuration
    penaltyShootout: {
      players: {
        type: [penaltyCardSchema]
        // Validation handled in pre-save middleware
      },
      totalGoals: {
        type: Number,
        required: false // Validation handled in pre-save middleware
      },
      playersToSelect: {
        type: Number,
        default: 5 // Always 5 players for penalties
      },
      theme: {
        type: String,
        enum: ['default', 'colorful', 'football'],
        default: 'football'
      },
      // Customizable texts
      texts: {
        // Basic game info
        title: { type: String, default: 'My Penalty Shootout Game' },
        description: { type: String, default: 'An exciting penalty shootout game with customizable rules and rewards' },
        
        // Registration texts  
        gameTitle: { type: String, default: 'DVTK Büntető Párbaj' },
        namePlaceholder: { type: String, default: 'Enter your name' },
        emailPlaceholder: { type: String, default: 'your@email.com' },
        phonePlaceholder: { type: String, default: '+1 (555) 123-4567' },
        contactRequiredError: { type: String, default: 'Please provide either email or phone number' },
        startPlayingButton: { type: String, default: 'Start Playing' },
        tryWithoutRegText: { type: String, default: 'Want to try without registration?' },
        tryWithoutRegButton: { type: String, default: 'Try Without Registration' },
        
        // Game texts
        gameRulesTitle: { type: String, default: 'Game Rules:' },
        gameRulesText: { type: String, default: 'Select 5 players from 11 team members\nIf draw, Visitor WINS!' },
        winConditionsTitle: { type: String, default: 'Win Conditions:' },
        winConditionsText: { type: String, default: 'Score more goals than opponent\nSelect players wisely - you can\'t see who scores until selected\nIn overtime: first team to score more wins' },
        gameDescription: { type: String, default: 'Válaszd ki a büntetőpárbajban részt vevő játékosokat és ha győzöl megkaphatod a DVTK FanZone ajándékok egykét' },
        playButton: { type: String, default: 'PLAY' },
        
        // Result page texts
        gameResultsTitle: { type: String, default: 'GAME RESULTS' },
        playAgainButton: { type: String, default: 'Play Again' },
        shareWithFriendsButton: { type: String, default: 'Share with Friends' },
        shareResultTitle: { type: String, default: 'Share Your Result' },
        copyLinkButton: { type: String, default: 'Copy Link' },
        shareButton: { type: String, default: 'Share' },
        congratulationsText: { type: String, default: 'Congratulations!' },
        gameOverText: { type: String, default: 'Game Over' },
        inviteFriendsButton: { type: String, default: 'Invite Friends' },
        
        // Result message emojis and texts
        victoryResultEmoji: { type: String, default: '' },
        defeatResultEmoji: { type: String, default: '' },
        victoryResultMessage: { type: String, default: 'Fantastic! You won the penalty shootout' },
        defeatResultMessage: { type: String, default: 'Good effort! You lost the penalty shootout. Try again!' },
        
        // Labels and UI elements
        yourGoalsLabel: { type: String, default: 'Your Goals' },
        opponentGoalsLabel: { type: String, default: 'Opponent Goals' },
        starsFoundLabel: { type: String, default: 'Stars Found' },
        roundsUsedLabel: { type: String, default: 'Rounds Used' },
        
        // Win/Loss texts (legacy - keeping for backwards compatibility)
        defeatIcon: { type: String, default: '' },
        defeatTitle: { type: String, default: 'Defeat!' },
        trialModeIndicator: { type: String, default: 'Trial Mode' },
        visitorWinMessage: { type: String, default: 'VISITOR won the penalty shootout' },
        drawIcon: { type: String, default: '' },
        drawMessage: { type: String, default: 'DRAW' },
        visitorPenaltyWinMessage: { type: String, default: 'VISITOR wins on penalties!' },
        victoryIcon: { type: String, default: '' },
        victoryTitle: { type: String, default: 'Victory! You won' },
        homeWinMessage: { type: String, default: 'HOME won the penalty shootout' },
        
        // Loading and Error texts
        loadingGameText: { type: String, default: 'Loading game...' },
        gameNotFoundTitle: { type: String, default: 'Game Not Found' },
        gameNotFoundMessage: { type: String, default: 'The game you\'re looking for doesn\'t exist or is no longer available.' },
        tryAgainButton: { type: String, default: 'Try Again' },
        gameTypeNotSupportedTitle: { type: String, default: 'Game Type Not Supported' },
        gameTypeNotSupportedMessage: { type: String, default: 'This game type is not yet supported in the play interface.' }
      },
      
      // Customizable colors
      colors: {
        // Background colors
        pageBackground: { type: String, default: 'bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900' },
        blockBackground: { type: String, default: 'bg-white/10 backdrop-blur-sm' },
        titleField: { type: String, default: '#444444' },
        
        // Button colors
        primaryButton: { type: String, default: 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' },
        secondaryButton: { type: String, default: 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' },
        
        // Game field colors
        // Home team score card background color
        // Why: we persist explicit per-team colors to avoid a third, global scoreboard color as per design rules
        homeScoreCard: { type: String, default: '#c00000' },
        // Visitor team score card background color
        // Why: ensures only two scorecard backgrounds (home/visitor) are used in the UI
        visitorScoreCard: { type: String, default: '#0066cc' },
        gameField: { type: String, default: '#2ecc71' },
        playerCard: { type: String, default: '#c00000' },
        failedPenalty: { type: String, default: '#ffffff' }
      }
    },

    // Quizz (hexamap-based quiz) configuration
    quizz: {
      // WHAT: Allow multiple grid systems for Quizz maps — hex (axial), square (Cartesian/Chebyshev), diamond (Cartesian/Manhattan)
      // WHY: Product requirement to support different board shapes without duplicating quiz logic.
      mapType: { type: String, enum: ['hex', 'square'], default: 'hex' },
      mapName: { type: String, default: '' },
      selectedMaps: {
        type: [new Schema({
          type: { type: String, enum: ['hex', 'square'], required: true },
          name: { type: String, required: true, trim: true }
        }, { _id: false })],
        default: []
      },
      randomizeSelectedMaps: { type: Boolean, default: false },
      // Active coordinates union — store as flexible objects and validate by mapType at the app level.
      activeCoords: {
        type: [new Schema({
          q: { type: Number },
          r: { type: Number },
          x: { type: Number },
          y: { type: Number }
        }, { _id: false })],
        default: []
      },
      mapTag: { type: String, default: 'water' }, // What: Random map tag for auto-selected maps. Why: Admin can change anytime to switch themes.
      rounds: { type: Number, min: [1, 'rounds must be at least 1'], default: 5 },
      targetCorrect: { type: Number, min: [1, 'targetCorrect must be at least 1'], default: 3 },
      theme: { type: String, enum: ['default', 'minimal'], default: 'default' },
      overlayBg: { type: String, default: 'rgba(0,0,0,0.6)' },
      texts: {
        questionCTA: { type: String, default: '' },
        submitAnswer: { type: String, default: 'Submit' },
        correctFeedback: { type: String, default: 'Correct!' },
        wrongFeedback: { type: String, default: 'Try again' }
      },
      cardCoverImages: { type: [String], default: [] },
      questions: {
        type: [new Schema({
          id: { type: String, required: [true, 'Question id is required'] },
          text: { type: String, required: [true, 'Question text is required'], trim: true, maxlength: 300 },
          answers: {
            type: [new Schema({
              text: { type: String, required: true, trim: true, maxlength: 200 },
              isCorrect: { type: Boolean, default: false }
            }, { _id: false })],
            validate: {
              validator: function(v: any[]) { return Array.isArray(v) && v.length === 3 },
              message: 'Exactly 3 answers are required'
            }
          }
        }, { _id: false })],
        default: []
      }
    },
    
    // General game settings applicable to all game types
    allowMultipleAttempts: {
      type: Boolean,
      default: true
    },
    maxAttemptsPerUser: {
      type: Number,
      default: 1,
      min: [1, 'Must allow at least 1 attempt per user'],
      max: [10, 'Cannot exceed 10 attempts per user']
    },
    requireRegistration: {
      type: Boolean,
      default: false
    },
    showResults: {
      type: Boolean,
      default: true
    },
    startDate: {
      type: Date,
      default: null
    },
    endDate: {
      type: Date,
      default: null,
      validate: {
        validator: function(this: Game, endDate: Date) {
          // Ensure end date is after start date if both are provided
          if (this.configuration.startDate && endDate) {
            return endDate > this.configuration.startDate
          }
          return true
        },
        message: 'End date must be after start date'
      }
    }
  },
  
  // References to target groups that can play this game
  targetGroups: [{
    type: Schema.Types.ObjectId,
    ref: 'TargetGroup'
  }],
  
  // Share links for distributing the game
  shareLinks: {
    type: [shareLinkSchema],
    default: []
  },
  
  // Creator information
  createdBy: {
    type: String,
    required: [true, 'Creator information is required'],
    trim: true
  },
  
  // Statistics fields for performance tracking
  totalParticipants: {
    type: Number,
    default: 0,
    min: [0, 'Total participants cannot be negative']
  },
  
  totalPlays: {
    type: Number,
    default: 0,
    min: [0, 'Total plays cannot be negative']
  },
  
  // Visibility settings
  isPublic: {
    type: Boolean,
    default: false
  },
  
  // Optional tags for categorization
  tags: [{
    type: String,
    trim: true,
    maxlength: [50, 'Tag cannot exceed 50 characters']
  }]
}, {
  // Schema options for automatic timestamp management
  timestamps: true, // Automatically adds createdAt and updatedAt fields
  
  // Optimize for queries
  collection: 'games',
  
  // Add version key for optimistic concurrency control
  versionKey: '__v'
})

// Indexes for optimal query performance
// These indexes support common query patterns and ensure uniqueness where required

// Compound index for filtering games by status and type
gameSchema.index({ status: 1, type: 1 })

// Index for creator-based queries
gameSchema.index({ createdBy: 1, createdAt: -1 })

// Index for public games discovery
gameSchema.index({ isPublic: 1, status: 1 })

// Text index for searching games by title and description
gameSchema.index({ 
  title: 'text', 
  description: 'text',
  tags: 'text'
}, {
  weights: {
    title: 10,
    description: 5,
    tags: 3
  },
  name: 'game_search_index'
})

// Index for date-based queries
gameSchema.index({ 'configuration.startDate': 1, 'configuration.endDate': 1 })

// Ensure unique short codes across all share links
gameSchema.index({ 'shareLinks.shortCode': 1 }, { 
  unique: true, 
  sparse: true // Only enforce uniqueness for non-null values
})

// Instance methods for game operations
// These methods provide business logic directly on the model instances

// Method to check if game is currently playable
gameSchema.methods.isPlayable = function(this: Game): boolean {
  const now = new Date()
  
  // Check if game is in active status
  if (this.status !== 'ACTIVE') {
    return false
  }
  
  // Check if game is within its active date range
  if (this.configuration.startDate && now < this.configuration.startDate) {
    return false
  }
  
  if (this.configuration.endDate && now > this.configuration.endDate) {
    return false
  }
  
  return true
}

// Method to generate a new share link
gameSchema.methods.generateShareLink = function(this: Game): ShareLink {
  const shortCode = Math.random().toString(36).substring(2, 10).toUpperCase()
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
  
  const shareLink: ShareLink = {
    id: new mongoose.Types.ObjectId().toString(),
    url: `${baseUrl}/play/${this._id}?ref=${shortCode}`,
    shortCode: shortCode,
    qrCodeUrl: undefined, // Will be generated later if needed
    expiresAt: undefined,
    clickCount: 0,
    isActive: true,
    createdAt: new Date()
  }
  
  this.shareLinks.push(shareLink)
  return shareLink
}

// Static methods for game queries
// These methods provide convenient ways to query games with common filters

// Find active games that can be played right now
gameSchema.statics.findPlayable = function(): Promise<Game[]> {
  const now = new Date()
  
  return this.find({
    status: 'ACTIVE',
    $and: [
      {
        $or: [
          { 'configuration.startDate': { $exists: false } },
          { 'configuration.startDate': null },
          { 'configuration.startDate': { $lte: now } }
        ]
      },
      {
        $or: [
          { 'configuration.endDate': { $exists: false } },
          { 'configuration.endDate': null },
          { 'configuration.endDate': { $gte: now } }
        ]
      }
    ]
  })
}

// Find games by creator with pagination
gameSchema.statics.findByCreator = function(
  createdBy: string, 
  page: number = 1, 
  limit: number = 10
): Promise<{ games: Game[], total: number }> {
  const skip = (page - 1) * limit
  
  const gamesPromise = this.find({ createdBy })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .exec()
    
  const countPromise = this.countDocuments({ createdBy })
  
  return Promise.all([gamesPromise, countPromise]).then(([games, total]) => ({
    games,
    total
  }))
}

// Pre-save middleware for data validation and processing
// This runs before every save operation to ensure data integrity

gameSchema.pre('save', function(next) {
  // Auto-generate share link if game is being activated and has no share links
  if (this.isModified('status') && this.status === 'ACTIVE' && this.shareLinks.length === 0) {
    ;(this as any).generateShareLink()
  }
  


// Legacy hex-game validation removed — single-game system
  
  
  next()
})

// Create and export the model
// This creates the Mongoose model from the schema, handling model registration correctly
let GameModel: Model<Game>

try {
  // Try to retrieve existing model to prevent re-compilation in development
  GameModel = mongoose.model<Game>('Game')
} catch (error) {
  // Model doesn't exist yet, create it
  GameModel = mongoose.model<Game>('Game', gameSchema)
}

export default GameModel
