/**
 * Game Loop Orchestrator
 *
 * Main orchestrator that coordinates the turn-based game loop:
 * - Pulse updates across all world layers
 * - Event generation and application
 * - Player choice processing
 * - Victory/failure condition checking
 *
 * This module provides a clean API over the lower-level engine functions.
 */

import {
  GameState,
  TurnPhase,
  Decision,
  Choice,
  FamilyImpact,
  ActiveEvents,
  DEFAULT_MAX_TURNS,
} from "@/types";
import { CityProfile } from "@/types/city";
import { DEFAULT_GLOBAL_PULSE, DEFAULT_FAMILY_IMPACT } from "@/types/pulse";
import { updateAllPulses, WorldState } from "@/engine/pulse";
import {
  shouldTriggerNeighborhoodEvent,
  shouldTriggerCityEvent,
  shouldTriggerGlobalEvent,
  selectNeighborhoodEvent,
  selectCityEvent,
  selectGlobalEvent,
  pruneExpiredEvents,
  applyGlobalEventEffects,
  applyCityEventEffects,
  applyNeighborhoodEventEffects,
} from "@/engine/events";

// =============================================================================
// GAME LOOP CONFIG
// =============================================================================

export interface GameLoopConfig {
  /** Max turns before game ends */
  maxTurns?: number;
  /** Seed for deterministic random generation */
  seed?: number;
  /** Whether to enable debug logging */
  debug?: boolean;
}

// =============================================================================
// TURN EXECUTION
// =============================================================================

export interface TurnResult {
  /** Updated game state */
  state: GameState;
  /** New events generated this turn */
  newEvents: ActiveEvents;
  /** Decision awaiting player input (if any) */
  pendingDecision: Decision | null;
  /** Whether the game has ended */
  gameEnded: boolean;
}

/**
 * Execute a single turn's orchestration:
 * 1. Update pulses (conditional based on cadence)
 * 2. Check for and generate events
 * 3. Check victory/failure conditions
 *
 * @param state - Current game state
 * @param cityProfile - City profile for event templates
 * @param lastGlobalUpdate - Turn number of last global pulse update
 * @returns Turn result with updated state and any pending decision
 */
export function executeTurn(
  state: GameState,
  cityProfile: CityProfile,
  lastGlobalUpdate: number
): TurnResult {
  let newState = { ...state };
  const newEvents: ActiveEvents = { global: [], city: [], neighborhood: [] };

  // Step 0: Plan phase transitions to pulse_update
  if (state.phase === "plan") {
    newState = { ...newState, phase: "pulse_update" };
    // Continue to pulse_update processing
  }

  // Step 1: Pulse Updates (if this turn phase requires it)
  if (newState.phase === "pulse_update") {
    const worldState: WorldState = {
      global: state.globalPulse,
      city: state.city.pulse,
      neighborhoods: state.city.neighborhoods.map((n) => ({
        id: n.id,
        pulse: n.pulse,
      })),
      family: state.family,
    };

    const pulseResult = updateAllPulses(
      worldState,
      state.turn,
      lastGlobalUpdate,
      state.city.currentNeighborhoodId
    );

    newState = {
      ...newState,
      globalPulse: pulseResult.global,
      city: {
        ...newState.city,
        pulse: pulseResult.city,
        neighborhoods: newState.city.neighborhoods.map((n) => {
          const updated = pulseResult.neighborhoods.find((rn) => rn.id === n.id);
          return updated ? { ...n, pulse: updated.pulse } : n;
        }),
      },
      family: pulseResult.family,
      phase: "event",
    };
  }

  // Step 2: Event Phase
  if (newState.phase === "event") {
    let activeEvents = pruneExpiredEvents(newState.activeEvents, newState.turn);

    // Check for global event
    if (shouldTriggerGlobalEvent(newState.globalPulse)) {
      const event = selectGlobalEvent(newState.globalPulse, newState.turn);
      if (event) {
        activeEvents.global.push(event);
        newEvents.global.push(event);
        newState.globalPulse = applyGlobalEventEffects(
          newState.globalPulse,
          event.effects
        );
      }
    }

    // Check for city event
    if (shouldTriggerCityEvent(newState.turn, newState.city.pulse)) {
      const event = selectCityEvent(
        cityProfile.eventPool,
        newState.city.pulse,
        newState.turn,
        newState.city.neighborhoods.map((n) => n.id)
      );
      if (event) {
        activeEvents.city.push(event);
        newEvents.city.push(event);
        newState.city = {
          ...newState.city,
          pulse: applyCityEventEffects(newState.city.pulse, event.effects),
        };
      }
    }

    // Check for neighborhood event
    const currentNeighborhood = newState.city.neighborhoods.find(
      (n) => n.id === newState.city.currentNeighborhoodId
    );
    if (
      currentNeighborhood &&
      shouldTriggerNeighborhoodEvent(currentNeighborhood.pulse)
    ) {
      const event = selectNeighborhoodEvent(
        cityProfile.neighborhoods
          .find((n) => n.id === currentNeighborhood.id)
          ?.eventPool || [],
        currentNeighborhood.pulse,
        currentNeighborhood.id,
        newState.turn
      );
      if (event) {
        activeEvents.neighborhood.push(event);
        newEvents.neighborhood.push(event);
        // Update neighborhood pulse
        newState.city.neighborhoods = newState.city.neighborhoods.map((n) => {
          if (n.id === event.neighborhoodId) {
            return {
              ...n,
              pulse: applyNeighborhoodEventEffects(n.pulse, event.effects),
            };
          }
          return n;
        });
      }
    }

    newState = {
      ...newState,
      activeEvents,
      phase: "decision",
    };
  }

  // Step 3: Decision Phase
  if (newState.phase === "decision") {
    const recentNeighborhoodEvent = newState.activeEvents.neighborhood.find(
      (e) => e.startTurn === newState.turn
    );

    if (recentNeighborhoodEvent) {
      const decision = generateEventDecision(recentNeighborhoodEvent, newState);
      newState = {
        ...newState,
        currentDecision: decision,
      };
      return {
        state: newState,
        newEvents,
        pendingDecision: decision,
        gameEnded: false,
      };
    }

    newState = {
      ...newState,
      currentDecision: null,
      phase: "consequence",
    };
  }

  // Step 4: Consequence Phase (if no decision needed)
  if (newState.phase === "consequence") {
    newState = {
      ...newState,
      turn: newState.turn + 1,
      phase: "plan",
      currentDecision: null,
    };
  }

  // Step 5: Check victory/failure conditions
  newState = checkVictoryConditions(newState);

  return {
    state: newState,
    newEvents,
    pendingDecision: newState.currentDecision,
    gameEnded: newState.ending !== null,
  };
}

