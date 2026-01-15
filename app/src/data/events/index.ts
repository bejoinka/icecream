/**
 * Event Pools Index
 *
 * Exports all base event templates for the game.
 */

// Neighborhood events
export {
  AUDIT_EVENTS,
  CHECKPOINT_EVENTS,
  RAID_RUMOR_EVENTS,
  MEETING_EVENTS,
  DETENTION_EVENTS,
  NEIGHBORHOOD_EVENT_POOL,
} from "./neighborhood-events";

// City events
export {
  POLICY_EVENTS,
  BUDGET_EVENTS,
  INFRASTRUCTURE_EVENTS,
  MEDIA_EVENTS,
  CITY_EVENT_POOL,
} from "./city-events";

// Global events
export {
  EXECUTIVE_EVENTS,
  JUDICIAL_EVENTS,
  MEDIA_GLOBAL_EVENTS,
  SECURITY_EVENTS,
  GLOBAL_EVENT_POOL,
} from "./global-events";

export type { GlobalEventTemplate } from "./global-events";
