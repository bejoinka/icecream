/**
 * Test factory for creating game state fixtures
 */

import type {
  GameState,
  TurnPhase,
  GameEnding,
} from "@/types/game";
import type {
  GlobalPulse,
  CityPulse,
  NeighborhoodPulse,
  FamilyImpact,
} from "@/types/pulse";
import type { ActiveEvents } from "@/types/event";

/** Create a minimal global pulse with default values */
export function createGlobalPulse(overrides: Partial<GlobalPulse> = {}): GlobalPulse {
  return {
    enforcementClimate: 50,
    mediaNarrative: 0,
    judicialAlignment: 0,
    politicalVolatility: 50,
    ...overrides,
  };
}

/** Create a minimal city pulse with default values */
export function createCityPulse(overrides: Partial<CityPulse> = {}): CityPulse {
  return {
    federalCooperation: 50,
    dataDensity: 50,
    politicalCover: 50,
    civilSocietyCapacity: 50,
    bureaucraticInertia: 50,
    ...overrides,
  };
}

/** Create a minimal neighborhood pulse with default values */
export function createNeighborhoodPulse(overrides: Partial<NeighborhoodPulse> = {}): NeighborhoodPulse {
  return {
    trust: 50,
    suspicion: 30,
    enforcementVisibility: 20,
    communityDensity: 50,
    economicPrecarity: 40,
    ...overrides,
  };
}

/** Create a minimal family impact with default values */
export function createFamilyImpact(overrides: Partial<FamilyImpact> = {}): FamilyImpact {
  return {
    visibility: 30,
    stress: 20,
    cohesion: 70,
    trustNetworkStrength: 40,
    ...overrides,
  };
}

/** Create empty active events */
export function createEmptyActiveEvents(): ActiveEvents {
  return { global: [], city: [], neighborhood: [] };
}

/** Create a minimal game state for testing */
export function createGameState(overrides: Partial<GameState> = {}): GameState {
  const neighborhoodPulse = createNeighborhoodPulse();
  const globalPulse = createGlobalPulse();
  const cityPulse = createCityPulse();
  const family = createFamilyImpact();

  return {
    sessionId: "test-session-id",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    turn: 1,
    phase: "plan",
    maxTurns: 80,
    globalPulse,
    city: {
      id: "test-city",
      name: "Test City",
      state: "TS",
      pulse: cityPulse,
      neighborhoods: [
        {
          id: "neighborhood-1",
          name: "Test Neighborhood",
          pulse: neighborhoodPulse,
        },
      ],
      currentNeighborhoodId: "neighborhood-1",
    },
    family,
    activeEvents: createEmptyActiveEvents(),
    currentDecision: null,
    choiceHistory: [],
    rightsKnowledge: [],
    ending: null,
    ...overrides,
  };
}

/** Create a game state with a specific phase */
export function createGameStateWithPhase(phase: TurnPhase): GameState {
  return createGameState({ phase });
}

/** Create a game state with victory ending */
export function createVictoryState(victoryType: "sanctuary" | "outlast" | "transform"): GameState {
  const base = createGameState({ turn: 10, phase: "plan" as TurnPhase });

  switch (victoryType) {
    case "sanctuary":
      base.city.neighborhoods[0].pulse.trust = 85;
      base.city.neighborhoods[0].pulse.communityDensity = 75;
      base.family.trustNetworkStrength = 85;
      break;
    case "outlast":
      base.turn = 80;
      base.globalPulse.enforcementClimate = 35;
      break;
    case "transform":
      base.city.pulse.politicalCover = 85;
      base.city.pulse.federalCooperation = 15;
      base.globalPulse.mediaNarrative = -55;
      break;
  }

  base.ending = {
    type: "victory",
    victoryType,
    turn: base.turn,
  };

  return base;
}

/** Create a game state with failure ending */
export function createFailureState(): GameState {
  const base = createGameState({ turn: 10, phase: "plan" as TurnPhase });
  base.family.stress = 97;
  base.family.cohesion = 8;
  base.ending = {
    type: "failure",
    reason: "Family could not endure the pressure.",
    turn: base.turn,
  };
  return base;
}

/** Create a game state near failure threshold */
export function createNearFailureState(): GameState {
  return createGameState({
    family: {
      visibility: 30,
      stress: 94,
      cohesion: 11,
      trustNetworkStrength: 40,
    },
  });
}

/** Create a game state with high stress (for testing events) */
export function createHighStressState(): GameState {
  return createGameState({
    family: {
      visibility: 60,
      stress: 75,
      cohesion: 40,
      trustNetworkStrength: 30,
    },
  });
}

/** Create a game state with high enforcement visibility */
export function createHighEnforcementState(): GameState {
  return createGameState({
    city: {
      id: "test-city",
      name: "Test City",
      state: "TS",
      pulse: createCityPulse({ federalCooperation: 80 }),
      neighborhoods: [
        {
          id: "neighborhood-1",
          name: "Test Neighborhood",
          pulse: createNeighborhoodPulse({
            enforcementVisibility: 70,
            suspicion: 60,
          }),
        },
      ],
      currentNeighborhoodId: "neighborhood-1",
    },
  });
}
