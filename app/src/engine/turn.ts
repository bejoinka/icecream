/**
 * Turn State Machine
 *
 * Phases: Plan → Pulse Update → Event → Decision → Consequence
 * Each turn represents one in-game day (~15 seconds real time)
 */

import {
  GameState,
  TurnPhase,
  Decision,
  Choice,
  ChoiceRecord,
  FamilyImpact,
  ActiveEvents,
  DEFAULT_MAX_TURNS,
} from "@/types";
import { updateAllPulses, WorldState } from "./pulse";
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
  applyEventEffects,
} from "./events";
import { NeighborhoodEventTemplate, CityEventTemplate } from "@/types/city";

// =============================================================================
// PHASE TRANSITIONS
// =============================================================================

const PHASE_ORDER: TurnPhase[] = [
  "plan",
  "pulse_update",
  "event",
  "decision",
  "consequence",
];

function nextPhase(current: TurnPhase): TurnPhase {
  const idx = PHASE_ORDER.indexOf(current);
  if (idx === PHASE_ORDER.length - 1) {
    return "plan"; // Loop back to plan for next turn
  }
  return PHASE_ORDER[idx + 1];
}

// =============================================================================
// TURN PROCESSOR
// =============================================================================

export interface TurnContext {
  neighborhoodEventTemplates: NeighborhoodEventTemplate[];
  cityEventTemplates: CityEventTemplate[];
}

export interface TurnResult {
  state: GameState;
  phaseCompleted: TurnPhase;
  newEvents: ActiveEvents;
  decision: Decision | null;
}

/**
 * Process the plan phase
 * Player allocates family effort (future: work, care, advocacy, rest)
 * For now, this is a pass-through
 */
function processPlanPhase(state: GameState): GameState {
  return {
    ...state,
    phase: "pulse_update",
  };
}

/**
 * Process the pulse update phase
 * All pulse values drift based on game rules
 */
function processPulseUpdatePhase(
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
    phase: "event",
  };
}

/**
 * Process the event phase
 * Check for and apply any triggered events
 */
function processEventPhase(state: GameState, ctx: TurnContext): GameState {
  let activeEvents = pruneExpiredEvents(state.activeEvents, state.turn);
  const newEvents: ActiveEvents = { global: [], city: [], neighborhood: [] };

  // Check for global event
  if (shouldTriggerGlobalEvent(state.globalPulse)) {
    const event = selectGlobalEvent(state.globalPulse, state.turn);
    if (event) {
      activeEvents.global.push(event);
      newEvents.global.push(event);
    }
  }

  // Check for city event
  if (shouldTriggerCityEvent(state.turn, state.city.pulse)) {
    const event = selectCityEvent(
      ctx.cityEventTemplates,
      state.city.pulse,
      state.turn,
      state.city.neighborhoods.map((n) => n.id)
    );
    if (event) {
      activeEvents.city.push(event);
      newEvents.city.push(event);
    }
  }

  // Check for neighborhood event
  const currentNeighborhood = state.city.neighborhoods.find(
    (n) => n.id === state.city.currentNeighborhoodId
  );
  if (currentNeighborhood && shouldTriggerNeighborhoodEvent(currentNeighborhood.pulse)) {
    const event = selectNeighborhoodEvent(
      ctx.neighborhoodEventTemplates,
      currentNeighborhood.pulse,
      currentNeighborhood.id,
      state.turn
    );
    if (event) {
      activeEvents.neighborhood.push(event);
      newEvents.neighborhood.push(event);
    }
  }

  // Apply active event effects to pulses
  let globalPulse = state.globalPulse;
  for (const event of activeEvents.global) {
    globalPulse = applyGlobalEventEffects(globalPulse, event.effects);
  }

  let cityPulse = state.city.pulse;
  for (const event of activeEvents.city) {
    cityPulse = applyCityEventEffects(cityPulse, event.effects);
  }

  const neighborhoods = state.city.neighborhoods.map((n) => {
    const relevantEvents = activeEvents.neighborhood.filter(
      (e) => e.neighborhoodId === n.id
    );
    let pulse = n.pulse;
    for (const event of relevantEvents) {
      pulse = applyNeighborhoodEventEffects(pulse, event.effects);
    }
    return { ...n, pulse };
  });

  return {
    ...state,
    globalPulse,
    city: {
      ...state.city,
      pulse: cityPulse,
      neighborhoods,
    },
    activeEvents,
    phase: "decision",
  };
}

/**
 * Process the decision phase
 * Generate a decision prompt for the player (if applicable)
 */
