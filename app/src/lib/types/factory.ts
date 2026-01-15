/**
 * Factory functions for creating game state objects
 */

import { v4 as uuidv4 } from "uuid";
import type {
  GameState,
  City,
  Neighborhood,
  GlobalPulse,
  CityPulse,
  NeighborhoodPulse,
  FamilyImpact,
} from "./game-state";
import {
  DEFAULT_GLOBAL_PULSE,
  DEFAULT_CITY_PULSE,
  DEFAULT_NEIGHBORHOOD_PULSE,
  DEFAULT_FAMILY_IMPACT,
  DEFAULT_TURN_STATE,
} from "./game-state";

export interface CreateNeighborhoodOptions {
  name: string;
  archetype: string;
  pulse?: Partial<NeighborhoodPulse>;
}

export function createNeighborhood(
  options: CreateNeighborhoodOptions
): Neighborhood {
  return {
    id: uuidv4(),
    name: options.name,
    archetype: options.archetype,
    pulse: {
      ...DEFAULT_NEIGHBORHOOD_PULSE,
      ...options.pulse,
    },
    activeEvents: [],
  };
}

export interface CreateCityOptions {
  name: string;
  state: string;
  pulse?: Partial<CityPulse>;
  neighborhoods: CreateNeighborhoodOptions[];
}

export function createCity(options: CreateCityOptions): City {
  return {
    id: uuidv4(),
    name: options.name,
    state: options.state,
    pulse: {
      ...DEFAULT_CITY_PULSE,
      ...options.pulse,
    },
    neighborhoods: options.neighborhoods.map(createNeighborhood),
    activeEvents: [],
  };
}

export interface CreateGameStateOptions {
  sessionId: string;
  city: CreateCityOptions;
  startingNeighborhoodIndex?: number;
  globalPulse?: Partial<GlobalPulse>;
  familyImpact?: Partial<FamilyImpact>;
  seed?: number;
}

/**
 * Create a new game state with the given options
 */
export function createGameState(options: CreateGameStateOptions): GameState {
  const city = createCity(options.city);
  const startingNeighborhood =
    city.neighborhoods[options.startingNeighborhoodIndex ?? 0];

  if (!startingNeighborhood) {
    throw new Error("City must have at least one neighborhood");
  }

  const now = new Date().toISOString();

  return {
    sessionId: options.sessionId,
    createdAt: now,
    updatedAt: now,
    turn: { ...DEFAULT_TURN_STATE },
    global: {
      pulse: {
        ...DEFAULT_GLOBAL_PULSE,
        ...options.globalPulse,
      },
      activeEvents: [],
    },
    city,
    currentNeighborhoodId: startingNeighborhood.id,
    family: {
      ...DEFAULT_FAMILY_IMPACT,
      ...options.familyImpact,
    },
    result: {
      outcome: "InProgress",
    },
    seed: options.seed ?? Math.floor(Math.random() * 1000000),
  };
}

/**
 * Create a demo game state for testing/development
 */
export function createDemoGameState(sessionId: string): GameState {
  return createGameState({
    sessionId,
    city: {
      name: "Harbor City",
      state: "CA",
      pulse: {
        federalCooperation: 55,
        dataDensity: 80,
        politicalCover: 35,
        civilSocietyCapacity: 60,
        bureaucraticInertia: 70,
      },
      neighborhoods: [
        {
          name: "El Centro",
          archetype: "Dense immigrant enclave",
          pulse: {
            trust: 75,
            suspicion: 40,
            enforcementVisibility: 50,
            communityDensity: 85,
            economicPrecarity: 65,
          },
        },
        {
          name: "Riverside Heights",
          archetype: "Mixed suburb",
          pulse: {
            trust: 45,
            suspicion: 25,
            enforcementVisibility: 20,
            communityDensity: 40,
            economicPrecarity: 35,
          },
        },
        {
          name: "Mission District",
          archetype: "Gentrifying core",
          pulse: {
            trust: 50,
            suspicion: 55,
            enforcementVisibility: 60,
            communityDensity: 70,
            economicPrecarity: 55,
          },
        },
      ],
    },
    globalPulse: {
      enforcementClimate: 60,
      mediaNarrative: 20,
      judicialAlignment: 15,
      politicalVolatility: 45,
    },
  });
}
