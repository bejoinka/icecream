/**
 * Event Engine - Handles event selection, triggering, and resolution
 *
 * Events are discrete shocks that temporarily or permanently re-weight pulses.
 * Selection is weighted random based on pulse values.
 */

import {
  GlobalEvent,
  CityEvent,
  NeighborhoodEvent,
  GlobalPulse,
  CityPulse,
  NeighborhoodPulse,
  ActiveEvents,
  EventSeverity,
} from "@/types";
import {
  NeighborhoodEventTemplate,
  CityEventTemplate,
} from "@/types/city";

// =============================================================================
// RANDOM SELECTION UTILITIES
// =============================================================================

/** Select item from weighted array */
function weightedRandom<T extends { weight: number }>(items: T[]): T | null {
  if (items.length === 0) return null;

  const totalWeight = items.reduce((sum, item) => sum + item.weight, 0);
  if (totalWeight === 0) return null;

  let random = Math.random() * totalWeight;

  for (const item of items) {
    random -= item.weight;
    if (random <= 0) return item;
  }

  return items[items.length - 1];
}

/** Generate a random severity within range */
function randomSeverity(range: [number, number]): EventSeverity {
  const [min, max] = range;
  const value = Math.floor(Math.random() * (max - min + 1)) + min;
  return Math.max(1, Math.min(5, value)) as EventSeverity;
}