function processDecisionPhase(state: GameState): GameState {
  // Check if there's a triggered event that requires a decision
  const recentNeighborhoodEvent = state.activeEvents.neighborhood.find(
    (e) => e.startTurn === state.turn
  );

  if (recentNeighborhoodEvent) {
    // Generate decision based on event type
    const decision = generateEventDecision(recentNeighborhoodEvent, state);
    return {
      ...state,
      currentDecision: decision,
      // Stay in decision phase until player responds
    };
  }

  // No decision needed, advance to consequence
  return {
    ...state,
    currentDecision: null,
    phase: "consequence",
  };
}

/**
 * Generate a decision based on a neighborhood event
 */
function generateEventDecision(
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
          description: "Politely decline to answer questions beyond what's legally required.",
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
          description: "Ask for legal representation before proceeding.",
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
          effects: { visibility: 5, trustNetworkStrength: 15, stress: -5, cohesion: 5 },
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

/**
 * Process the consequence phase
 * Apply results of player's decision, advance turn
 */
function processConsequencePhase(
  state: GameState,
  selectedChoiceIds: string[]
): GameState {
  if (!state.currentDecision) {
    // No decision was made, just advance
    return {
      ...state,
      turn: state.turn + 1,
      phase: "plan",
      currentDecision: null,
    };
  }

  // Find selected choices and apply effects
  const selectedChoices = state.currentDecision.choices.filter((c) =>
    selectedChoiceIds.includes(c.id)
  );

  let family = { ...state.family };
  for (const choice of selectedChoices) {
    family = applyEventEffects(family, choice.effects) as FamilyImpact;
  }

  // Record the choice
  const record: ChoiceRecord = {
    turn: state.turn,
    decisionId: state.currentDecision.id,
    choiceIds: selectedChoiceIds,
    effects: selectedChoices.reduce(
      (acc, c) => ({ ...acc, ...c.effects }),
      {} as Partial<FamilyImpact>
    ),
  };

  return {
    ...state,
    family,
    choiceHistory: [...state.choiceHistory, record],
    turn: state.turn + 1,
    phase: "plan",
    currentDecision: null,
  };
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Advance game state by one phase
 */
export function advancePhase(
  state: GameState,
  ctx: TurnContext,
  lastGlobalUpdate: number,
  selectedChoiceIds?: string[]
): GameState {
  switch (state.phase) {
    case "plan":
      return processPlanPhase(state);

    case "pulse_update":
      return processPulseUpdatePhase(state, lastGlobalUpdate);

    case "event":
      return processEventPhase(state, ctx);

    case "decision":
      if (state.currentDecision && selectedChoiceIds) {
        return processConsequencePhase(state, selectedChoiceIds);
      }
      return processDecisionPhase(state);

    case "consequence":
      return processConsequencePhase(state, selectedChoiceIds || []);

    default:
      return state;
  }
}

/**
 * Run a complete turn (all phases)
 * Used for auto-advancing when no decision is needed
 */
export function runCompleteTurn(
  state: GameState,
  ctx: TurnContext,
  lastGlobalUpdate: number
): GameState {
  let current = state;

  // Run through phases until we hit a decision that needs player input
  // or complete the turn
  while (true) {
    const previousPhase = current.phase;
    current = advancePhase(current, ctx, lastGlobalUpdate);

    // If we're waiting for a decision, stop
    if (current.phase === "decision" && current.currentDecision) {
      break;
    }

    // If we've completed a full cycle (back to plan with new turn), stop
    if (current.phase === "plan" && current.turn > state.turn) {
      break;
    }

    // Safety: prevent infinite loops
    if (current.phase === previousPhase) {
      break;
    }
  }

  return current;
}

/**
 * Check victory/failure conditions
 */
export function checkGameEnding(state: GameState): GameState {
  // Failure: family stress too high for too long
  if (state.family.stress >= 95 && state.family.cohesion <= 10) {
    return {
      ...state,
      ending: {
        type: "failure",
        reason: "Family could not endure the pressure.",
        turn: state.turn,
      },
    };
  }

  // Failure: detention (would be triggered by specific events)
  // This is a placeholder - actual implementation would track detention status

  // Victory: Outlast (survive all turns)
  if (state.turn >= state.maxTurns) {
    // Check if conditions improved
    if (state.globalPulse.enforcementClimate < 40) {
      return {
        ...state,
        ending: {
          type: "victory",
          victoryType: "outlast",
          turn: state.turn,
        },
      };
    }
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
    };
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
    };
  }

  return state;
}
