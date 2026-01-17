/**
 * Type exports for the icecream game
 */

// Pulse types (slow-moving state variables)
export * from "./pulse";

// Event types (discrete shocks)
export * from "./event";

// City and neighborhood types
export * from "./city";

// Complete game state
export * from "./game";

// Database types (Supabase)
export * from "./database";

// Re-export UPDATE_CADENCE from pulse to avoid ambiguity
export { UPDATE_CADENCE } from "./pulse";
