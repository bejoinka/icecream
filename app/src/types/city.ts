/**
 * City and Neighborhood Types
 * Based on CITY_PROFILING_BRIEF_AGENT_INSTRUCTIONS.md
 */

import { CityPulse, NeighborhoodPulse } from "./pulse";
import { CityEvent, NeighborhoodEvent } from "./event";

/**
 * Neighborhood definition within a city
 */
export interface Neighborhood {
  id: string;
  name: string;
  /** One-sentence characterization */
  description: string;
  /** Initial pulse values */
  pulse: NeighborhoodPulse;
  /** Pool of possible events for this neighborhood */
  eventPool: NeighborhoodEventTemplate[];
}

/**
 * Template for generating neighborhood events
 */
export interface NeighborhoodEventTemplate {
  id: string;
  type: NeighborhoodEvent["type"];
  severityRange: [number, number];
  targets: NeighborhoodEvent["target"][];
  title: string;
  descriptionTemplate: string;
  /** Weight for random selection (higher = more likely) */
  weight: number;
  /** Pulse conditions that increase likelihood */
  triggers?: Partial<{
    minEnforcementVisibility: number;
    minSuspicion: number;
    maxTrust: number;
    minEconomicPrecarity: number;
  }>;
  effects: NeighborhoodEvent["effects"];
}

/**
 * Template for generating city events
 */
export interface CityEventTemplate {
  id: string;
  category: CityEvent["category"];
  title: string;
  descriptionTemplate: string;
  visibilityRange: [number, number];
  durationRange: [number, number];
  weight: number;
  effects: CityEvent["effects"];
}

/**
 * Full city profile as produced by city profiling agents
 */
export interface CityProfile {
  id: string;
  name: string;
  /** State abbreviation */
  state: string;
  /** 1-2 paragraph overview */
  overview: string;
  /** Initial city pulse values */
  pulse: CityPulse;
  /** 3-6 neighborhoods */
  neighborhoods: Neighborhood[];
  /** City-specific event pool */
  eventPool: CityEventTemplate[];
  /** Special events based on recent news */
  specialEvents: CityEventTemplate[];
  /** Why this city is interesting to play */
  playabilityRationale: string;
}

/**
 * Justification for a pulse value (used during city profiling)
 */
export interface PulseJustification {
  value: number;
  rationale: string;
}

/**
 * City profile with justifications (intermediate format from profiling agents)
 */
export interface CityProfileWithJustifications {
  id: string;
  name: string;
  state: string;
  overview: string;
  pulse: {
    federalCooperation: PulseJustification;
    dataDensity: PulseJustification;
    politicalCover: PulseJustification;
    civilSocietyCapacity: PulseJustification;
    bureaucraticInertia: PulseJustification;
  };
  neighborhoods: Array<{
    name: string;
    description: string;
    pulse: {
      trust: PulseJustification;
      suspicion: PulseJustification;
      enforcementVisibility: PulseJustification;
      communityDensity: PulseJustification;
      economicPrecarity: PulseJustification;
    };
    rationale: string;
  }>;
  playabilityRationale: string;
}

/** List of 20 launch cities */
export const LAUNCH_CITIES = [
  // West Coast
  { name: "Los Angeles", state: "CA" },
  { name: "San Francisco", state: "CA" },
  { name: "Phoenix", state: "AZ" },
  { name: "Seattle", state: "WA" },
  // Southwest/Border
  { name: "El Paso", state: "TX" },
  { name: "Tucson", state: "AZ" },
  { name: "San Antonio", state: "TX" },
  // Midwest
  { name: "Chicago", state: "IL" },
  { name: "Detroit", state: "MI" },
  { name: "Minneapolis", state: "MN" },
  { name: "Columbus", state: "OH" },
  // South
  { name: "Houston", state: "TX" },
  { name: "Miami", state: "FL" },
  { name: "Atlanta", state: "GA" },
  { name: "Nashville", state: "TN" },
  // Northeast
  { name: "New York", state: "NY" },
  { name: "Boston", state: "MA" },
  { name: "Philadelphia", state: "PA" },
  { name: "Newark", state: "NJ" },
  // Mountain West
  { name: "Denver", state: "CO" },
] as const;

export type LaunchCityName = (typeof LAUNCH_CITIES)[number]["name"];
