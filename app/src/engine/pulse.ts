/**
 * Pulse Engine - Handles drift and updates for all world layers
 *
 * Pulses drift slowly over time. Events cause shocks.
 * Effects propagate down easily, up slowly.
 */

import {
  GlobalPulse,
  CityPulse,
  NeighborhoodPulse,
  FamilyImpact,
  UPDATE_CADENCE,
} from "@/types";

/** Clamp value between 0 and max (default 100) */
function clamp(value: number, min = 0, max = 100): number {
  return Math.max(min, Math.min(max, value));
}

/** Random drift within range */
function drift(current: number, range: number, bias = 0): number {
  const change = (Math.random() - 0.5 + bias) * range;
  return clamp(current + change);
}

// =============================================================================
// GLOBAL PULSE
// =============================================================================

/**
 * Update global pulse (every 14-28 turns)
 * Drifts based on politicalVolatility
 */
export function updateGlobalPulse(pulse: GlobalPulse): GlobalPulse {
  const volatilityFactor = pulse.politicalVolatility / 100;
  const driftRange = 5 + volatilityFactor * 10; // 5-15 range based on volatility

  return {
    enforcementClimate: drift(pulse.enforcementClimate, driftRange),
    mediaNarrative: clamp(
      drift(pulse.mediaNarrative, driftRange * 2, 0),
      -100,
      100
    ),
    judicialAlignment: clamp(
      drift(pulse.judicialAlignment, driftRange, 0),
      -50,
      50
    ),
    politicalVolatility: drift(pulse.politicalVolatility, 3), // Volatility itself drifts slowly
  };
}

/**
 * Check if global pulse should update this turn
 */
export function shouldUpdateGlobalPulse(
  turn: number,
  lastUpdate: number,
  volatility: number
): boolean {
  const turnsSinceUpdate = turn - lastUpdate;
  // Higher volatility = more frequent updates
  const updateInterval =
    UPDATE_CADENCE.GLOBAL_MAX -
    (volatility / 100) * (UPDATE_CADENCE.GLOBAL_MAX - UPDATE_CADENCE.GLOBAL_MIN);
  return turnsSinceUpdate >= updateInterval;
}

// =============================================================================
// CITY PULSE
// =============================================================================

/**
 * Update city pulse based on global pressure (every 7 turns)
 */
export function updateCityPulse(
  pulse: CityPulse,
  global: GlobalPulse
): CityPulse {
  const driftRange = 3;

  // Global enforcement climate pushes federal cooperation
  const cooperationPressure = (global.enforcementClimate - 50) * 0.05;

  // Media narrative affects political cover
  const coverPressure = (global.mediaNarrative / 100) * -2; // Negative narrative reduces cover

  return {
    federalCooperation: drift(
      pulse.federalCooperation,
      driftRange,
      cooperationPressure
    ),
    dataDensity: drift(pulse.dataDensity, 1), // Data density changes very slowly
    politicalCover: drift(pulse.politicalCover, driftRange, coverPressure),
    civilSocietyCapacity: drift(pulse.civilSocietyCapacity, 2),
    bureaucraticInertia: drift(pulse.bureaucraticInertia, 2),
  };
}

/**
 * Check if city pulse should update this turn
 */
export function shouldUpdateCityPulse(turn: number): boolean {
  return turn % UPDATE_CADENCE.CITY === 0;
}

// =============================================================================
// NEIGHBORHOOD PULSE
// =============================================================================

/**
 * Update neighborhood pulse based on city conditions (every turn)
 */
export function updateNeighborhoodPulse(
  pulse: NeighborhoodPulse,
  city: CityPulse,
  global: GlobalPulse,
  family: FamilyImpact
): NeighborhoodPulse {
  const driftRange = 2;

  // Cross-layer propagation (from spec)
  const enforcementFromCity = city.federalCooperation * 0.2;
  const enforcementFromGlobal = global.enforcementClimate * 0.1;

  // Family influence
  const trustFromFamily = family.trustNetworkStrength * 0.15;
  const suspicionFromFamily = family.visibility * 0.1;

  return {
    trust: clamp(drift(pulse.trust, driftRange) + trustFromFamily * 0.1),
    suspicion: clamp(
      drift(pulse.suspicion, driftRange) + suspicionFromFamily * 0.1
    ),
    enforcementVisibility: clamp(
      drift(pulse.enforcementVisibility, driftRange) +
        (enforcementFromCity + enforcementFromGlobal - 30) * 0.05
    ),
    communityDensity: drift(pulse.communityDensity, 1), // Changes very slowly
    economicPrecarity: drift(pulse.economicPrecarity, 1.5),
  };
}

