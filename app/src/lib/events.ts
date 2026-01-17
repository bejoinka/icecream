/**
 * Events Library - Event generation templates and utilities
 *
 * Provides template functions for dynamically generating events
 * at all levels: Global, City, and Neighborhood.
 *
 * Templates can be customized with:
 * - Context-specific descriptions
 * - Dynamic severity/magnitude ranges
 * - Variable weights based on game state
 */

import type {
  GlobalEvent,
  CityEvent,
  NeighborhoodEvent,
  GlobalEventType,
  CityEventCategory,
  NeighborhoodEventType,
  EventTarget,
  EventSeverity,
} from "@/types/event";
import type {
  NeighborhoodEventTemplate,
  CityEventTemplate,
} from "@/types/city";
import type { GlobalPulse, CityPulse, NeighborhoodPulse } from "@/types/pulse";

// =============================================================================
// TYPE GUARDS
// =============================================================================

export function isGlobalEvent(event: unknown): event is GlobalEvent {
  return (
    typeof event === "object" &&
    event !== null &&
    "type" in event &&
    ["Executive", "Judicial", "Media", "Security"].includes(
      (event as GlobalEvent).type
    )
  );
}

export function isCityEvent(event: unknown): event is CityEvent {
  return (
    typeof event === "object" &&
    event !== null &&
    "category" in event &&
    ["Policy", "Budget", "Infrastructure", "Media"].includes(
      (event as CityEvent).category
    )
  );
}

export function isNeighborhoodEvent(
  event: unknown
): event is NeighborhoodEvent {
  return (
    typeof event === "object" &&
    event !== null &&
    "type" in event &&
    ["Audit", "Checkpoint", "RaidRumor", "Meeting", "Detention"].includes(
      (event as NeighborhoodEvent).type
    )
  );
}

// =============================================================================
// ID GENERATION
// =============================================================================

let eventCounter = 0;

export function generateEventId(
  type: "global" | "city" | "neighborhood",
  prefix?: string
): string {
  eventCounter++;
  const typePrefix = prefix || type.substring(0, 3);
  return `${typePrefix}_${Date.now()}_${eventCounter.toString(36)}`;
}

export function resetEventCounter(): void {
  eventCounter = 0;
}

// =============================================================================
// RANDOM VALUE GENERATION
// =============================================================================

/**
 * Generate a random severity within range, clamped to 1-5
 */
export function randomSeverity(
  range: [number, number],
  seed?: number
): EventSeverity {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;
  const [min, max] = range;
  const value = Math.floor(random() * (max - min + 1)) + min;
  return Math.max(1, Math.min(5, value)) as EventSeverity;
}

/**
 * Generate a random integer within range
 */
export function randomInRange(range: [number, number], seed?: number): number {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;
  const [min, max] = range;
  return Math.floor(random() * (max - min + 1)) + min;
}

/**
 * Generate a random float within range
 */
export function randomFloatInRange(
  range: [number, number],
  seed?: number
): number {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;
  const [min, max] = range;
  return random() * (max - min) + min;
}

/**
 * Select a random item from an array
 */
export function randomItem<T>(items: readonly T[], seed?: number): T {
  const random = seed !== undefined ? seededRandom(seed) : Math.random;
  return items[Math.floor(random() * items.length)];
}

/**
 * Seeded random number generator for reproducible event generation
 */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state * 9301 + 49297) % 233280;
    return state / 233280;
  };
}

// =============================================================================
// WEIGHTED SELECTION
// =============================================================================

/**
 * Select an item from a weighted array
 * Items with higher weight are more likely to be selected
 */
export function weightedRandom<T extends { weight: number }>(
  items: T[],
  seed?: number
): T | null {
  if (items.length === 0) return null;

  const random = seed !== undefined ? seededRandom(seed) : Math.random;
  const totalWeight = items.reduce((sum, item) => sum + Math.max(0, item.weight), 0);

  if (totalWeight === 0) return null;

  let randomValue = random() * totalWeight;

  for (const item of items) {
    randomValue -= Math.max(0, item.weight);
    if (randomValue <= 0) return item;
  }

  return items[items.length - 1];
}

