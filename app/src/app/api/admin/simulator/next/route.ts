/**
 * POST /api/admin/simulator/next
 *
 * Advances the game to the next phase or turn.
 * Initializes a new game if no state exists.
 */

import { NextRequest, NextResponse } from "next/server";
import { loadSession, initializeSession } from "@/lib/session";
import { setGameState } from "@/lib/redis";
import {
  executeTurn,
  runGameLoop,
  TurnContext,
} from "@/lib/game-loop";
import {
  GameState,
  DEFAULT_MAX_TURNS,
  DEFAULT_GLOBAL_PULSE,
  DEFAULT_FAMILY_IMPACT,
} from "@/types";
import { NEIGHBORHOOD_EVENT_POOL, CITY_EVENT_POOL } from "@/data/events";
import { CityProfile } from "@/types/city";

export const dynamic = "force-dynamic";

/**
 * Load city profile for a given city ID
 */
async function loadCityProfile(cityId: string): Promise<CityProfile> {
  // Convert city name to file format (e.g., "Los Angeles" -> "los-angeles-ca")
  const cityFile = cityId.toLowerCase().replace(/\s+/g, "-") + ".json";
  try {
    const module = await import(`@/data/cities/${cityFile}`);
    return module.default as CityProfile;
  } catch {
    // Fallback to Los Angeles if city not found
    const module = await import("@/data/cities/los-angeles-ca.json");
    return module.default as CityProfile;
  }
}

/**
 * Initialize a new game state
 */
function createInitialState(cityId: string): GameState {
  const globalPulse = { ...DEFAULT_GLOBAL_PULSE };
  const family = { ...DEFAULT_FAMILY_IMPACT };

  // For now, use a simple city structure
  // In production, load from city profile
  return {
    sessionId: "", // Will be set from session
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    turn: 1,
    phase: "plan",
    maxTurns: DEFAULT_MAX_TURNS,
    globalPulse,
    city: {
      id: cityId,
      name: "Los Angeles", // Default
      state: "CA",
      pulse: {
        federalCooperation: 50,
        dataDensity: 40,
        politicalCover: 30,
        civilSocietyCapacity: 50,
        bureaucraticInertia: 60,
      },
      neighborhoods: [
        {
          id: "downtown",
          name: "Downtown",
          pulse: {
            trust: 50,
            suspicion: 30,
            enforcementVisibility: 40,
            communityDensity: 60,
            economicPrecarity: 50,
          },
        },
      ],
      currentNeighborhoodId: "downtown",
    },
    family,
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

/**
 * Get turn context with event templates
 */
function getTurnContext(): TurnContext {
  return {
    neighborhoodEventTemplates: NEIGHBORHOOD_EVENT_POOL,
    cityEventTemplates: CITY_EVENT_POOL,
  };
}

/**
 * Filter choices to only include unlocked ones
 */
function filterUnlockedChoices(
  state: GameState,
  choices: any[]
): any[] {
  return choices.map((choice) => {
    const { unlockConditions, ...rest } = choice;

    // If no unlock conditions, choice is available
    if (!unlockConditions) {
      return { ...rest, unlocked: true };
    }

    let unlocked = true;

    // Check turn-based unlock
    if (unlockConditions.minTurn !== undefined) {
      unlocked &&= state.turn >= unlockConditions.minTurn;
    }

    // Check stat-based unlocks
    if (unlockConditions.maxStress !== undefined) {
      unlocked &&= state.family.stress <= unlockConditions.maxStress;
    }
    if (unlockConditions.minCohesion !== undefined) {
      unlocked &&= state.family.cohesion >= unlockConditions.minCohesion;
    }
    if (unlockConditions.minTrustNetwork !== undefined) {
      unlocked &&= state.family.trustNetworkStrength >= unlockConditions.minTrustNetwork;
    }
    if (unlockConditions.maxVisibility !== undefined) {
      unlocked &&= state.family.visibility <= unlockConditions.maxVisibility;
    }

    // Check required previous choices
    if (unlockConditions.requiredChoices) {
      const hasRequiredChoice = unlockConditions.requiredChoices.some((requiredId) =>
        state.choiceHistory.some((record) =>
          record.choiceIds.includes(requiredId)
        )
      );
      unlocked &&= hasRequiredChoice;
    }

    // Check rights knowledge
    if (unlockConditions.rightsKnowledge) {
      const hasKnowledge = unlockConditions.rightsKnowledge.some((knowledge) =>
        state.rightsKnowledge.includes(knowledge)
      );
      unlocked &&= hasKnowledge;
    }

    return { ...rest, unlocked };
  });
}

export async function POST(request: NextRequest) {
  try {
    const { skipToNextTurn } = await request.json().catch(() => ({}));

    // Load or create session
    const { sessionId, state: existingState, isNew } = await loadSession<GameState>();

    let state: GameState;

    if (isNew || !existingState) {
      // Initialize new game
      state = createInitialState("los-angeles");
      state.sessionId = sessionId;
      await initializeSession(sessionId, state);
    } else {
      state = existingState;
    }

    // Don't advance if game has ended
    if (state.ending) {
      return NextResponse.json({
        state,
        phaseCompleted: state.phase,
        newEvents: { global: 0, city: 0, neighborhood: 0 },
        decision: null,
        ending: state.ending,
      });
    }

    // Get turn context
    const ctx = getTurnContext();

    // Track last global update (simplified - in production store in state)
    const lastGlobalUpdate = state.turn - 1;

    // If skipping to next turn, run until we hit a new turn
    if (skipToNextTurn) {
      let iterations = 0;
      const maxIterations = 20; // Safety limit

      while (state.phase !== "plan" || state.turn === (existingState?.turn ?? 1)) {
        const result = executeTurn(state, ctx, lastGlobalUpdate);
        state = result.state;

        // Check for ending
        if (state.ending) break;

        // If we hit a decision, stop and wait for player input
        if (result.decision) break;

        iterations++;
        if (iterations >= maxIterations) {
          console.warn("Max iterations reached in skipToNextTurn");
          break;
        }
      }
    } else {
      // Single phase/turn advancement
      const result = executeTurn(state, ctx, lastGlobalUpdate);
      state = result.state;
    }

    // Save updated state
    await setGameState(sessionId, state);

    // Prepare decision response with unlocked status
    let decisionResponse = null;
    if (state.currentDecision) {
      decisionResponse = {
        id: state.currentDecision.id,
        title: state.currentDecision.title,
        narrative: state.currentDecision.narrative,
        choices: filterUnlockedChoices(state, state.currentDecision.choices),
        multiSelect: state.currentDecision.multiSelect,
        urgency: state.currentDecision.urgency,
      };
    }

    // Count new events
    const newEventsCount = {
      global: state.activeEvents.global.filter((e) => e.startTurn === state.turn).length,
      city: state.activeEvents.city.filter((e) => e.startTurn === state.turn).length,
      neighborhood: state.activeEvents.neighborhood.filter((e) => e.startTurn === state.turn).length,
    };

    return NextResponse.json({
      state,
      phaseCompleted: state.phase,
      newEvents: newEventsCount,
      decision: decisionResponse,
      ending: state.ending,
    });
  } catch (error) {
    console.error("Error advancing game:", error);
    return NextResponse.json(
      {
        error: "internal_error",
        message: "Failed to advance game",
      } as const,
      { status: 500 }
    );
  }
}
