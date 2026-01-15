/**
 * Game State Types
 *
 * Defines the complete game state schema based on the layered world model:
 * Global/National → City → Neighborhood → Family (interface only)
 *
 * Rules:
 * - Pulses drift; events shock
 * - Effects propagate down easily, up slowly
 * - Players experience consequences before causes
 */

// ============================================================================
// Global / National Layer
// ============================================================================

/**
 * Global pulse - sets the political and media weather.
 * Not directly controllable by the player.
 * Update cadence: every 7-14 in-game days
 */
export interface GlobalPulse {
  /** 0-100: 0-20 lax, 21-50 baseline, 51-80 aggressive, 81-100 crisis */
  enforcementClimate: number;
  /** -100 to +100: -100 fatigue/sympathy, 0 neutral, +100 panic/scapegoating */
  mediaNarrative: number;
  /** -50 to +50: -50 rights-expansive, 0 mixed, +50 executive-deferential */
  judicialAlignment: number;
  /** 0-100: higher = sharper swings, more randomness */
  politicalVolatility: number;
}

export type GlobalEventType = "Executive" | "Judicial" | "Media" | "Security";

/**
 * Global events - rare, high-impact shocks at the national level.
 */
export interface GlobalEvent {
  id: string;
  type: GlobalEventType;
  /** 1-5: effects scale with magnitude and decay over duration */
  magnitude: 1 | 2 | 3 | 4 | 5;
  /** How long the event effects persist */
  durationDays: number;
  /** When the event started (in-game day) */
  startDay: number;
  /** Human-readable description */
  description: string;
}

// ============================================================================
// City Layer
// ============================================================================

/**
 * City pulse - interprets national pressure into local policy and tone.
 * Update cadence: every 3-7 days
 */
export interface CityPulse {
  /** 0-100: 0-20 resist, 21-50 passive, 51-80 quiet comply, 81-100 partner */
  federalCooperation: number;
  /** 0-100: low = siloed, high = integrated (faster surprise propagation) */
  dataDensity: number;
  /** 0-100: low = abandon quickly, high = absorb backlash */
  politicalCover: number;
  /** 0-100: low = thin safety net, high = rescue windows */
  civilSocietyCapacity: number;
  /** 0-100: high = delays, incompetence, absurd outcomes (cuts both ways) */
  bureaucraticInertia: number;
}

export type CityEventCategory = "Policy" | "Budget" | "Infrastructure" | "Media";

/**
 * City events - every 1-3 weeks.
 * Re-weight neighborhoods; do not target families directly.
 */
export interface CityEvent {
  id: string;
  category: CityEventCategory;
  /** 0-100: player comprehension level */
  visibility: number;
  /** Which neighborhoods are affected */
  impactRadius: "All" | string[];
  /** When the event started (in-game day) */
  startDay: number;
  /** Human-readable description */
  description: string;
}

// ============================================================================
// Neighborhood Layer
// ============================================================================

/**
 * Neighborhood pulse - primary playable surface.
 * Update cadence: daily
 */
export interface NeighborhoodPulse {
  /** 0-100: community trust level */
  trust: number;
  /** 0-100: suspicion level (NOT inverse of trust - both can be high) */
  suspicion: number;
  /** 0-100: visible enforcement presence */
  enforcementVisibility: number;
  /** 0-100: how dense/connected the community is */
  communityDensity: number;
  /** 0-100: economic stress level */
  economicPrecarity: number;
}

export type NeighborhoodEventType =
  | "Audit"
  | "Checkpoint"
  | "RaidRumor"
  | "Meeting"
  | "Detention";

export type NeighborhoodEventTarget =
  | "Family"
  | "Employer"
  | "School"
  | "Block";

/**
 * Neighborhood events - frequent, small-scale.
 * Severity controls scope, duration, and cross-system spillover.
 */
