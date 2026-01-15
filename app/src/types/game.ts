/**
 * Complete Game State Types
 * Stored in Redis per session
 */

import { GlobalPulse, CityPulse, NeighborhoodPulse, FamilyImpact } from "./pulse";
import { ActiveEvents, GlobalEvent, CityEvent, NeighborhoodEvent } from "./event";
import { CityProfile, Neighborhood } from "./city";

/** Turn phases in the game loop */
export type TurnPhase =
  | "plan"
  | "pulse_update"
  | "event"
  | "decision"
  | "consequence";

/** Victory condition types */
export type VictoryType = "sanctuary" | "outlast" | "transform";

/** Game ending state */
export type GameEnding =
  | { type: "victory"; victoryType: VictoryType; turn: number }
  | { type: "failure"; reason: string; turn: number }
  | null;

/** Player choice in a decision */
export interface Choice {
  id: string;
  label: string;
  description: string;
  /** Whether this is a multi-select option */
  multiSelect?: boolean;
  /** Conditions required to unlock this choice */
  unlockConditions?: ChoiceUnlockConditions;
  /** Effects on family variables if chosen */
  effects: Partial<FamilyImpact>;
  /** Additional narrative consequences */
  consequences?: string[];
}

/** Conditions that must be met to unlock a choice */
export interface ChoiceUnlockConditions {
  minTurn?: number;
  maxStress?: number;
  minCohesion?: number;
  minTrustNetwork?: number;
  maxVisibility?: number;
  /** Previous choices that must have been made */
  requiredChoices?: string[];
  /** Rights knowledge required */
  rightsKnowledge?: string[];
}

/** A decision prompt presented to the player */
export interface Decision {
  id: string;
  title: string;
  narrative: string;
  choices: Choice[];
  /** Whether multiple choices can be selected */
  multiSelect: boolean;
  /** Time pressure (turns until auto-resolve) */
  urgency?: number;
  /** Related event that triggered this decision */
  triggerEventId?: string;
}

/** Record of a choice made by the player */
export interface ChoiceRecord {
  turn: number;
  decisionId: string;
  choiceIds: string[];
  effects: Partial<FamilyImpact>;
}

/** Current neighborhood state (pulse + active events) */
export interface NeighborhoodState {
  id: string;
  name: string;
  pulse: NeighborhoodPulse;
}

/** Current city state */
export interface CityState {
  id: string;
  name: string;
  state: string;
  pulse: CityPulse;
  neighborhoods: NeighborhoodState[];
  /** Currently selected neighborhood */
  currentNeighborhoodId: string;
}

/** Complete game state stored in Redis */
export interface GameState {
  /** Session metadata */
  sessionId: string;
  createdAt: string;
  updatedAt: string;

  /** Turn tracking */
  turn: number;
  phase: TurnPhase;
  maxTurns: number; // ~80 for 20 min session

  /** World state */
  globalPulse: GlobalPulse;
  city: CityState;

  /** Family state */
  family: FamilyImpact;

  /** Active events by layer */
  activeEvents: ActiveEvents;

  /** Current decision (if in decision phase) */
  currentDecision: Decision | null;

  /** History of choices made */
  choiceHistory: ChoiceRecord[];

  /** Rights knowledge unlocked */
  rightsKnowledge: string[];

  /** Game ending (null if game in progress) */
  ending: GameEnding;
}

/** Parameters for starting a new game */
export interface NewGameParams {
  cityId: string;
  /** Optional difficulty modifiers */
  difficulty?: {
    /** Identity factors that act as multipliers */
    identityFactors?: string[];
  };
}

/** Update cadence constants */
export const UPDATE_CADENCE = {
  /** Neighborhood pulse updates every turn */
  NEIGHBORHOOD: 1,
  /** City pulse updates every 7 turns */
  CITY: 7,
  /** Global pulse updates every 14-28 turns */
  GLOBAL_MIN: 14,
  GLOBAL_MAX: 28,
} as const;

/** Default game length in turns */
export const DEFAULT_MAX_TURNS = 80;