// =============================================================================
// FAMILY IMPACT
// =============================================================================

/**
 * Natural family state drift (stress accumulates, cohesion decays under pressure)
 */
export function updateFamilyImpact(
  family: FamilyImpact,
  neighborhood: NeighborhoodPulse
): FamilyImpact {
  // Stress increases with enforcement visibility and economic precarity
  const stressPressure =
    (neighborhood.enforcementVisibility * 0.02 +
      neighborhood.economicPrecarity * 0.01) *
    (family.visibility / 50); // Higher visibility = more stress from enforcement

  // Cohesion slowly recovers at low stress, decays at high stress
  const cohesionDrift = family.stress > 60 ? -0.5 : 0.2;

  // Trust network affected by community density
  const networkDrift = (neighborhood.communityDensity - 50) * 0.01;

  return {
    visibility: drift(family.visibility, 1), // Visibility mostly stable without actions
    stress: clamp(drift(family.stress, 1, stressPressure)),
    cohesion: clamp(drift(family.cohesion, 1, cohesionDrift)),
    trustNetworkStrength: clamp(
      drift(family.trustNetworkStrength, 1, networkDrift)
    ),
  };
}

// =============================================================================
// AGGREGATE UPDATE
// =============================================================================

export interface WorldState {
  global: GlobalPulse;
  city: CityPulse;
  neighborhoods: Array<{ id: string; pulse: NeighborhoodPulse }>;
  family: FamilyImpact;
}

export interface UpdateResult {
  global: GlobalPulse;
  city: CityPulse;
  neighborhoods: Array<{ id: string; pulse: NeighborhoodPulse }>;
  family: FamilyImpact;
  updatedLayers: ("global" | "city" | "neighborhood" | "family")[];
}

/**
 * Run all pulse updates for a turn
 */
export function updateAllPulses(
  state: WorldState,
  turn: number,
  lastGlobalUpdate: number,
  currentNeighborhoodId: string
): UpdateResult {
  const updatedLayers: UpdateResult["updatedLayers"] = [];

  // Always update current neighborhood
  updatedLayers.push("neighborhood");

  // Global update (conditional)
  let global = state.global;
  if (
    shouldUpdateGlobalPulse(turn, lastGlobalUpdate, state.global.politicalVolatility)
  ) {
    global = updateGlobalPulse(state.global);
    updatedLayers.push("global");
  }

  // City update (every 7 turns)
  let city = state.city;
  if (shouldUpdateCityPulse(turn)) {
    city = updateCityPulse(state.city, global);
    updatedLayers.push("city");
  }

  // Neighborhood updates (every turn, only current neighborhood fully)
  const neighborhoods = state.neighborhoods.map((n) => {
    if (n.id === currentNeighborhoodId) {
      return {
        id: n.id,
        pulse: updateNeighborhoodPulse(n.pulse, city, global, state.family),
      };
    }
    // Other neighborhoods drift slowly without family influence
    return {
      id: n.id,
      pulse: updateNeighborhoodPulse(n.pulse, city, global, {
        visibility: 0,
        stress: 0,
        cohesion: 50,
        trustNetworkStrength: 0,
      }),
    };
  });

  // Family update (every turn)
  const currentNeighborhood = neighborhoods.find(
    (n) => n.id === currentNeighborhoodId
  );
  const family = currentNeighborhood
    ? updateFamilyImpact(state.family, currentNeighborhood.pulse)
    : state.family;
  updatedLayers.push("family");

  return {
    global,
    city,
    neighborhoods,
    family,
    updatedLayers,
  };
}
