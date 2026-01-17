/**
 * Game Loop Engine - Core turn execution logic
 *
 * This module provides the main game loop API, consolidating
 * turn processing, event generation, choice effects, pulse updates,
 * and victory condition checking into a single interface.
 *
 * The game loop operates on a turn-based system where each turn
 * represents one in-game day (~15 seconds real time).
 */

import {
  GameState,
  TurnPhase,
  Decision,
  Choice,
  ChoiceRecord,
  FamilyImpact,
  ActiveEvents,
  GameEvent,
  VictoryType,
  GameEnding,
  DEFAULT_MAX_TURNS,
} from "@/types";
import {
  GlobalPulse,
  CityPulse,
  NeighborhoodPulse,
  NeighborhoodEventTemplate,
  CityEventTemplate,
} from "@/types";
import {
  advancePhase,
  runCompleteTurn,
  checkGameEnding,
} from "@/engine/turn";
import {
  selectNeighborhoodEvent,
  selectCityEvent,
  selectGlobalEvent,
  applyEventEffects,
} from "@/engine/events";
import {
  updateAllPulses,
  WorldState,
  shouldUpdateGlobalPulse,
  shouldUpdateCityPulse,
} from "@/engine/pulse";

// Re-export from existing engine modules
export {
  advancePhase,
  runCompleteTurn,
  checkGameEnding,
} from "@/engine/turn";
export {
  selectNeighborhoodEvent,
  selectCityEvent,
  selectGlobalEvent,
  shouldTriggerNeighborhoodEvent,
  shouldTriggerCityEvent,
  shouldTriggerGlobalEvent,
  pruneExpiredEvents,
  applyEventEffects,
} from "@/engine/events";
export {
  updateAllPulses,
  updateGlobalPulse,
  updateCityPulse,
  updateNeighborhoodPulse,
  updateFamilyImpact,
  shouldUpdateGlobalPulse,
  shouldUpdateCityPulse,
} from "@/engine/pulse";

// =============================================================================
// CONTEXT TYPES
// =============================================================================

/**
 * Context required for turn execution
 */
export interface TurnContext {
  /** Available neighborhood event templates */
  neighborhoodEventTemplates: NeighborhoodEventTemplate[];
  /** Available city event templates */
  cityEventTemplates: CityEventTemplate[];
}

/**
 * Result of executing a turn
 */
export interface TurnResult {
  /** Updated game state */
  state: GameState;
  /** Which phase was completed */
  phaseCompleted: TurnPhase;
  /** Any new events triggered */
  newEvents: ActiveEvents;
  /** Decision awaiting player input (if any) */
  decision: Decision | null;
}

/**
 * Parameters for event generation
 */
export interface EventGenerationParams {
  /** Current turn number */
  turn: number;
  /** Pulse at relevant layer */
  pulse: GlobalPulse | CityPulse | NeighborhoodPulse;
  /** Neighborhood ID (for neighborhood events) */
  neighborhoodId?: string;
  /** Neighborhood IDs (for city events) */
  neighborhoodIds?: string[];
  /** Event templates to select from */
  templates?: NeighborhoodEventTemplate[] | CityEventTemplate[];
}

// =============================================================================
// EXECUTE TURN
// =============================================================================

/**
 * Execute a complete turn in the game loop
 *
 * This is the main entry point for turn execution. It processes:
 * 1. Plan phase - Player allocates family effort
 * 2. Pulse update phase - All pulse values drift based on game rules
 * 3. Event phase - Check for and apply triggered events
 * 4. Decision phase - Generate decision prompt if applicable
 * 5. Consequence phase - Apply player choice effects
 *
 * @param state - Current game state
 * @param ctx - Turn context with event templates
 * @param lastGlobalUpdate - Turn number of last global pulse update
 * @param selectedChoiceIds - Player's choice selections (if in decision phase)
 * @returns Updated game state after turn execution
 */