// =============================================================================
// EVENT GENERATION
// =============================================================================

/**
 * Generate a decision prompt based on a neighborhood event.
 * This is a wrapper around the event system to create player-facing decisions.
 *
 * @param event - The neighborhood event that triggered this decision
 * @param state - Current game state
 * @returns A decision object with choices for the player
 */
export function generateEventDecision(
  event: ActiveEvents["neighborhood"][0],
  state: GameState
): Decision {
  const baseChoices: Choice[] = [];

  switch (event.type) {
    case "Checkpoint":
      baseChoices.push(
        {
          id: "comply",
          label: "Comply fully",
          description: "Present documentation and answer questions.",
          effects: { visibility: 5, stress: 10 },
        },
        {
          id: "assert_rights",
          label: "Assert your rights",
          description:
            "Politely decline to answer questions beyond what's legally required.",
          effects: { visibility: 10, stress: 15, cohesion: 5 },
          unlockConditions: { requiredChoices: ["learn_rights_basic"] },
        },
        {
          id: "avoid",
          label: "Try to avoid",
          description: "Change your route to bypass the checkpoint.",
          effects: { visibility: -5, stress: 5 },
        }
      );
      break;

    case "RaidRumor":
      baseChoices.push(
        {
          id: "stay_home",
          label: "Stay home",
          description: "Keep a low profile until things calm down.",
          effects: { visibility: -10, stress: 15, cohesion: -5 },
        },
        {
          id: "warn_others",
          label: "Warn your network",
          description: "Alert neighbors and community members.",
          effects: { visibility: 5, trustNetworkStrength: 10, cohesion: 5 },
        },
        {
          id: "continue_normal",
          label: "Continue as normal",
          description: "Go about your day without changing routine.",
          effects: { stress: 5 },
        }
      );
      break;

    case "Audit":
      baseChoices.push(
        {
          id: "provide_documents",
          label: "Provide all documents",
          description: "Give them everything they ask for.",
          effects: { visibility: 10, stress: 10 },
        },
        {
          id: "request_lawyer",
          label: "Request a lawyer",
          description:
            "Ask for legal representation before proceeding.",
          effects: { visibility: 5, stress: 20, cohesion: 5 },
          unlockConditions: { requiredChoices: ["learn_rights_legal"] },
        }
      );
      break;

    case "Meeting":
      baseChoices.push(
        {
          id: "attend",
          label: "Attend the meeting",
          description: "Participate in the community gathering.",
          effects: {
            visibility: 5,
            trustNetworkStrength: 15,
            stress: -5,
            cohesion: 5,
          },
        },
        {
          id: "skip",
          label: "Skip it",
          description: "You have other priorities right now.",
          effects: { trustNetworkStrength: -5 },
        }
      );
      break;

    case "Detention":
      baseChoices.push(
        {
          id: "seek_help",
          label: "Seek legal help immediately",
          description: "Contact a lawyer and community organizations.",
          effects: { stress: 25, trustNetworkStrength: 5 },
        },
        {
          id: "stay_silent",
          label: "Remain silent",
          description: "Exercise your right to remain silent.",
          effects: { stress: 30 },
          unlockConditions: { requiredChoices: ["learn_rights_basic"] },
        }
      );
      break;

    default:
      // Default choices for unknown event types
      baseChoices.push(
        {
          id: "accept",
          label: "Accept the situation",
          description: "Deal with what comes.",
          effects: { stress: 10 },
        }
      );
  }

  return {
    id: `decision_${event.id}`,
    title: event.title,
    narrative: event.description,
    choices: baseChoices,
    multiSelect: false,
    triggerEventId: event.id,
  };
}

