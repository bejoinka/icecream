/**
 * Pulse Types - Slow-moving state variables at each world layer
 * Based on SYSTEMS_PULSES_AND_EVENTS.md spec
 */

/**
 * Global/National layer pulse
 * Sets the political and media weather. Not directly controllable by player.
 * Updates every 14-28 turns (2-4 in-game weeks)
 */
export interface GlobalPulse {
  /** 0-100: 0-20 lax, 21-50 baseline, 51-80 aggressive, 81-100 crisis */
  enforcementClimate: number;
  /** -100 to +100: -100 fatigue/sympathy, 0 neutral, +100 panic/scapegoating */
  mediaNarrative: number;
  /** -50 to +50: -50 rights-expansive, 0 mixed, +50 executive-deferential */
  judicialAlignment: number;
  /** 0-100: higher = sharper swings, more randomness */
  politicalVolatility: number;
}

/**
 * City layer pulse
 * Interprets national pressure into local policy, bureaucracy, and tone.
 * Updates every 7 turns (weekly)
 */
export interface CityPulse {
  /** 0-100: 0-20 resist, 21-50 passive, 51-80 quiet comply, 81-100 partner */
  federalCooperation: number;
  /** 0-100: low = siloed systems, high = integrated (faster surprise propagation) */
  dataDensity: number;
  /** 0-100: low = abandon quickly, high = absorb backlash */
  politicalCover: number;
  /** 0-100: low = thin safety net, high = rescue windows */
  civilSocietyCapacity: number;
  /** 0-100: high = delays, incompetence, absurd outcomes (cuts both ways) */
  bureaucraticInertia: number;
}

/**
 * Neighborhood layer pulse
 * Primary playable surface where daily life and tension occur.
 * Updates every turn (daily)
 */
export interface NeighborhoodPulse {
  /** 0-100: community trust in each other and institutions */
  trust: number;
  /** 0-100: suspicion of outsiders/authorities (can be high alongside trust) */
  suspicion: number;
  /** 0-100: presence of enforcement, not severity */
  enforcementVisibility: number;
  /** 0-100: social connectedness, not population count */
  communityDensity: number;
  /** 0-100: economic vulnerability and instability */
  economicPrecarity: number;
}

/**
 * Family impact variables
 * The family influences neighborhoods indirectly through these variables.
 * Modified by player choices.
 */
export interface FamilyImpact {
  /** 0-100: how noticeable the family is to authorities */
  visibility: number;
  /** 0-100: accumulated psychological pressure */
  stress: number;
  /** 0-100: ability to act together as a unit */
  cohesion: number;
  /** 0-100: community support strength */
  trustNetworkStrength: number;
}

// Default starting values
export const DEFAULT_GLOBAL_PULSE: GlobalPulse = {
  enforcementClimate: 50,
  mediaNarrative: 0,
  judicialAlignment: 0,
  politicalVolatility: 30,
};

export const DEFAULT_FAMILY_IMPACT: FamilyImpact = {
  visibility: 30,
  stress: 20,
  cohesion: 70,
  trustNetworkStrength: 40,
};
