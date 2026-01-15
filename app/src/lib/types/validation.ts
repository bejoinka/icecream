/**
 * Validation utilities for game state values
 */

import type {
  GlobalPulse,
  CityPulse,
  NeighborhoodPulse,
  FamilyImpact,
} from "./game-state";

/**
 * Clamp a value between min and max
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

/**
 * Validate and clamp a value to 0-100 range
 */
export function clamp100(value: number): number {
  return clamp(value, 0, 100);
}

/**
 * Validate and clamp GlobalPulse values
 */
export function validateGlobalPulse(pulse: GlobalPulse): GlobalPulse {
  return {
    enforcementClimate: clamp100(pulse.enforcementClimate),
    mediaNarrative: clamp(pulse.mediaNarrative, -100, 100),
    judicialAlignment: clamp(pulse.judicialAlignment, -50, 50),
    politicalVolatility: clamp100(pulse.politicalVolatility),
  };
}

/**
 * Validate and clamp CityPulse values
 */
export function validateCityPulse(pulse: CityPulse): CityPulse {
  return {
    federalCooperation: clamp100(pulse.federalCooperation),
    dataDensity: clamp100(pulse.dataDensity),
    politicalCover: clamp100(pulse.politicalCover),
    civilSocietyCapacity: clamp100(pulse.civilSocietyCapacity),
    bureaucraticInertia: clamp100(pulse.bureaucraticInertia),
  };
}

/**
 * Validate and clamp NeighborhoodPulse values
 */
export function validateNeighborhoodPulse(
  pulse: NeighborhoodPulse
): NeighborhoodPulse {
  return {
    trust: clamp100(pulse.trust),
    suspicion: clamp100(pulse.suspicion),
    enforcementVisibility: clamp100(pulse.enforcementVisibility),
    communityDensity: clamp100(pulse.communityDensity),
    economicPrecarity: clamp100(pulse.economicPrecarity),
  };
}

/**
 * Validate and clamp FamilyImpact values
 */
export function validateFamilyImpact(impact: FamilyImpact): FamilyImpact {
  return {
    visibility: clamp100(impact.visibility),
    stress: clamp100(impact.stress),
    cohesion: clamp100(impact.cohesion),
    trustNetworkStrength: clamp100(impact.trustNetworkStrength),
  };
}

/**
 * Interpretation helpers for enforcement climate
 */
export type EnforcementBand = "lax" | "baseline" | "aggressive" | "crisis";

export function getEnforcementBand(value: number): EnforcementBand {
  if (value <= 20) return "lax";
  if (value <= 50) return "baseline";
  if (value <= 80) return "aggressive";
  return "crisis";
}

/**
 * Interpretation helpers for federal cooperation
 */
export type CooperationBand = "resist" | "passive" | "quietComply" | "partner";

export function getCooperationBand(value: number): CooperationBand {
  if (value <= 20) return "resist";
  if (value <= 50) return "passive";
  if (value <= 80) return "quietComply";
  return "partner";
}

/**
 * Interpretation helpers for media narrative
 */
export type MediaBand = "sympathetic" | "neutral" | "hostile";

export function getMediaBand(value: number): MediaBand {
  if (value <= -30) return "sympathetic";
  if (value <= 30) return "neutral";
  return "hostile";
}
