/**
 * Validation Schemas
 * 
 * What: Zod schemas for validating API request payloads across all endpoints
 * Why: Ensures data integrity, prevents injection attacks, and provides type safety
 * 
 * Usage:
 *   import { participantSchema, gameCreateSchema } from '@/app/lib/validation/schemas'
 *   const result = participantSchema.safeParse(data)
 */

import { z } from 'zod'

// ============================================================================
// UTILITY SCHEMAS
// ============================================================================

/**
 * What: MongoDB ObjectId string format validation
 * Why: Ensures valid MongoDB IDs are provided in requests
 */
export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid MongoDB ObjectId format')

/**
 * What: UUID v4 format validation
 * Why: Validates participant UUIDs for referral tracking
 */
export const uuidSchema = z.string().uuid('Invalid UUID format')

/**
 * What: Email validation with standard RFC format
 * Why: Ensures valid email addresses for participant registration
 */
export const emailSchema = z.string().email('Invalid email address').max(255, 'Email too long')

/**
 * What: Phone number validation (international formats accepted)
 * Why: Validates phone numbers for participant contact
 */
export const phoneSchema = z.string()
  .min(10, 'Phone number too short')
  .max(20, 'Phone number too long')
  .regex(/^[\d\s\+\-\(\)]+$/, 'Invalid phone number format')

/**
 * What: Safe string validation (prevents XSS in basic form)
 * Why: Rejects strings with HTML/script tags
 */
export const safeStringSchema = z.string()
  .max(1000, 'Text too long')
  .refine(
    (val) => !/<script|<iframe|javascript:/i.test(val),
    'Invalid characters detected'
  )

// ============================================================================
// PARTICIPANT SCHEMAS
// ============================================================================

/**
 * What: Participant registration data validation
 * Why: Ensures valid participant data before creating database records
 * 
 * Rules:
 * - name is required (1-100 chars)
 * - email OR phone is required (at least one)
 * - uuid and referrerUuid are optional but must be valid UUID format if provided
 */
export const participantCreateSchema = z.object({
  name: safeStringSchema.min(1, 'Name is required').max(100, 'Name too long'),
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  uuid: uuidSchema.optional(),
  referrerUuid: uuidSchema.optional(),
}).refine(
  (data) => data.email || data.phone,
  { message: 'Either email or phone is required', path: ['email'] }
)

/**
 * What: Participant query parameters validation
 * Why: Validates search/filter parameters for participant listing
 */
export const participantQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  activeOnly: z.enum(['true', 'false']).default('false').transform(val => val === 'true'),
})

/**
 * What: Participant deletion validation
 * Why: Ensures valid participant ID for deletion operations
 */
export const participantDeleteSchema = z.object({
  id: objectIdSchema,
})

// ============================================================================
// AUTH SCHEMAS
// ============================================================================

/**
 * What: Admin login credentials validation
 * Why: Validates admin authentication requests
 */
export const adminLoginSchema = z.object({
  password: z.string().min(1, 'Password is required').max(255, 'Password too long'),
})

/**
 * What: Facebook authentication token validation
 * Why: Validates Facebook OAuth access tokens
 */
export const facebookAuthSchema = z.object({
  accessToken: z.string().min(1, 'Access token is required').max(500, 'Token too long'),
})

// ============================================================================
// GAME SCHEMAS
// ============================================================================

/**
 * What: Game status enum validation
 * Why: Ensures only valid game statuses are set
 */
export const gameStatusSchema = z.enum(['DRAFT', 'ACTIVE', 'PAUSED', 'COMPLETED', 'ARCHIVED'])

/**
 * What: Game type enum validation
 * Why: Restricts game creation to supported types (currently only QUIZZZ)
 */
export const gameTypeSchema = z.enum(['QUIZZZ'])

/**
 * What: Grid map type validation for Quizzz
 * Why: Validates coordinate system type (hex or square)
 */
export const gridMapTypeSchema = z.enum(['hex', 'square'])