// =============================================================================
// CHOICE EFFECTS
// =============================================================================

/**
 * Apply the effects of player choices to family state.
 *
 * @param family - Current family state
 * @param choice - The choice whose effects should be applied
 * @returns Updated family state
 */
export function applyChoiceEffects(
  family: FamilyImpact,
  choice: Choice
): FamilyImpact {
  const result = { ...family };

  for (const [key, value] of Object.entries(choice.effects)) {
    if (typeof value === "number" && key in result) {
      const k = key as keyof FamilyImpact;
      const currentValue = result[k];
      if (typeof currentValue === "number") {
        // Clamp values between 0 and 100
        (result[k] as number) = Math.max(0, Math.min(100, currentValue + value));
      }
    }
  }

  return result;
}

/**
 * Apply multiple choice effects (for multi-select decisions).
 *
 * @param family - Current family state
 * @param choices - Array of choices whose effects should be applied
 * @returns Updated family state
 */
export function applyMultipleChoiceEffects(
  family: FamilyImpact,
  choices: Choice[]
): FamilyImpact {
  return choices.reduce((acc, choice) => applyChoiceEffects(acc, choice), family);
}

// =============================================================================
// PULSE UPDATE WRAPPER
// =============================================================================

/**
 * Wrapper for updating all pulses in the game state.
 * This provides a simplified interface over the engine's pulse update system.
 *
 * @param state - Current game state
 * @param lastGlobalUpdate - Turn number of last global pulse update
 * @returns Updated game state with all pulses updated
 */