/**
 * Adjust weights based on pulse conditions
 */
export interface WeightModifier<T> {
  pulseKey: keyof T;
  multiplier: number; // weight *= (1 + pulseValue * multiplier)
}

export function adjustWeights<T extends Record<string, number>>(
  items: Array<{ weight: number } & T>,
  pulse: T,
  modifiers: WeightModifier<T>[]
): Array<{ weight: number } & T> {
  return items.map((item) => {
    let adjustedWeight = item.weight;

    for (const modifier of modifiers) {
      const pulseValue = pulse[modifier.pulseKey] as number;
      adjustedWeight *= 1 + pulseValue * modifier.multiplier;
    }

    return { ...item, weight: Math.max(0, adjustedWeight) };
  });
}

// =============================================================================
// TEMPLATE BUILDER FUNCTIONS
// =============================================================================

/**
 * Build a NeighborhoodEvent from a template
 */
export function buildNeighborhoodEvent(
  template: Partial<NeighborhoodEventTemplate> & Pick<NeighborhoodEventTemplate, "id" | "type" | "title">,
  neighborhoodId: string,
  turn: number,
  overrides?: Partial<NeighborhoodEvent>
): NeighborhoodEvent {
  const severity = overrides?.severity ??
    randomSeverity(template.severityRange ?? [1, 3]);

  const target = overrides?.target ??
    randomItem(template.targets ?? ["Family", "Block"]);

  return {
    id: overrides?.id ?? generateEventId("neighborhood", "nbe"),
    type: template.type,
    severity,
    target,
    neighborhoodId,
    title: template.title,
    description: overrides?.description ?? template.descriptionTemplate ?? "",
    startTurn: turn,
    effects: overrides?.effects ?? template.effects ?? {},
  };
}

/**
 * Build a CityEvent from a template
 */
export function buildCityEvent(
  template: Partial<CityEventTemplate> & Pick<CityEventTemplate, "id" | "category" | "title">,
  turn: number,
  neighborhoodIds: string[],
  overrides?: Partial<CityEvent>
): CityEvent {
  const visibility = overrides?.visibility ??
    randomInRange(template.visibilityRange ?? [30, 70]);

  const durationDays = overrides?.durationDays ??
    randomInRange(template.durationRange ?? [7, 21]);

  // Determine impact radius
  let impactRadius: "All" | string[] = "All";
  if (overrides?.impactRadius) {
    impactRadius = overrides.impactRadius;
  } else if (template.impactRadius !== undefined) {
    impactRadius = template.impactRadius;
  } else {
    // Default: 60% chance all, 40% random subset
    if (Math.random() < 0.6 || neighborhoodIds.length === 0) {
      impactRadius = "All";
    } else {
      impactRadius = neighborhoodIds.filter(() => Math.random() > 0.5);
      if (impactRadius.length === 0) impactRadius = "All";
    }
  }

  return {
    id: overrides?.id ?? generateEventId("city", "cte"),
    category: template.category,
    visibility,
    impactRadius,
    title: template.title,
    description: overrides?.description ?? template.descriptionTemplate ?? "",
    startTurn: turn,
    durationDays,
    effects: overrides?.effects ?? template.effects ?? {},
  };
}

/**
 * Build a GlobalEvent from a template
 */
export function buildGlobalEvent(
  template: {
    id: string;
    type: GlobalEventType;
    title: string;
    magnitudeRange?: [EventSeverity, EventSeverity];
    durationRange?: [number, number];
    effects?: GlobalEvent["effects"];
  },
  turn: number,
  pulse: GlobalPulse,
  overrides?: Partial<GlobalEvent>
): GlobalEvent {
  const magnitude = overrides?.magnitude ??
    randomSeverity(
      template.magnitudeRange ?? [1, 3],
      undefined
    );

  // Duration scales with magnitude
  const baseDuration = overrides?.durationDays ??
    randomInRange(template.durationRange ?? [7, 21]);

  return {
    id: overrides?.id ?? generateEventId("global", "gle"),
    type: template.type,
    magnitude,
    durationDays: baseDuration + magnitude * 3,
    title: template.title,
    description: overrides?.description ?? "",
    startTurn: turn,
    effects: overrides?.effects ?? template.effects ?? {},
  };
}