/**
 * What: Hex coordinate validation
 * Why: Validates axial coordinates for hexagonal grids
 */
export const hexCoordSchema = z.object({
  q: z.number().int(),
  r: z.number().int(),
})

/**
 * What: Square coordinate validation
 * Why: Validates Cartesian coordinates for square grids
 */
export const squareCoordSchema = z.object({
  x: z.number().int(),
  y: z.number().int(),
})

/**
 * What: Quizzz answer validation
 * Why: Validates quiz answer structure (text + correctness flag)
 */
export const quizzzAnswerSchema = z.object({
  text: safeStringSchema.min(1, 'Answer text required').max(500, 'Answer too long'),
  isCorrect: z.boolean(),
})

/**
 * What: Quizzz question validation (exactly 3 answers)
 * Why: Validates quiz questions with required structure
 */
export const quizzzQuestionSchema = z.object({
  id: z.string().min(1, 'Question ID required'),
  text: safeStringSchema.min(1, 'Question text required').max(1000, 'Question too long'),
  answers: z.tuple([quizzzAnswerSchema, quizzzAnswerSchema, quizzzAnswerSchema])
    .refine(
      (answers) => answers.some(a => a.isCorrect),
      'At least one answer must be correct'
    ),
})

/**
 * What: Quizzz configuration validation
 * Why: Validates complete Quizzz game configuration
 */
export const quizzzConfigSchema = z.object({
  mapType: gridMapTypeSchema.optional(),
  mapName: z.string().max(100).optional(),
  selectedMaps: z.array(z.object({
    type: gridMapTypeSchema,
    name: z.string().max(100),
  })).optional(),
  randomizeSelectedMaps: z.boolean().optional(),
  rounds: z.number().int().min(1).max(50, 'Too many rounds'),
  targetCorrect: z.number().int().min(1).max(50, 'Target too high'),
  questions: z.array(quizzzQuestionSchema).min(1, 'At least one question required'),
  theme: z.enum(['default', 'minimal']).optional(),
  overlayBg: z.string().max(200).optional(),
  cardCoverImages: z.array(z.string().url()).optional(),
})

/**
 * What: Game creation validation
 * Why: Validates new game creation requests
 */
export const gameCreateSchema = z.object({
  title: safeStringSchema.min(1, 'Title is required').max(200, 'Title too long'),
  description: safeStringSchema.max(2000, 'Description too long').optional(),
  type: gameTypeSchema,
  status: gameStatusSchema.default('DRAFT'),
  configuration: z.object({
    quizzz: quizzzConfigSchema.optional(),
    platform: z.any().optional(), // Platform config is complex, validated separately if needed
  }),
  targetGroups: z.array(z.string().max(100)).optional(),
  maxAttemptsPerUser: z.number().int().min(1).max(100).default(3),
  isPublic: z.boolean().default(true),
})

/**
 * What: Game update validation
 * Why: Validates game update requests (partial updates allowed)
 */
export const gameUpdateSchema = gameCreateSchema.partial()

/**
 * What: Game query parameters validation
 * Why: Validates game listing/filtering parameters
 */
export const gameQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  status: gameStatusSchema.optional(),
  type: gameTypeSchema.optional(),
  search: z.string().max(100).optional(),
})

// ============================================================================
// GAME PLAY SCHEMAS
// ============================================================================

/**
 * What: Game play request validation (critical for anti-cheat)
 * Why: Validates gameplay actions to prevent cheating and data corruption
 */
export const gamePlaySchema = z.object({
  participant: z.object({
    name: safeStringSchema.min(1, 'Name required').max(100),
    email: emailSchema.optional(),
    phone: phoneSchema.optional(),
    uuid: uuidSchema.optional(),
  }).optional(), // May be populated by session middleware
  sessionId: z.string().max(100).optional(),
  hexagonId: z.string().max(100, 'Invalid hexagon ID'),
  roundIndex: z.number().int().min(0).optional(),
  selectionIndex: z.number().int().min(0).optional(),
  wasRed: z.boolean().optional(),
  type: z.string().max(50).optional(),
})