export function executeTurn(
  state: GameState,
  ctx: TurnContext,
  lastGlobalUpdate: number,
  selectedChoiceIds?: string[]
): TurnResult {
  // If we have selected choices, process the consequence phase
  if (selectedChoiceIds && state.phase === "decision" && state.currentDecision) {
    const newState = advancePhase(state, ctx, lastGlobalUpdate, selectedChoiceIds);
    return {
      state: newState,
      phaseCompleted: "consequence",
      newEvents: { global: [], city: [], neighborhood: [] },
      decision: null,
    };
  }

  // Run complete turn through all phases
  const newState = runCompleteTurn(state, ctx, lastGlobalUpdate);

  // Determine if new events were triggered
  const newEvents: ActiveEvents = {
    global: newState.activeEvents.global.filter(e => e.startTurn === newState.turn),
    city: newState.activeEvents.city.filter(e => e.startTurn === newState.turn),
    neighborhood: newState.activeEvents.neighborhood.filter(e => e.startTurn === newState.turn),
  };

  return {
    state: newState,
    phaseCompleted: newState.phase,
    newEvents,
    decision: newState.currentDecision,
  };
}

// =============================================================================
// GENERATE EVENT
// =============================================================================

/**
 * Generate an event based on current game conditions
 *
 * This is a unified event generation API that delegates to the
 * appropriate layer-specific event selector.
 *
 * @param params - Event generation parameters
 * @returns A generated event or null if no event triggered
 */
export function generateEvent(params: EventGenerationParams): GameEvent | null {
  // Determine event type based on pulse type
  if (isNeighborhoodPulse(params.pulse)) {
    if (!params.neighborhoodId || !params.templates) {
      return null;
    }
    return selectNeighborhoodEvent(
      params.templates as NeighborhoodEventTemplate[],
      params.pulse,
      params.neighborhoodId,
      params.turn
    );
  }

  if (isCityPulse(params.pulse)) {
    if (!params.templates || !params.neighborhoodIds) {
      return null;
    }
    return selectCityEvent(
      params.templates as CityEventTemplate[],
      params.pulse,
      params.turn,
      params.neighborhoodIds
    );
  }

  if (isGlobalPulse(params.pulse)) {
    return selectGlobalEvent(params.pulse, params.turn);
  }

  return null;
}

/** Type guard for NeighborhoodPulse */
function isNeighborhoodPulse(pulse: any): pulse is NeighborhoodPulse {
  return pulse && typeof pulse.trust === "number";
}

/** Type guard for CityPulse */
function isCityPulse(pulse: any): pulse is CityPulse {
  return pulse && typeof pulse.federalCooperation === "number";
}

/** Type guard for GlobalPulse */
function isGlobalPulse(pulse: any): pulse is GlobalPulse {
  return pulse && typeof pulse.enforcementClimate === "number";
}

// =============================================================================
// APPLY CHOICE EFFECTS
// =============================================================================

/**
 * Apply the effects of player choices to the family state
 *
 * @param family - Current family impact state
 * @param choices - Choices selected by the player
 * @returns Updated family impact state
 */
export function applyChoiceEffects(
  family: FamilyImpact,
  choices: Choice[]
): FamilyImpact {
  let result = { ...family };

  for (const choice of choices) {
    if (choice.effects) {
      result = applyEventEffects(result, choice.effects) as FamilyImpact;
    }
  }

  return result;
}

/**
 * Record a choice made by the player
 *
 * @param state - Current game state
 * @param decisionId - ID of the decision being made
 * @param choiceIds - IDs of selected choices
 * @returns Choice record for history
 */
export function recordChoice(
  state: GameState,
  decisionId: string,
  choiceIds: string[]
): ChoiceRecord {
  const decision = state.currentDecision;
  if (!decision) {
    throw new Error("No active decision to record");
  }

  const selectedChoices = decision.choices.filter(c => choiceIds.includes(c.id));

  return {
    turn: state.turn,
    decisionId,
    choiceIds,
    effects: selectedChoices.reduce(
      (acc, c) => ({ ...acc, ...c.effects }),
      {} as Partial<FamilyImpact>
    ),
  };
}