// =============================================================================
// TEMPLATE FACTORIES
// =============================================================================

/**
 * Create a NeighborhoodEventTemplate with defaults
 */
export function createNeighborhoodEventTemplate(
  template: Omit<NeighborhoodEventTemplate, "weight" | "effects"> & {
    weight?: number;
    effects?: NeighborhoodEventTemplate["effects"];
  }
): NeighborhoodEventTemplate {
  return {
    weight: template.weight ?? 1,
    effects: template.effects ?? {},
    ...template,
  };
}

/**
 * Create a CityEventTemplate with defaults
 */
export function createCityEventTemplate(
  template: Omit<CityEventTemplate, "weight" | "effects"> & {
    weight?: number;
    effects?: CityEventTemplate["effects"];
  }
): CityEventTemplate {
  return {
    weight: template.weight ?? 1,
    effects: template.effects ?? {},
    ...template,
  };
}

/**
 * Create neighborhood event templates in bulk
 */
export function createNeighborhoodEventTemplates(
  type: NeighborhoodEventType,
  configs: Array<{
    id: string;
    title: string;
    descriptionTemplate: string;
    severityRange?: [number, number];
    targets?: EventTarget[];
    weight?: number;
    triggers?: NeighborhoodEventTemplate["triggers"];
    effects?: NeighborhoodEventTemplate["effects"];
  }>
): NeighborhoodEventTemplate[] {
  return configs.map((config) =>
    createNeighborhoodEventTemplate({
      type,
      severityRange: config.severityRange ?? [1, 3],
      targets: config.targets ?? ["Family", "Block"],
      ...config,
    })
  );
}

/**
 * Create city event templates in bulk
 */
export function createCityEventTemplates(
  category: CityEventCategory,
  configs: Array<{
    id: string;
    title: string;
    descriptionTemplate: string;
    visibilityRange?: [number, number];
    durationRange?: [number, number];
    weight?: number;
    effects?: CityEventTemplate["effects"];
  }>
): CityEventTemplate[] {
  return configs.map((config) =>
    createCityEventTemplate({
      category,
      visibilityRange: config.visibilityRange ?? [30, 70],
      durationRange: config.durationRange ?? [7, 21],
      ...config,
    })
  );
}

// =============================================================================
// TEMPLATE VALIDATION
// =============================================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validate a NeighborhoodEventTemplate
 */