// ============================================================================
// MAP SCHEMAS
// ============================================================================

/**
 * What: Hex map creation validation
 * Why: Validates hex map data before storage
 */
export const hexMapCreateSchema = z.object({
  name: safeStringSchema.min(1, 'Name required').max(100, 'Name too long'),
  coords: z.array(hexCoordSchema).min(1, 'At least one coordinate required'),
  radius: z.number().int().min(1).max(24, 'Radius out of range'),
  tags: z.array(z.string().max(50)).optional(),
  backgroundImageUrl: z.string().url().max(500).optional(),
  isActive: z.boolean().default(true),
  fieldMask: z.array(hexCoordSchema).optional(),
})

/**
 * What: Square map creation validation
 * Why: Validates square map data before storage
 */
export const squareMapCreateSchema = z.object({
  name: safeStringSchema.min(1, 'Name required').max(100, 'Name too long'),
  coords: z.array(squareCoordSchema).min(1, 'At least one coordinate required'),
  radius: z.number().int().min(1).max(24, 'Radius out of range'),
  tags: z.array(z.string().max(50)).optional(),
  backgroundImageUrl: z.string().url().max(500).optional(),
  isActive: z.boolean().default(true),
  fieldMask: z.array(squareCoordSchema).optional(),
})

/**
 * What: Map query parameters validation
 * Why: Validates map search/filter parameters
 */
export const mapQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().max(100).optional(),
  tag: z.string().max(50).optional(),
  radius: z.coerce.number().int().min(1).max(24).optional(),
})

// ============================================================================
// SETTINGS SCHEMAS
// ============================================================================

/**
 * What: System settings validation
 * Why: Validates global system configuration updates
 */
export const settingsUpdateSchema = z.object({
  siteName: safeStringSchema.max(100).optional(),
  siteDescription: safeStringSchema.max(500).optional(),
  contactEmail: emailSchema.optional(),
  defaultMaxAttempts: z.number().int().min(1).max(100).optional(),
  defaultMaxFlips: z.number().int().min(1).max(50).optional(),
  requireRegistration: z.boolean().optional(),
  allowMultipleAttempts: z.boolean().optional(),
  showResults: z.boolean().optional(),
  enableRateLimit: z.boolean().optional(),
  maxRequestsPerMinute: z.number().int().min(1).max(1000).optional(),
  sessionTimeout: z.number().int().min(1).max(1440).optional(),
  emailNotifications: z.boolean().optional(),
  gameCompletionEmails: z.boolean().optional(),
  adminAlerts: z.boolean().optional(),
  theme: z.enum(['light', 'dark', 'auto']).optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  enableAnimations: z.boolean().optional(),
})

// ============================================================================
// TYPE EXPORTS (for use in application code)
// ============================================================================

/**
 * What: Infer TypeScript types from Zod schemas
 * Why: Single source of truth for types - schemas generate types automatically
 */
export type ParticipantCreate = z.infer<typeof participantCreateSchema>
export type ParticipantQuery = z.infer<typeof participantQuerySchema>
export type AdminLogin = z.infer<typeof adminLoginSchema>
export type FacebookAuth = z.infer<typeof facebookAuthSchema>
export type GameCreate = z.infer<typeof gameCreateSchema>
export type GameUpdate = z.infer<typeof gameUpdateSchema>
export type GameQuery = z.infer<typeof gameQuerySchema>
export type GamePlay = z.infer<typeof gamePlaySchema>
export type HexMapCreate = z.infer<typeof hexMapCreateSchema>
export type SquareMapCreate = z.infer<typeof squareMapCreateSchema>
export type MapQuery = z.infer<typeof mapQuerySchema>
export type SettingsUpdate = z.infer<typeof settingsUpdateSchema>
