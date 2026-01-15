/**
 * Game State Types Module
 *
 * Exports all game state types, defaults, validation, and factory functions.
 */

// Core types and defaults
export type {
  GlobalPulse,
  GlobalEvent,
  GlobalEventType,
  CityPulse,
  CityEvent,
  CityEventCategory,
  NeighborhoodPulse,
  NeighborhoodEvent,
  NeighborhoodEventType,
  NeighborhoodEventTarget,
  Neighborhood,
  City,
  FamilyImpact,
  TurnPhase,
  TurnState,
  GameOutcome,
  GameResult,
  GameState,
} from "./game-state";

export {
  DEFAULT_GLOBAL_PULSE,
  DEFAULT_CITY_PULSE,
  DEFAULT_NEIGHBORHOOD_PULSE,
  DEFAULT_FAMILY_IMPACT,
  DEFAULT_TURN_STATE,
} from "./game-state";

// Validation utilities
export {
  clamp,
  clamp100,
  validateGlobalPulse,
  validateCityPulse,
  validateNeighborhoodPulse,
  validateFamilyImpact,
  getEnforcementBand,
  getCooperationBand,
  getMediaBand,
} from "./validation";

export type {
  EnforcementBand,
  CooperationBand,
  MediaBand,
} from "./validation";

// Factory functions
export {
  createNeighborhood,
  createCity,
  createGameState,
  createDemoGameState,
} from "./factory";

export type {
  CreateNeighborhoodOptions,
  CreateCityOptions,
  CreateGameStateOptions,
} from "./factory";
