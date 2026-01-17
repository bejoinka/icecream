/**
 * Simulator API Types
 *
 * Shared types for the simulator API endpoints.
 */

import { GameState } from "@/types";

/** Response for GET /state */
export interface StateResponse {
  state: GameState | null;
  sessionId: string;
  isNew: boolean;
}

/** Request body for POST /next */
export interface NextRequest {
  /** Optional: skip directly to next turn instead of next phase */
  skipToNextTurn?: boolean;
}

/** Response for POST /next */
export interface NextResponse {
  state: GameState;
  phaseCompleted: string;
  newEvents: {
    global: number;
    city: number;
    neighborhood: number;
  };
  decision: {
    id: string;
    title: string;
    narrative: string;
    choices: Array<{
      id: string;
      label: string;
      description: string;
      unlocked: boolean;
    }>;
  } | null;
}

/** Request body for POST /choose */
export interface ChooseRequest {
  /** IDs of choices selected */
  choiceIds: string[];
}

/** Response for POST /choose */
export interface ChooseResponse {
  state: GameState;
  effectsApplied: {
    visibility?: number;
    stress?: number;
    cohesion?: number;
    trustNetworkStrength?: number;
  };
  ending: {
    type: "victory" | "failure" | null;
    victoryType?: string;
    reason?: string;
  };
}

/** Error response */
export interface ErrorResponse {
  error: string;
  message: string;
}