export interface NeighborhoodEvent {
  id: string;
  type: NeighborhoodEventType;
  /** 1-5: controls scope, duration, and cross-system spillover */
  severity: 1 | 2 | 3 | 4 | 5;
  target: NeighborhoodEventTarget;
  /** When the event started (in-game day) */
  startDay: number;
  /** Human-readable description */
  description: string;
}

// ============================================================================
// Neighborhood Definition
// ============================================================================

export interface Neighborhood {
  id: string;
  name: string;
  /** Archetype for narrative purposes */
  archetype: string;
  pulse: NeighborhoodPulse;
  /** Active events in this neighborhood */
  activeEvents: NeighborhoodEvent[];
}

// ============================================================================
// City Definition
// ============================================================================

export interface City {
  id: string;
  name: string;
  /** State abbreviation */
  state: string;
  pulse: CityPulse;
  neighborhoods: Neighborhood[];
  /** Active city-level events */
  activeEvents: CityEvent[];
}

// ============================================================================
// Family Interface (Impact Only)
// ============================================================================

/**
 * Family impact variables - influences neighborhoods indirectly.
 * No individual family member stats are defined.
 */
export interface FamilyImpact {
  /** 0-100: how noticeable the family is */
  visibility: number;
  /** 0-100: accumulated psychological pressure */
  stress: number;
  /** 0-100: ability to act together */
  cohesion: number;
  /** 0-100: community support level */
  trustNetworkStrength: number;
}

// ============================================================================
// Turn State
// ============================================================================

export type TurnPhase =
  | "Plan"
  | "PulseUpdate"
  | "Event"
  | "Decision"
  | "Consequence";

export interface TurnState {
  /** Current in-game day */
  day: number;
  /** Current phase within the turn */
  phase: TurnPhase;
  /** Week number (for weekly pulse updates) */
  week: number;
}

// ============================================================================
// Victory/Failure Conditions
// ============================================================================

export type GameOutcome =
  | "InProgress"
  | "Sanctuary"    // Built enough local protection
  | "Outlast"      // Survived until conditions changed
  | "Transform"    // Forced institutional retreat
  | "Failure";     // Family separated or worse

export interface GameResult {
  outcome: GameOutcome;
  /** How the game ended (if ended) */
  endingDescription?: string;
  /** Final day when game ended */
  endDay?: number;
}

// ============================================================================
// Complete Game State
// ============================================================================

export interface GameState {
  /** Session identifier */
  sessionId: string;
  /** When this game was created */
  createdAt: string;
  /** Last update timestamp */
  updatedAt: string;

  /** Current turn information */
  turn: TurnState;

  /** Global/National layer */
  global: {
    pulse: GlobalPulse;
    activeEvents: GlobalEvent[];
  };

  /** Current city (one at a time) */
  city: City;

  /** Current neighborhood the family is in */
  currentNeighborhoodId: string;

  /** Family state */
  family: FamilyImpact;

  /** Game result (in progress or ended) */
  result: GameResult;

  /** Random seed for deterministic event generation */
  seed: number;
}

// ============================================================================
// Default Values
// ============================================================================

export const DEFAULT_GLOBAL_PULSE: GlobalPulse = {
  enforcementClimate: 50,
  mediaNarrative: 0,
  judicialAlignment: 0,
  politicalVolatility: 30,
};

export const DEFAULT_CITY_PULSE: CityPulse = {
  federalCooperation: 50,
  dataDensity: 50,
  politicalCover: 50,
  civilSocietyCapacity: 50,
  bureaucraticInertia: 50,
};

export const DEFAULT_NEIGHBORHOOD_PULSE: NeighborhoodPulse = {
  trust: 50,
  suspicion: 30,
  enforcementVisibility: 30,
  communityDensity: 50,
  economicPrecarity: 50,
};

export const DEFAULT_FAMILY_IMPACT: FamilyImpact = {
  visibility: 30,
  stress: 20,
  cohesion: 70,
  trustNetworkStrength: 40,
};

export const DEFAULT_TURN_STATE: TurnState = {
  day: 1,
  phase: "Plan",
  week: 1,
};