export function validateNeighborhoodEventTemplate(
  template: unknown
): ValidationResult {
  const errors: string[] = [];

  if (typeof template !== "object" || template === null) {
    return { valid: false, errors: ["Template must be an object"] };
  }

  const t = template as Record<string, unknown>;

  if (typeof t.id !== "string" || t.id.trim() === "") {
    errors.push("id must be a non-empty string");
  }

  const validTypes: NeighborhoodEventType[] = ["Audit", "Checkpoint", "RaidRumor", "Meeting", "Detention"];
  if (!validTypes.includes(t.type as NeighborhoodEventType)) {
    errors.push(`type must be one of: ${validTypes.join(", ")}`);
  }

  if (typeof t.title !== "string" || t.title.trim() === "") {
    errors.push("title must be a non-empty string");
  }

  if (typeof t.descriptionTemplate !== "string") {
    errors.push("descriptionTemplate must be a string");
  }

  if (typeof t.weight !== "number" || t.weight < 0) {
    errors.push("weight must be a non-negative number");
  }

  if (!Array.isArray(t.targets) || t.targets.length === 0) {
    errors.push("targets must be a non-empty array");
  }

  const validTargets: EventTarget[] = ["Family", "Employer", "School", "Block"];
  if (Array.isArray(t.targets)) {
    for (const target of t.targets) {
      if (!validTargets.includes(target as EventTarget)) {
        errors.push(`Invalid target: ${target}`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Validate a CityEventTemplate
 */
export function validateCityEventTemplate(template: unknown): ValidationResult {
  const errors: string[] = [];

  if (typeof template !== "object" || template === null) {
    return { valid: false, errors: ["Template must be an object"] };
  }

  const t = template as Record<string, unknown>;

  if (typeof t.id !== "string" || t.id.trim() === "") {
    errors.push("id must be a non-empty string");
  }

  const validCategories: CityEventCategory[] = ["Policy", "Budget", "Infrastructure", "Media"];
  if (!validCategories.includes(t.category as CityEventCategory)) {
    errors.push(`category must be one of: ${validCategories.join(", ")}`);
  }

  if (typeof t.title !== "string" || t.title.trim() === "") {
    errors.push("title must be a non-empty string");
  }

  if (typeof t.descriptionTemplate !== "string") {
    errors.push("descriptionTemplate must be a string");
  }

  if (typeof t.weight !== "number" || t.weight < 0) {
    errors.push("weight must be a non-negative number");
  }

  return { valid: errors.length === 0, errors };
}

// =============================================================================
// EVENT TRIGGER CHECKING
// =============================================================================

/**
 * Check if pulse values meet trigger conditions
 */
export function checkTriggers<T extends Record<string, number> | object>(
  pulse: T,
  triggers?: Partial<Record<keyof T | string, number>>
): boolean {
  if (!triggers) return true;

  for (const [key, threshold] of Object.entries(triggers)) {
    if (threshold === undefined) continue;
    const pulseValue = (pulse as Record<string, unknown>)[key];
    if (typeof pulseValue !== "number") continue;

    // Key starting with "min" means pulse must be >= threshold
    if (key.startsWith("min") && pulseValue < threshold) {
      return false;
    }
    // Key starting with "max" means pulse must be <= threshold
    if (key.startsWith("max") && pulseValue > threshold) {
      return false;
    }
  }

  return true;
}

/**
 * Calculate trigger probability based on pulse proximity to thresholds
 */
export function triggerProbability(
  pulse: Record<string, number>,
  triggers?: Partial<Record<string, number>>
): number {
  if (!triggers) return 1.0;

  let probability = 1.0;

  for (const [key, threshold] of Object.entries(triggers)) {
    if (threshold === undefined) continue;
    const pulseValue = pulse[key];
    if (typeof pulseValue !== "number") continue;

    if (key.startsWith("min")) {
      // Scale probability based on how far above minimum we are
      const excess = pulseValue - threshold;
      probability *= Math.min(1, 0.2 + excess / 50);
    }

    if (key.startsWith("max")) {
      // Scale probability based on how far below maximum we are
      const deficit = threshold - pulseValue;
      probability *= Math.min(1, 0.2 + deficit / 50);
    }
  }

  return Math.max(0, Math.min(1, probability));
}

// =============================================================================
// EFFECT APPLICATION
// =============================================================================

/**
 * Apply event effects to a pulse, clamping values to 0-100
 */
export function applyEffects<
  T extends Record<string, number>,
  E extends Partial<Record<keyof T, number>>
>(pulse: T, effects: E, clamp = true): T {
  const result = { ...pulse };

  for (const [key, value] of Object.entries(effects)) {
    if (key in result && typeof value === "number") {
      let newValue = (result as Record<string, number>)[key] + value;
      if (clamp) {
        newValue = Math.max(0, Math.min(100, newValue));
      }
      (result as Record<string, number>)[key] = newValue;
    }
  }

  return result;
}

/**
 * Scale effects by a multiplier
 */
export function scaleEffects<T extends Record<string, number>>(
  effects: Partial<Record<keyof T, number>>,
  multiplier: number
): Partial<Record<keyof T, number>> {
  const scaled: Partial<Record<keyof T, number>> = {};

  for (const [key, value] of Object.entries(effects)) {
    if (value === undefined) continue;
    scaled[key as keyof T] = (value * multiplier) as T[keyof T];
  }

  return scaled;
}

// =============================================================================
// EVENT FILTERING
// =============================================================================

/**
 * Filter neighborhood event templates by pulse conditions
 */
export function filterNeighborhoodEventsByPulse(
  templates: NeighborhoodEventTemplate[],
  pulse: NeighborhoodPulse
): NeighborhoodEventTemplate[] {
  return templates.filter((template) =>
    checkTriggers(pulse, template.triggers)
  );
}

/**
 * Filter city event templates by category
 */
export function filterCityEventsByCategory(
  templates: CityEventTemplate[],
  categories: CityEventCategory[]
): CityEventTemplate[] {
  const categorySet = new Set(categories);
  return templates.filter((t) => categorySet.has(t.category));
}

// =============================================================================
// TEMPLATE INTERPOLATION
// =============================================================================

/**
 * Replace placeholders in description templates with context values
 */
export function interpolateDescription(
  template: string,
  context: Record<string, string | number>
): string {
  let result = template;

  for (const [key, value] of Object.entries(context)) {
    const placeholder = `{${key}}`;
    result = result.replaceAll(placeholder, String(value));
  }

  return result;
}

/**
 * Create a context object for event description interpolation
 */
export function createEventContext(
  neighborhoodId: string,
  neighborhoodName?: string,
  cityName?: string,
  turn?: number
): Record<string, string | number> {
  return {
    neighborhood: neighborhoodName || neighborhoodId,
    neighborhoodId,
    city: cityName || "",
    turn: turn ?? 0,
    day: turn ? turn * 7 : 0, // Assuming 1 turn = 7 days
  };
}

// =============================================================================
// EVENT AGGREGATION
// =============================================================================

/**
 * Calculate total active effect from a list of events
 */
export function aggregateEventEffects<T extends Record<string, number>>(
  events: Array<{ effects: Partial<Record<keyof T, number>> }>
): Partial<Record<keyof T, number>> {
  const aggregated: Partial<Record<keyof T, number>> = {};

  for (const event of events) {
    for (const [key, value] of Object.entries(event.effects)) {
      if (value === undefined) continue;
      const current = aggregated[key as keyof T] ?? 0;
      aggregated[key as keyof T] = (current + value) as T[keyof T];
    }
  }

  return aggregated;
}

/**
 * Find events affecting a specific neighborhood
 */
export function findEventsForNeighborhood(
  cityEvents: CityEvent[],
  neighborhoodId: string
): CityEvent[] {
  return cityEvents.filter((event) => {
    if (event.impactRadius === "All") return true;
    return event.impactRadius.includes(neighborhoodId);
  });
}

// =============================================================================
// EXPORT UTILITIES
// =============================================================================

/**
 * Convert a NeighborhoodEventTemplate to a plain JSON object
 */
export function serializeNeighborhoodEventTemplate(
  template: NeighborhoodEventTemplate
): Record<string, unknown> {
  return { ...template };
}

/**
 * Convert a CityEventTemplate to a plain JSON object
 */
export function serializeCityEventTemplate(
  template: CityEventTemplate
): Record<string, unknown> {
  return { ...template };
}

/**
 * Parse a plain object into a NeighborhoodEventTemplate
 */
export function parseNeighborhoodEventTemplate(
  data: unknown
): NeighborhoodEventTemplate | null {
  const validation = validateNeighborhoodEventTemplate(data);
  if (!validation.valid) return null;
  return data as NeighborhoodEventTemplate;
}

/**
 * Parse a plain object into a CityEventTemplate
 */
export function parseCityEventTemplate(
  data: unknown
): CityEventTemplate | null {
  const validation = validateCityEventTemplate(data);
  if (!validation.valid) return null;
  return data as CityEventTemplate;
}
