/**
 * Event Types - Discrete shocks that re-weight pulses
 * Based on SYSTEMS_PULSES_AND_EVENTS.md spec
 */

/** Global event types */
export type GlobalEventType = "Executive" | "Judicial" | "Media" | "Security";

/** City event categories */
export type CityEventCategory =
  | "Policy"
  | "Budget"
  | "Infrastructure"
  | "Media";

/** Neighborhood event types */
export type NeighborhoodEventType =
  | "Audit"
  | "Checkpoint"
  | "RaidRumor"
  | "Meeting"
  | "Detention";

/** Event target types */
export type EventTarget = "Family" | "Employer" | "School" | "Block";

/** Event severity (1-5 scale) */
export type EventSeverity = 1 | 2 | 3 | 4 | 5;

/**
 * Global event - rare, high-impact national events
 */
export interface GlobalEvent {
  id: string;
  type: GlobalEventType;
  magnitude: EventSeverity;
  durationDays: number;
  title: string;
  description: string;
  /** Turn when event started */
  startTurn: number;
  /** Effects on GlobalPulse (additive modifiers) */
  effects: Partial<{
    enforcementClimate: number;
    mediaNarrative: number;
    judicialAlignment: number;
    politicalVolatility: number;
  }>;
}

/**
 * City event - re-weights neighborhoods
 */
export interface CityEvent {
  id: string;
  category: CityEventCategory;
  /** 0-100: how much player understands about this event */
  visibility: number;
  /** Which neighborhoods are affected */
  impactRadius: "All" | string[];
  title: string;
  description: string;
  startTurn: number;
  durationDays: number;
  /** Effects on CityPulse */
  effects: Partial<{
    federalCooperation: number;
    dataDensity: number;
    politicalCover: number;
    civilSocietyCapacity: number;
    bureaucraticInertia: number;
  }>;
}

/**
 * Neighborhood event - frequent, direct player-facing events
 */
export interface NeighborhoodEvent {
  id: string;
  type: NeighborhoodEventType;
  severity: EventSeverity;
  target: EventTarget;
  neighborhoodId: string;
  title: string;
  description: string;
  startTurn: number;
  /** Effects on NeighborhoodPulse */
  effects: Partial<{
    trust: number;
    suspicion: number;
    enforcementVisibility: number;
    communityDensity: number;
    economicPrecarity: number;
  }>;
}

/** Union type for all events */
export type GameEvent = GlobalEvent | CityEvent | NeighborhoodEvent;

/** Active events tracker */
export interface ActiveEvents {
  global: GlobalEvent[];
  city: CityEvent[];
  neighborhood: NeighborhoodEvent[];
}