export function updatePulses(
  state: GameState,
  lastGlobalUpdate: number
): GameState {
  const worldState: WorldState = {
    global: state.globalPulse,
    city: state.city.pulse,
    neighborhoods: state.city.neighborhoods.map((n) => ({
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
      neighborhoods: state.city.neighborhoods.map((n) => {
        const updated = result.neighborhoods.find((rn) => rn.id === n.id);
        return updated ? { ...n, pulse: updated.pulse } : n;
      }),
    },
    family: result.family,
  };
}

// =============================================================================
// VICTORY CONDITIONS
// =============================================================================

export type VictoryType = "sanctuary" | "outlast" | "transform";

export interface GameEnding {
  type: "victory" | "failure";
  victoryType?: VictoryType;
  reason?: string;
  turn: number;
}

/**
 * Check victory and failure conditions.
 *
 * Victory conditions:
 * - Sanctuary: High trust, community density, and trust network
 * - Outlast: Survive all turns with improved enforcement climate
 * - Transform: High political cover, low federal cooperation, positive media narrative
 *
 * Failure conditions:
 * - Family stress too high (95+) with cohesion too low (10-)
 * - Max turns reached without victory
 *
 * @param state - Current game state
 * @returns Updated game state with ending set if conditions met
 */
export function checkVictoryConditions<S extends GameState>(
  state: S
): S {
  // Already ended
  if (state.ending) {
    return state;
  }

  // Failure: family stress too high with low cohesion
  if (state.family.stress >= 95 && state.family.cohesion <= 10) {
    return {
      ...state,
      ending: {
        type: "failure",
        reason: "Family could not endure the pressure.",
        turn: state.turn,
      },
    } as S & { ending: GameEnding };
  }

  // Failure: max turns reached without other victory conditions met
  if (state.turn >= state.maxTurns) {
    // Check if conditions improved enough for outlast victory
    if (state.globalPulse.enforcementClimate < 40) {
      return {
        ...state,
        ending: {
          type: "victory",
          victoryType: "outlast",
          turn: state.turn,
        },
      } as S & { ending: GameEnding };
    }
    // Otherwise, it's a failure
    return {
      ...state,
      ending: {
        type: "failure",
        reason: "Time ran out without achieving safety.",
        turn: state.turn,
      },
    } as S & { ending: GameEnding };
  }

  // Victory: Sanctuary (high local protection)
  const currentNeighborhood = state.city.neighborhoods.find(
    (n) => n.id === state.city.currentNeighborhoodId
  );
  if (
    currentNeighborhood &&
    currentNeighborhood.pulse.trust >= 80 &&
    currentNeighborhood.pulse.communityDensity >= 70 &&
    state.family.trustNetworkStrength >= 80
  ) {
    return {
      ...state,
      ending: {
        type: "victory",
        victoryType: "sanctuary",
        turn: state.turn,
      },
    } as S & { ending: GameEnding };
  }

  // Victory: Transform (systemic change)
  if (
    state.city.pulse.politicalCover >= 80 &&
    state.city.pulse.federalCooperation <= 20 &&
    state.globalPulse.mediaNarrative <= -50
  ) {
    return {
      ...state,
      ending: {
        type: "victory",
        victoryType: "transform",
        turn: state.turn,
      },
    } as S & { ending: GameEnding };
  }

  return state;
}

// =============================================================================
// GAME LOOP EXECUTION
// =============================================================================

export interface GameLoopResult {
  /** Final game state */
  finalState: GameState;
  /** Total turns played */
  totalTurns: number;
  /** All decisions presented to player */
  decisions: Decision[];
  /** Game ending (if ended) */
  ending: GameEnding | null;
}

/**
 * Run the game loop until a decision is needed or game ends.
 * This is useful for auto-playing turns when no player input is required.
 *
 * @param initialState - Starting game state
 * @param cityProfile - City profile for event generation
 * @param config - Game loop configuration
 * @returns Game loop result with final state and decisions
 */
export function runGameLoop(
  initialState: GameState,
  cityProfile: CityProfile,
  config: GameLoopConfig = {}
): GameLoopResult {
  const maxTurns = config.maxTurns ?? initialState.maxTurns;
  let state = { ...initialState };
  const decisions: Decision[] = [];
  let lastGlobalUpdate = 0;
  let turnsWithoutDecision = 0;
  const MAX_TURNS_WITHOUT_DECISION = 100; // Safety limit

  while (state.turn < maxTurns && !state.ending && turnsWithoutDecision < MAX_TURNS_WITHOUT_DECISION) {
    // Set phase to pulse_update for new turn
    if (state.phase === "plan") {
      state = { ...state, phase: "pulse_update" };
    }

    const result = executeTurn(state, cityProfile, lastGlobalUpdate);

    // Track if global pulse was updated
    if (
      result.state.globalPulse !== state.globalPulse ||
      result.state.city.pulse !== state.city.pulse
    ) {
      lastGlobalUpdate = result.state.turn;
    }

    if (result.pendingDecision) {
      decisions.push(result.pendingDecision);
      break; // Stop and wait for player input
    }

    state = result.state;
    turnsWithoutDecision++;

    // Reset to plan phase for next turn if still playing
    if (!result.gameEnded && state.phase === "consequence") {
      state = { ...state, phase: "plan", turn: state.turn + 1 };
    }
  }

  return {
    finalState: state,
    totalTurns: state.turn,
    decisions,
    ending: state.ending
      ? {
          type: state.ending.type,
          victoryType: state.ending.type === "victory" ? state.ending.victoryType : undefined,
          reason: state.ending.type === "failure" ? state.ending.reason : undefined,
          turn: state.ending.turn,
        }
      : null,
  };
}

// =============================================================================
// INITIAL STATE CREATION
// =============================================================================

/**
 * Create the initial game state for a new session.
 *
 * @param cityProfile - City profile to use for the game
 * @param config - Game configuration
 * @returns Fresh game state ready to play
 */
export function createInitialGameState(
  cityProfile: CityProfile,
  config: GameLoopConfig = {}
): GameState {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const now = new Date().toISOString();
  const maxTurns = config.maxTurns ?? DEFAULT_MAX_TURNS;

  // Select first neighborhood as starting point
  const firstNeighborhood = cityProfile.neighborhoods[0];

  return {
    sessionId,
    createdAt: now,
    updatedAt: now,

    turn: 1,
    phase: "plan",
    maxTurns,

    globalPulse: { ...DEFAULT_GLOBAL_PULSE },

    city: {
      id: cityProfile.id,
      name: cityProfile.name,
      state: cityProfile.state,
      pulse: { ...cityProfile.pulse },
      neighborhoods: cityProfile.neighborhoods.map((n) => ({
        id: n.id,
        name: n.name,
        pulse: { ...n.pulse },
      })),
      currentNeighborhoodId: firstNeighborhood.id,
    },

    family: { ...DEFAULT_FAMILY_IMPACT },

    activeEvents: {
      global: [],
      city: [],
      neighborhood: [],
    },

    currentDecision: null,

    choiceHistory: [],

    rightsKnowledge: [],

    ending: null,
  };
}