// =============================================================================
// UPDATE PULSES
// =============================================================================

/**
 * Update all pulses in the game world
 *
 * This is a unified API for pulse updates that handles:
 * - Global pulse (every 14-28 turns based on volatility)
 * - City pulse (every 7 turns)
 * - Neighborhood pulse (every turn)
 * - Family impact (every turn)
 *
 * @param state - Current game state
 * @param lastGlobalUpdate - Turn number of last global pulse update
 * @returns Updated game state with modified pulses
 */
export function updatePulses(
  state: GameState,
  lastGlobalUpdate: number
): GameState {
  const worldState: WorldState = {
    global: state.globalPulse,
    city: state.city.pulse,
    neighborhoods: state.city.neighborhoods.map(n => ({
      id: n.id,
      pulse: n.pulse,
    })),
    family: state.family,
  };

  const result = updateAllPulses(
    worldState,
    state.turn,
    lastGlobalUpdate,
    state.city.currentNeighborhoodId
  );

  return {
    ...state,
    globalPulse: result.global,
    city: {
      ...state.city,
      pulse: result.city,
      neighborhoods: state.city.neighborhoods.map(n => {
        const updated = result.neighborhoods.find(rn => rn.id === n.id);
        return updated ? { ...n, pulse: updated.pulse } : n;
      }),
    },
    family: result.family,
  };
}

/**
 * Check if any pulses should update this turn
 *
 * @param state - Current game state
 * @param lastGlobalUpdate - Turn number of last global pulse update
 * @returns Object indicating which layers will update
 */
export function checkPulseUpdates(
  state: GameState,
  lastGlobalUpdate: number
): { global: boolean; city: boolean; neighborhood: boolean; family: boolean } {
  return {
    global: shouldUpdateGlobalPulse(state.turn, lastGlobalUpdate, state.globalPulse.politicalVolatility),
    city: shouldUpdateCityPulse(state.turn),
    neighborhood: true, // Always updates
    family: true, // Always updates
  };
}

// =============================================================================
// CHECK VICTORY CONDITIONS
// =============================================================================

/**
 * Check if victory or failure conditions have been met
 *
 * Victory types:
 * - "sanctuary": High local protection (trust, community, network)
 * - "outlast": Survive all turns with improved conditions
 * - "transform": Systemic change at city/global level
 *
 * Failure reasons:
 * - Family stress too high with low cohesion
 * - Detention (triggered by specific events)
 * - Turn limit reached without improvement
 *
 * @param state - Current game state
 * @returns Updated game state with ending set if conditions met, otherwise unchanged
 */
export function checkVictoryConditions(state: GameState): GameState {
  return checkGameEnding(state);
}

/**
 * Get detailed victory/defeat status without modifying state
 *
 * @param state - Current game state
 * @returns Game ending information or null if game continues
 */
export function getGameStatus(state: GameState): GameEnding {
  // Failure: family stress too high for too long
  if (state.family.stress >= 95 && state.family.cohesion <= 10) {
    return {
      type: "failure",
      reason: "Family could not endure the pressure.",
      turn: state.turn,
    };
  }

  // Failure: turn limit reached without improvement
  if (state.turn >= state.maxTurns) {
    if (state.globalPulse.enforcementClimate >= 60) {
      return {
        type: "failure",
        reason: "The pressure did not relent in time.",
        turn: state.turn,
      };
    }
  }

  // Victory: Outlast (survive all turns)
  if (state.turn >= state.maxTurns) {
    if (state.globalPulse.enforcementClimate < 40) {
      return {
        type: "victory",
        victoryType: "outlast",
        turn: state.turn,
      };
    }
  }

  // Victory: Sanctuary (high local protection)
  const currentNeighborhood = state.city.neighborhoods.find(
    n => n.id === state.city.currentNeighborhoodId
  );
  if (
    currentNeighborhood &&
    currentNeighborhood.pulse.trust >= 80 &&
    currentNeighborhood.pulse.communityDensity >= 70 &&
    state.family.trustNetworkStrength >= 80
  ) {
    return {
      type: "victory",
      victoryType: "sanctuary",
      turn: state.turn,
    };
  }

  // Victory: Transform (systemic change)
  if (
    state.city.pulse.politicalCover >= 80 &&
    state.city.pulse.federalCooperation <= 20 &&
    state.globalPulse.mediaNarrative <= -50
  ) {
    return {
      type: "victory",
      victoryType: "transform",
      turn: state.turn,
    };
  }

  return null;
}