/** Generate a random value within range */
function randomInRange(range: [number, number]): number {
  const [min, max] = range;
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

/** Generate unique event ID */
function generateEventId(): string {
  return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// =============================================================================
// NEIGHBORHOOD EVENTS
// =============================================================================

/**
 * Check if a neighborhood event template should trigger based on pulse conditions
 */
function checkNeighborhoodTriggers(
  template: NeighborhoodEventTemplate,
  pulse: NeighborhoodPulse
): boolean {
  if (!template.triggers) return true;

  const t = template.triggers;

  if (
    t.minEnforcementVisibility !== undefined &&
    pulse.enforcementVisibility < t.minEnforcementVisibility
  ) {
    return false;
  }
  if (t.minSuspicion !== undefined && pulse.suspicion < t.minSuspicion) {
    return false;
  }
  if (t.maxTrust !== undefined && pulse.trust > t.maxTrust) {
    return false;
  }
  if (
    t.minEconomicPrecarity !== undefined &&
    pulse.economicPrecarity < t.minEconomicPrecarity
  ) {
    return false;
  }

  return true;
}

/**
 * Calculate adjusted weight for neighborhood event based on pulse
 */
function adjustNeighborhoodEventWeight(
  template: NeighborhoodEventTemplate,
  pulse: NeighborhoodPulse
): number {
  let weight = template.weight;

  // High enforcement visibility increases likelihood of enforcement events
  if (
    template.type === "Checkpoint" ||
    template.type === "Audit" ||
    template.type === "RaidRumor" ||
    template.type === "Detention"
  ) {
    weight *= 1 + pulse.enforcementVisibility / 100;
  }

  // High community density increases meeting likelihood
  if (template.type === "Meeting") {
    weight *= 1 + pulse.communityDensity / 100;
  }

  // High suspicion increases all negative events
  if (template.type !== "Meeting") {
    weight *= 1 + pulse.suspicion / 200;
  }

  return weight;
}

/**
 * Select a neighborhood event from the pool
 */
export function selectNeighborhoodEvent(
  templates: NeighborhoodEventTemplate[],
  pulse: NeighborhoodPulse,
  neighborhoodId: string,
  turn: number
): NeighborhoodEvent | null {
  // Filter by triggers and adjust weights
  const eligible = templates
    .filter((t) => checkNeighborhoodTriggers(t, pulse))
    .map((t) => ({
      ...t,
      weight: adjustNeighborhoodEventWeight(t, pulse),
    }));

  const selected = weightedRandom(eligible);
  if (!selected) return null;

  // Random target from allowed targets
  const target =
    selected.targets[Math.floor(Math.random() * selected.targets.length)];

  return {
    id: generateEventId(),
    type: selected.type,
    severity: randomSeverity(selected.severityRange),
    target,
    neighborhoodId,
    title: selected.title,
    description: selected.descriptionTemplate,
    startTurn: turn,
    effects: selected.effects,
  };
}

/**
 * Check if a neighborhood event should trigger this turn
 * Base probability modified by pulse conditions
 */
export function shouldTriggerNeighborhoodEvent(
  pulse: NeighborhoodPulse
): boolean {
  // Base 30% chance per turn
  let probability = 0.3;

  // High enforcement visibility increases probability
  probability += pulse.enforcementVisibility * 0.002;

  // High suspicion increases probability
  probability += pulse.suspicion * 0.001;

  // High trust slightly decreases probability
  probability -= pulse.trust * 0.001;

  return Math.random() < probability;
}

// =============================================================================
// CITY EVENTS
// =============================================================================

/**
 * Select a city event from the pool
 */
export function selectCityEvent(
  templates: CityEventTemplate[],
  pulse: CityPulse,
  turn: number,
  neighborhoodIds: string[]
): CityEvent | null {
  const selected = weightedRandom(templates);
  if (!selected) return null;

  // Determine impact radius (60% chance all neighborhoods, 40% subset)
  const impactRadius: "All" | string[] =
    Math.random() < 0.6
      ? "All"
      : neighborhoodIds.filter(() => Math.random() > 0.5);

  return {
    id: generateEventId(),
    category: selected.category,
    visibility: randomInRange(selected.visibilityRange),
    impactRadius: impactRadius.length === 0 ? "All" : impactRadius,
    title: selected.title,
    description: selected.descriptionTemplate,
    startTurn: turn,
    durationDays: randomInRange(selected.durationRange),
    effects: selected.effects,
  };
}

/**
 * Check if a city event should trigger this turn (every ~7-14 days)
 */
export function shouldTriggerCityEvent(turn: number, pulse: CityPulse): boolean {
  // Base 15% chance per turn
  let probability = 0.15;

  // High political cover reduces disruptive events
  probability -= pulse.politicalCover * 0.001;

  // High bureaucratic inertia increases weird events
  probability += pulse.bureaucraticInertia * 0.001;

  return Math.random() < probability;
}

// =============================================================================
// GLOBAL EVENTS
// =============================================================================

/** Global event templates (built-in) */
const GLOBAL_EVENT_TEMPLATES = [
  {
    type: "Executive" as const,
    title: "New Enforcement Directive",
    description:
      "Federal agencies receive new guidance on enforcement priorities.",
    effects: { enforcementClimate: 15, politicalVolatility: 10 },
    weight: 2,
  },
  {
    type: "Judicial" as const,
    title: "Court Ruling",
    description: "A significant court decision affects enforcement procedures.",
    effects: { judicialAlignment: 10 },
    weight: 2,
  },
  {
    type: "Media" as const,
    title: "National News Coverage",
    description: "A story about immigration dominates the news cycle.",
    effects: { mediaNarrative: 20, politicalVolatility: 5 },
    weight: 3,
  },
  {
    type: "Security" as const,
    title: "Security Incident",
    description: "A national security event shifts public attention.",
    effects: { enforcementClimate: 10, mediaNarrative: 15 },
    weight: 1,
  },
];

/**
 * Select a global event
 */
export function selectGlobalEvent(
  pulse: GlobalPulse,
  turn: number
): GlobalEvent | null {
  const selected = weightedRandom(GLOBAL_EVENT_TEMPLATES);
  if (!selected) return null;

  const magnitude = randomSeverity([1, 3 + Math.floor(pulse.politicalVolatility / 30)]);
  const durationDays = 7 + magnitude * 7; // 14-35 days based on magnitude

  // Build effects with proper typing
  const effects: GlobalEvent["effects"] = {};
  for (const [key, value] of Object.entries(selected.effects)) {
    (effects as Record<string, number>)[key] = value * magnitude;
  }

  return {
    id: generateEventId(),
    type: selected.type,
    magnitude,
    durationDays,
    title: selected.title,
    description: selected.description,
    startTurn: turn,
    effects,
  };
}

/**
 * Check if a global event should trigger (rare, ~5% per turn during volatile periods)
 */
export function shouldTriggerGlobalEvent(pulse: GlobalPulse): boolean {
  // Base 2% chance, up to 8% at max volatility
  const probability = 0.02 + pulse.politicalVolatility * 0.0006;
  return Math.random() < probability;
}

// =============================================================================
// EVENT APPLICATION
// =============================================================================

/**
 * Apply global event effects to GlobalPulse
 */
export function applyGlobalEventEffects(
  pulse: GlobalPulse,
  effects: GlobalEvent["effects"]
): GlobalPulse {
  const result: GlobalPulse = { ...pulse };

  for (const key in effects) {
    if (Object.prototype.hasOwnProperty.call(effects, key)) {
      const value = (effects as Record<string, number>)[key];
      if (typeof value === "number" && key in result) {
        const k = key as keyof GlobalPulse;
        const currentValue = result[k];
        if (typeof currentValue === "number") {
          (result[k] as number) = Math.max(0, Math.min(100, currentValue + value));
        }
      }
    }
  }

  return result;
}

/**
 * Apply city event effects to CityPulse
 */
export function applyCityEventEffects(
  pulse: CityPulse,
  effects: CityEvent["effects"]
): CityPulse {
  const result: CityPulse = { ...pulse };

  for (const key in effects) {
    if (Object.prototype.hasOwnProperty.call(effects, key)) {
      const value = (effects as Record<string, number>)[key];
      if (typeof value === "number" && key in result) {
        const k = key as keyof CityPulse;
        const currentValue = result[k];
        if (typeof currentValue === "number") {
          (result[k] as number) = Math.max(0, Math.min(100, currentValue + value));
        }
      }
    }
  }

  return result;
}

/**
 * Apply neighborhood event effects to NeighborhoodPulse
 */
export function applyNeighborhoodEventEffects(
  pulse: NeighborhoodPulse,
  effects: NeighborhoodEvent["effects"]
): NeighborhoodPulse {
  const result: NeighborhoodPulse = { ...pulse };

  for (const key in effects) {
    if (Object.prototype.hasOwnProperty.call(effects, key)) {
      const value = (effects as Record<string, number>)[key];
      if (typeof value === "number" && key in result) {
        const k = key as keyof NeighborhoodPulse;
        const currentValue = result[k];
        if (typeof currentValue === "number") {
          (result[k] as number) = Math.max(0, Math.min(100, currentValue + value));
        }
      }
    }
  }

  return result;
}

/**
 * Apply event effects to pulses (additive) - generic version
 * @deprecated Use typed versions: applyGlobalEventEffects, applyCityEventEffects, applyNeighborhoodEventEffects
 */
export function applyEventEffects<
  T extends Record<string, number>,
  E extends Partial<Record<keyof T, number>>
>(pulse: T, effects: E): T {
  const result: T = { ...pulse };

  for (const key in effects) {
    if (Object.prototype.hasOwnProperty.call(effects, key) && key in result) {
      const value = effects[key];
      if (typeof value === "number") {
        const currentValue = result[key as keyof T];
        if (typeof currentValue === "number") {
          (result[key as keyof T] as number) = Math.max(
            0,
            Math.min(100, currentValue + value)
          );
        }
      }
    }
  }

  return result;
}

/**
 * Check and remove expired events
 */
export function pruneExpiredEvents(
  events: ActiveEvents,
  currentTurn: number
): ActiveEvents {
  return {
    global: events.global.filter(
      (e) => currentTurn < e.startTurn + e.durationDays
    ),
    city: events.city.filter(
      (e) => currentTurn < e.startTurn + e.durationDays
    ),
    neighborhood: events.neighborhood.filter(
      // Neighborhood events are instant (no duration)
      (e) => currentTurn === e.startTurn
    ),
  };
}