/**
 * Check if a specific victory type is achievable
 *
 * @param state - Current game state
 * @param victoryType - Type of victory to check
 * @returns Progress toward victory (0-100)
 */
export function getVictoryProgress(
  state: GameState,
  victoryType: VictoryType
): number {
  switch (victoryType) {
    case "sanctuary": {
      const currentNeighborhood = state.city.neighborhoods.find(
        n => n.id === state.city.currentNeighborhoodId
      );
      if (!currentNeighborhood) return 0;

      const trustScore = (currentNeighborhood.pulse.trust / 80) * 100;
      const communityScore = (currentNeighborhood.pulse.communityDensity / 70) * 100;
      const networkScore = (state.family.trustNetworkStrength / 80) * 100;

      return Math.min(100, (trustScore + communityScore + networkScore) / 3);
    }

    case "outlast": {
      // Progress based on turns survived and enforcement climate improvement
      const turnProgress = (state.turn / state.maxTurns) * 100;
      const climateProgress = ((100 - state.globalPulse.enforcementClimate) / 60) * 100;
      return Math.min(100, (turnProgress + climateProgress) / 2);
    }

    case "transform": {
      const coverScore = (state.city.pulse.politicalCover / 80) * 100;
      const resistanceScore = ((100 - state.city.pulse.federalCooperation) / 80) * 100;
      const narrativeScore = ((-state.globalPulse.mediaNarrative) / 50) * 100;

      return Math.min(100, (coverScore + resistanceScore + narrativeScore) / 3);
    }

    default:
      return 0;
  }
}

// =============================================================================
// GAME LOOP ORCHESTRATOR
// =============================================================================

/**
 * Main game loop orchestrator
 *
 * Runs the complete game loop for a turn:
 * 1. Update pulses
 * 2. Generate and apply events
 * 3. Check victory conditions
 * 4. Execute turn phases
 *
 * @param state - Current game state
 * @param ctx - Turn context
 * @param lastGlobalUpdate - Turn number of last global pulse update
 * @param selectedChoiceIds - Optional player choices
 * @returns Complete turn result
 */
export function runGameLoop(
  state: GameState,
  ctx: TurnContext,
  lastGlobalUpdate: number,
  selectedChoiceIds?: string[]
): TurnResult {
  // Update pulses first
  let updatedState = updatePulses(state, lastGlobalUpdate);

  // Execute turn phases
  const turnResult = executeTurn(updatedState, ctx, lastGlobalUpdate, selectedChoiceIds);

  // Check victory conditions
  const finalState = checkVictoryConditions(turnResult.state);

  return {
    ...turnResult,
    state: finalState,
  };
}

/**
 * Create a new game state with default values
 *
 * @param sessionId - Unique session identifier
 * @param cityId - Starting city ID
 * @param maxTurns - Maximum turns before game ends
 * @returns Fresh game state
 */
export function createInitialGameState(
  sessionId: string,
  cityId: string,
  maxTurns: number = DEFAULT_MAX_TURNS
): Partial<GameState> {
  return {
    sessionId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    turn: 1,
    phase: "plan",
    maxTurns,
    ending: null,
    choiceHistory: [],
    rightsKnowledge: [],
    currentDecision: null,
  };
}
