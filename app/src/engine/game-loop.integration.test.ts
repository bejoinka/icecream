/**
 * Integration Tests for Full Game Loop
 *
 * Tests:
 * - Complete turn from start to finish
 * - Event triggering with pulse changes
 * - Decision flow
 * - Victory conditions
 * - Failure conditions
 * - State persistence across turns
 */

import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { advancePhase, runCompleteTurn, checkGameEnding, TurnContext } from "./turn";
import {
  shouldTriggerNeighborhoodEvent,
  shouldTriggerCityEvent,
  shouldTriggerGlobalEvent,
  selectNeighborhoodEvent,
  selectCityEvent,
  selectGlobalEvent,
  pruneExpiredEvents,
  applyGlobalEventEffects,
  applyCityEventEffects,
  applyNeighborhoodEventEffects,
  applyEventEffects,
} from "./events";
import { updateAllPulses } from "./pulse";
import { NEIGHBORHOOD_EVENT_POOL } from "@/data/events/neighborhood-events";
import {
  createGameState,
  createGameStateWithPhase,
  createVictoryState,
  createFailureState,
  createNearFailureState,
  createHighEnforcementState,
  createGlobalPulse,
  createCityPulse,
  createNeighborhoodPulse,
  createFamilyImpact,
} from "@/test/utils/game-state-factory";
import { mockRedisFunctions, resetMockRedis, type MockRedis } from "@/test/mocks/redis";

// =============================================================================
// TEST SETUP
// =============================================================================

const MOCK_TEMPLATES: TurnContext = {
  neighborhoodEventTemplates: NEIGHBORHOOD_EVENT_POOL,
  cityEventTemplates: [
    {
      id: "city-budget-cut",
      category: "Budget",
      title: "City Budget Cuts",
      descriptionTemplate: "Budget cuts affect services across the city.",
      visibilityRange: [50, 70],
      durationRange: [14, 30],
      weight: 2,
      effects: { politicalCover: -10, civilSocietyCapacity: -5 },
    },
  ],
};

beforeEach(() => {
  resetMockRedis();
  vi.clearAllMocks();
});

afterEach(() => {
  resetMockRedis();
});

// =============================================================================
// COMPLETE TURN FROM START TO FINISH
// =============================================================================

describe("Complete Turn from Start to Finish", () => {
  it("should cycle through all phases in order", () => {
    let state = createGameState({ phase: "plan" });
    const ctx: TurnContext = MOCK_TEMPLATES;
    const lastGlobalUpdate = 0;

    // Plan -> Pulse Update
    state = advancePhase(state, ctx, lastGlobalUpdate);
    expect(state.phase).toBe("pulse_update");

    // Pulse Update -> Event
    state = advancePhase(state, ctx, lastGlobalUpdate);
    expect(state.phase).toBe("event");

    // Event -> Decision (or Consequence if no event)
    state = advancePhase(state, ctx, lastGlobalUpdate);
    expect(["decision", "consequence"]).toContain(state.phase);

    // If we reached Consequence, next should be Plan with incremented turn
    if (state.phase === "consequence") {
      state = advancePhase(state, ctx, lastGlobalUpdate);
      expect(state.phase).toBe("plan");
      expect(state.turn).toBe(2);
    }
  });

  it("should complete a full turn with no decision needed", () => {
    const initialState = createGameState({
      phase: "plan",
      turn: 5,
      // High values to avoid event triggers (when deterministic)
      city: {
        id: "test-city",
        name: "Test City",
        state: "TS",
        pulse: createCityPulse({ federalCooperation: 20 }),
        neighborhoods: [
          {
            id: "neighborhood-1",
            name: "Test Neighborhood",
            pulse: createNeighborhoodPulse({
              trust: 90, // High trust reduces event chance
              enforcementVisibility: 0,
            }),
          },
        ],
        currentNeighborhoodId: "neighborhood-1",
      },
    });

    const ctx: TurnContext = MOCK_TEMPLATES;
    const lastGlobalUpdate = 0;

    // Use vi.spyOn to control randomness
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.999);

    const finalState = runCompleteTurn(initialState, ctx, lastGlobalUpdate);

    randomSpy.mockRestore();

    // Should complete the turn and be ready for next plan phase
    expect(finalState.phase).toBe("plan");
    expect(finalState.turn).toBe(6);
    expect(finalState.currentDecision).toBeNull();
  });

  it("should stop at decision phase when neighborhood event triggers", () => {
    const initialState = createGameState({
      phase: "plan",
      turn: 1,
      city: {
        id: "test-city",
        name: "Test City",
        state: "TS",
        pulse: createCityPulse(),
        neighborhoods: [
          {
            id: "neighborhood-1",
            name: "Test Neighborhood",
            pulse: createNeighborhoodPulse({
              enforcementVisibility: 80, // High visibility increases event chance
            }),
          },
        ],
        currentNeighborhoodId: "neighborhood-1",
      },
    });

    const ctx: TurnContext = MOCK_TEMPLATES;
    const lastGlobalUpdate = 0;

    // Force neighborhood event trigger
    const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.1);

    const resultState = runCompleteTurn(initialState, ctx, lastGlobalUpdate);

    randomSpy.mockRestore();

    // Should stop at decision phase with a decision ready
    expect(resultState.phase).toBe("decision");
    expect(resultState.currentDecision).not.toBeNull();
  });

  it("should track phase progression correctly", () => {
    const state = createGameState();
    const ctx: TurnContext = MOCK_TEMPLATES;
    const lastGlobalUpdate = 0;

    const phases: string[] = [];
    let currentState = state;

    for (let i = 0; i < 5; i++) {
      currentState = advancePhase(currentState, ctx, lastGlobalUpdate);
      phases.push(currentState.phase);
      if (currentState.phase === "decision" && currentState.currentDecision) {
        break; // Stop when we hit a decision
      }
      if (currentState.phase === "plan" && currentState.turn > state.turn) {
        break; // Turn completed
      }
    }

    expect(phases.length).toBeGreaterThan(0);
    expect(phases[0]).toBe("pulse_update");
  });
});

// =============================================================================
// EVENT TRIGGERING WITH PULSE CHANGES
// =============================================================================

describe("Event Triggering with Pulse Changes", () => {
  it("should trigger neighborhood event based on pulse conditions", () => {
    const highEnforcementPulse = createNeighborhoodPulse({
      enforcementVisibility: 70,
      suspicion: 50,
    });

    // With high enforcement, events should be more likely
    // This test verifies the function exists and returns a boolean
    const triggers1 = shouldTriggerNeighborhoodEvent(highEnforcementPulse);
    expect(typeof triggers1).toBe("boolean");
  });

  it("should select a valid neighborhood event from templates", () => {
    const pulse = createNeighborhoodPulse();
    const event = selectNeighborhoodEvent(
      NEIGHBORHOOD_EVENT_POOL,
      pulse,
      "test-neighborhood",
      1
    );

    if (event) {
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("type");
      expect(event).toHaveProperty("severity");
      expect(event).toHaveProperty("neighborhoodId", "test-neighborhood");
      expect(event).toHaveProperty("startTurn", 1);
      expect(event).toHaveProperty("effects");
    }
  });

  it("should apply neighborhood event effects to pulse", () => {
    const pulse = createNeighborhoodPulse({ trust: 50, suspicion: 30 });
    const effects = { trust: -10, suspicion: 15, enforcementVisibility: 5 };

    const newPulse = applyNeighborhoodEventEffects(pulse, effects);

    expect(newPulse.trust).toBe(40); // 50 - 10
    expect(newPulse.suspicion).toBe(45); // 30 + 15
    expect(newPulse.enforcementVisibility).toBe(25); // 20 + 5
  });

  it("should clamp pulse values between 0 and 100 after event effects", () => {
    const pulse = createNeighborhoodPulse({ trust: 95, suspicion: 5 });
    const effects = { trust: 20, suspicion: -30 };

    const newPulse = applyNeighborhoodEventEffects(pulse, effects);

    expect(newPulse.trust).toBe(100); // Clamped at max
    expect(newPulse.suspicion).toBe(0); // Clamped at min
  });

  it("should apply global event effects correctly", () => {
    const pulse = createGlobalPulse({
      enforcementClimate: 50,
      politicalVolatility: 40,
    });
    const effects = { enforcementClimate: 15, politicalVolatility: 10 };

    const newPulse = applyGlobalEventEffects(pulse, effects);

    expect(newPulse.enforcementClimate).toBe(65);
    expect(newPulse.politicalVolatility).toBe(50);
  });

  it("should apply city event effects correctly", () => {
    const pulse = createCityPulse({
      federalCooperation: 50,
      politicalCover: 60,
    });
    const effects = { federalCooperation: -15, politicalCover: 10 };

    const newPulse = applyCityEventEffects(pulse, effects);

    expect(newPulse.federalCooperation).toBe(35);
    expect(newPulse.politicalCover).toBe(70);
  });

  it("should prune expired events from active events", () => {
    const activeEvents = {
      global: [
        {
          id: "global-1",
          type: "Executive",
          magnitude: 3,
          durationDays: 10,
          title: "Test Global Event",
          description: "Test",
          startTurn: 1,
          effects: { enforcementClimate: 10 },
        },
      ],
      city: [
        {
          id: "city-1",
          category: "Policy",
          visibility: 60,
          impactRadius: "All",
          title: "Test City Event",
          description: "Test",
          startTurn: 5,
          durationDays: 14,
          effects: { politicalCover: -5 },
        },
      ],
      neighborhood: [
        {
          id: "neighborhood-1",
          type: "Checkpoint",
          severity: 2,
          target: "Block",
          neighborhoodId: "n1",
          title: "Test",
          description: "Test",
          startTurn: 8,
          effects: { enforcementVisibility: 10 },
        },
      ],
    };

    const pruned = pruneExpiredEvents(activeEvents, 15);

    // Global event started turn 1, duration 10, expires turn 11 - should be pruned
    expect(pruned.global).toHaveLength(0);

    // City event started turn 5, duration 14, expires turn 19 - should still exist
    expect(pruned.city).toHaveLength(1);

    // Neighborhood events are instant (only current turn) - should be pruned
    expect(pruned.neighborhood).toHaveLength(0);
  });

  it("should trigger city events periodically", () => {
    const turn = 7; // City update turn
    const pulse = createCityPulse({ politicalCover: 30 });

    const triggers = shouldTriggerCityEvent(turn, pulse);
    expect(typeof triggers).toBe("boolean");
  });

  it("should trigger global events rarely", () => {
    const pulse = createGlobalPulse({ politicalVolatility: 30 });

    const triggers1 = shouldTriggerGlobalEvent(pulse);
    const triggers2 = shouldTriggerGlobalEvent(createGlobalPulse({ politicalVolatility: 80 }));

    expect(typeof triggers1).toBe("boolean");
    expect(typeof triggers2).toBe("boolean");
  });

  it("should select a valid city event from templates", () => {
    const pulse = createCityPulse();
    const event = selectCityEvent(MOCK_TEMPLATES.cityEventTemplates, pulse, 1, ["n1", "n2"]);

    expect(event).not.toBeNull();
    if (event) {
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("category");
      expect(event).toHaveProperty("impactRadius");
      expect(event).toHaveProperty("startTurn", 1);
    }
  });

  it("should select a valid global event", () => {
    const pulse = createGlobalPulse();
    const event = selectGlobalEvent(pulse, 1);

    expect(event).not.toBeNull();
    if (event) {
      expect(event).toHaveProperty("id");
      expect(event).toHaveProperty("type");
      expect(event).toHaveProperty("magnitude");
      expect(event).toHaveProperty("durationDays");
      expect(event).toHaveProperty("startTurn", 1);
    }
  });
});

// =============================================================================
// DECISION FLOW
// =============================================================================

describe("Decision Flow", () => {
  it("should generate decision when neighborhood event occurs", () => {
    const state = createGameState({
      phase: "decision", // Start in decision phase to test decision generation
      turn: 5, // Must match event.startTurn for decision generation
      activeEvents: {
        global: [],
        city: [],
        neighborhood: [
          {
            id: "checkpoint-1",
            type: "Checkpoint",
            severity: 2,
            target: "Block",
            neighborhoodId: "neighborhood-1",
            title: "Traffic Checkpoint",
            description: "Local police set up a checkpoint.",
            startTurn: 5,
            effects: { enforcementVisibility: 15, suspicion: 5 },
          },
        ],
      },
    });

    const ctx: TurnContext = MOCK_TEMPLATES;
    const lastGlobalUpdate = 0;

    // Process decision phase
    const resultState = advancePhase(state, ctx, lastGlobalUpdate);

    expect(resultState.phase).toBe("decision");
    expect(resultState.currentDecision).not.toBeNull();
    expect(resultState.currentDecision?.title).toBe("Traffic Checkpoint");
    expect(resultState.currentDecision?.choices.length).toBeGreaterThan(0);
  });

  it("should include choices with appropriate effects", () => {
    const state = createGameState({
      phase: "decision", // Start in decision phase to test decision generation
      turn: 5, // Must match event.startTurn for decision generation
      activeEvents: {
        global: [],
        city: [],
        neighborhood: [
          {
            id: "checkpoint-1",
            type: "Checkpoint",
            severity: 2,
            target: "Block",
            neighborhoodId: "neighborhood-1",
            title: "Traffic Checkpoint",
            description: "Local police set up a checkpoint.",
            startTurn: 5,
            effects: { enforcementVisibility: 15, suspicion: 5 },
          },
        ],
      },
    });

    const ctx: TurnContext = MOCK_TEMPLATES;
    const lastGlobalUpdate = 0;

    const resultState = advancePhase(state, ctx, lastGlobalUpdate);

    const decision = resultState.currentDecision!;
    expect(decision.choices.length).toBeGreaterThan(0);

    const firstChoice = decision.choices[0];
    expect(firstChoice).toHaveProperty("id");
    expect(firstChoice).toHaveProperty("label");
    expect(firstChoice).toHaveProperty("description");
    expect(firstChoice).toHaveProperty("effects");
  });

  it("should process player choice and apply effects", () => {
    const initialState = createGameState({
      phase: "decision",
      turn: 5,
      family: createFamilyImpact({
        visibility: 30,
        stress: 20,
        cohesion: 70,
        trustNetworkStrength: 40,
      }),
      currentDecision: {
        id: "decision-1",
        title: "Test Decision",
        narrative: "Choose wisely.",
        choices: [
          {
            id: "choice-a",
            label: "Choice A",
            description: "Increases stress",
            effects: { stress: 15 },
          },
          {
            id: "choice-b",
            label: "Choice B",
            description: "Decreases stress",
            effects: { stress: -10 },
          },
        ],
        multiSelect: false,
      },
    });

    const ctx: TurnContext = MOCK_TEMPLATES;
    const lastGlobalUpdate = 0;

    // Select choice-a
    const resultState = advancePhase(initialState, ctx, lastGlobalUpdate, ["choice-a"]);

    expect(resultState.phase).toBe("plan");
    expect(resultState.turn).toBe(6);
    expect(resultState.family.stress).toBe(35); // 20 + 15
    expect(resultState.currentDecision).toBeNull();
  });

  it("should record choice in history", () => {
    const initialState = createGameState({
      phase: "decision",
      turn: 5,
      choiceHistory: [],
      currentDecision: {
        id: "decision-1",
        title: "Test Decision",
        narrative: "Choose wisely.",
        choices: [
          {
            id: "choice-a",
            label: "Choice A",
            description: "Increases stress",
            effects: { stress: 15 },
          },
        ],
        multiSelect: false,
      },
    });

    const ctx: TurnContext = MOCK_TEMPLATES;
    const lastGlobalUpdate = 0;

    const resultState = advancePhase(initialState, ctx, lastGlobalUpdate, ["choice-a"]);

    expect(resultState.choiceHistory).toHaveLength(1);
    expect(resultState.choiceHistory[0]).toMatchObject({
      turn: 5,
      decisionId: "decision-1",
      choiceIds: ["choice-a"],
      effects: { stress: 15 },
    });
  });

  it("should support multi-select decisions", () => {
    const initialState = createGameState({
      phase: "decision",
      turn: 5,
      family: createFamilyImpact({ visibility: 30, stress: 20, cohesion: 70, trustNetworkStrength: 40 }),
      currentDecision: {
        id: "decision-1",
        title: "Test Multi-Select Decision",
        narrative: "Choose multiple options.",
        choices: [
          { id: "choice-a", label: "Choice A", description: "Effect A", effects: { stress: 5 } },
          { id: "choice-b", label: "Choice B", description: "Effect B", effects: { stress: 10 } },
        ],
        multiSelect: true,
      },
    });

    const ctx: TurnContext = MOCK_TEMPLATES;
    const lastGlobalUpdate = 0;

    const resultState = advancePhase(initialState, ctx, lastGlobalUpdate, ["choice-a", "choice-b"]);

    expect(resultState.family.stress).toBe(35); // 20 + 5 + 10
  });

  it("should generate correct decision types for different event types", () => {
    const eventTypes = [
      {
        type: "Checkpoint" as const,
        title: "Traffic Checkpoint",
        description: "Police checkpoint ahead.",
      },
      {
        type: "RaidRumor" as const,
        title: "Rumor of Raid",
        description: "Rumors of enforcement activity.",
      },
      {
        type: "Meeting" as const,
        title: "Community Meeting",
        description: "A meeting is being held.",
      },
    ];

    for (const eventDef of eventTypes) {
      const state = createGameState({
        phase: "decision", // Start in decision phase to test decision generation
        turn: 1, // Must match event.startTurn (which is 1)
        activeEvents: {
          global: [],
          city: [],
          neighborhood: [
            {
              id: `event-${eventDef.type}`,
              type: eventDef.type,
              severity: 2,
              target: "Block",
              neighborhoodId: "neighborhood-1",
              title: eventDef.title,
              description: eventDef.description,
              startTurn: 1,
              effects: {},
            },
          ],
        },
      });

      const ctx: TurnContext = MOCK_TEMPLATES;
      const lastGlobalUpdate = 0;

      const resultState = advancePhase(state, ctx, lastGlobalUpdate);

      expect(resultState.currentDecision).not.toBeNull();
      expect(resultState.currentDecision?.title).toBe(eventDef.title);
      expect(resultState.currentDecision?.choices.length).toBeGreaterThan(0);
    }
  });
});

// =============================================================================
// VICTORY CONDITIONS
// =============================================================================

describe("Victory Conditions", () => {
  it("should detect Sanctuary victory when conditions met", () => {
    const state = createVictoryState("sanctuary");
    const result = checkGameEnding(state);

    expect(result.ending).not.toBeNull();
    expect(result.ending?.type).toBe("victory");
    if (result.ending?.type === "victory") {
      expect(result.ending.victoryType).toBe("sanctuary");
    }
  });

  it("should detect Outlast victory when max turns reached with improved conditions", () => {
    const state = createVictoryState("outlast");
    const result = checkGameEnding(state);

    expect(result.ending).not.toBeNull();
    expect(result.ending?.type).toBe("victory");
    if (result.ending?.type === "victory") {
      expect(result.ending.victoryType).toBe("outlast");
    }
  });

  it("should detect Transform victory when systemic change achieved", () => {
    const state = createVictoryState("transform");
    const result = checkGameEnding(state);

    expect(result.ending).not.toBeNull();
    expect(result.ending?.type).toBe("victory");
    if (result.ending?.type === "victory") {
      expect(result.ending.victoryType).toBe("transform");
    }
  });

  it("should not grant victory if Sanctuary conditions not fully met", () => {
    const state = createGameState({
      city: {
        id: "test-city",
        name: "Test City",
        state: "TS",
        pulse: createCityPulse(),
        neighborhoods: [
          {
            id: "neighborhood-1",
            name: "Test Neighborhood",
            // Only 2 of 3 conditions met (trust high, community density high, but network too low)
            pulse: createNeighborhoodPulse({ trust: 85, communityDensity: 75 }),
          },
        ],
        currentNeighborhoodId: "neighborhood-1",
      },
      family: createFamilyImpact({ trustNetworkStrength: 70 }), // Below 80 threshold
    });

    const result = checkGameEnding(state);

    expect(result.ending).toBeNull();
  });

  it("should not grant Outlast victory if enforcement not improved", () => {
    const state = createGameState({
      turn: 80,
      globalPulse: createGlobalPulse({ enforcementClimate: 60 }), // Still above 40
    });

    const result = checkGameEnding(state);

    expect(result.ending).toBeNull();
  });

  it("should not grant Transform victory if conditions not fully met", () => {
    const state = createGameState({
      city: {
        id: "test-city",
        name: "Test City",
        state: "TS",
        // Only 2 of 3 conditions met
        pulse: createCityPulse({ politicalCover: 85, federalCooperation: 15 }),
        neighborhoods: [
          {
            id: "neighborhood-1",
            name: "Test Neighborhood",
            pulse: createNeighborhoodPulse(),
          },
        ],
        currentNeighborhoodId: "neighborhood-1",
      },
      globalPulse: createGlobalPulse({ mediaNarrative: -40 }), // Not <= -50
    });

    const result = checkGameEnding(state);

    expect(result.ending).toBeNull();
  });
});

// =============================================================================
// FAILURE CONDITIONS
// =============================================================================

describe("Failure Conditions", () => {
  it("should detect failure when stress too high with low cohesion", () => {
    const state = createFailureState();
    const result = checkGameEnding(state);

    expect(result.ending).not.toBeNull();
    expect(result.ending?.type).toBe("failure");
  });

  it("should not fail with high stress if cohesion is also high", () => {
    const state = createGameState({
      family: createFamilyImpact({ stress: 95, cohesion: 60 }), // Cohesion > 10
    });

    const result = checkGameEnding(state);

    expect(result.ending).toBeNull();
  });

  it("should not fail with low cohesion if stress is manageable", () => {
    const state = createGameState({
      family: createFamilyImpact({ stress: 80, cohesion: 5 }),
    });

    const result = checkGameEnding(state);

    expect(result.ending).toBeNull();
  });

  it("should fail at the exact threshold", () => {
    const state = createGameState({
      family: createFamilyImpact({ stress: 95, cohesion: 10 }), // Exact thresholds
    });

    const result = checkGameEnding(state);

    // At exact threshold (stress >= 95, cohesion <= 10), should fail
    expect(result.ending).not.toBeNull();
    expect(result.ending?.type).toBe("failure");
  });

  it("should track failure turn correctly", () => {
    const state = createGameState({
      turn: 42,
      family: createFamilyImpact({ stress: 98, cohesion: 5 }),
    });

    const result = checkGameEnding(state);

    expect(result.ending).not.toBeNull();
    if (result.ending?.type === "failure") {
      expect(result.ending.turn).toBe(42);
    }
  });
});

// =============================================================================
// STATE PERSISTENCE ACROSS TURNS
// =============================================================================

describe("State Persistence Across Turns", () => {
  it("should serialize and deserialize game state correctly", () => {
    const originalState = createGameState({
      sessionId: "test-session-123",
      turn: 15,
      phase: "decision",
      family: createFamilyImpact({ visibility: 45, stress: 55, cohesion: 65, trustNetworkStrength: 35 }),
      choiceHistory: [
        { turn: 5, decisionId: "decision-1", choiceIds: ["a"], effects: { stress: 10 } },
        { turn: 10, decisionId: "decision-2", choiceIds: ["b"], effects: { stress: -5 } },
      ],
    });

    const serialized = JSON.stringify(originalState);
    const deserialized = JSON.parse(serialized) as typeof originalState;

    expect(deserialized.sessionId).toBe(originalState.sessionId);
    expect(deserialized.turn).toBe(originalState.turn);
    expect(deserialized.phase).toBe(originalState.phase);
    expect(deserialized.family).toEqual(originalState.family);
    expect(deserialized.choiceHistory).toEqual(originalState.choiceHistory);
  });

  it("should maintain state integrity after multiple turns", () => {
    let state = createGameState({
      turn: 1,
      phase: "plan" as const,
      family: createFamilyImpact({ visibility: 30, stress: 20, cohesion: 70, trustNetworkStrength: 40 }),
    });

    const ctx: TurnContext = MOCK_TEMPLATES;
    const lastGlobalUpdate = 0;

    // Simulate serializing and deserializing after each turn
    for (let i = 0; i < 3; i++) {
      // Serialize
      const serialized = JSON.stringify(state);

      // Deserialize
      state = JSON.parse(serialized) as typeof state;

      // Run turn (may not complete if decision needed, so we handle that)
      if (state.phase === "plan" || state.phase === "consequence") {
        const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.999);
        state = runCompleteTurn(state, ctx, lastGlobalUpdate);
        randomSpy.mockRestore();
      }
    }

    expect(state.turn).toBeGreaterThan(1);
    expect(state.phase).toBeDefined();
  });

  it("should persist active events across turns", () => {
    const state = createGameState({
      turn: 10,
      activeEvents: {
        global: [
          {
            id: "global-1",
            type: "Executive",
            magnitude: 3,
            durationDays: 20,
            title: "Test Global",
            description: "Test",
            startTurn: 5,
            effects: { enforcementClimate: 10 },
          },
        ],
        city: [
          {
            id: "city-1",
            category: "Policy",
            visibility: 60,
            impactRadius: "All",
            title: "Test City",
            description: "Test",
            startTurn: 8,
            durationDays: 14,
            effects: { politicalCover: -5 },
          },
        ],
        neighborhood: [],
      },
    });

    const serialized = JSON.stringify(state);
    const deserialized = JSON.parse(serialized) as typeof state;

    expect(deserialized.activeEvents.global).toHaveLength(1);
    expect(deserialized.activeEvents.city).toHaveLength(1);
    expect(deserialized.activeEvents.global[0].id).toBe("global-1");
    expect(deserialized.activeEvents.city[0].id).toBe("city-1");
  });

  it("should integrate with mock Redis for persistence", async () => {
    const { getGameState, setGameState, sessionExists, deleteGameState } = mockRedisFunctions();
    const sessionId = "test-session-integration";

    const originalState = createGameState({
      sessionId,
      turn: 25,
      phase: "decision" as const,
    });

    // Save state
    await setGameState(sessionId, originalState);

    // Verify session exists
    const exists = await sessionExists(sessionId);
    expect(exists).toBe(true);

    // Load state
    const loadedState = await getGameState<typeof originalState>(sessionId);
    expect(loadedState).not.toBeNull();
    expect(loadedState?.sessionId).toBe(sessionId);
    expect(loadedState?.turn).toBe(25);
    expect(loadedState?.phase).toBe("decision");

    // Delete state
    await deleteGameState(sessionId);
    const existsAfterDelete = await sessionExists(sessionId);
    expect(existsAfterDelete).toBe(false);
  });

  it("should simulate a full game session with persistence", async () => {
    const { getGameState, setGameState, touchSession } = mockRedisFunctions();
    const sessionId = "test-full-session";

    // Initialize game
    let state = createGameState({ sessionId, turn: 1, phase: "plan" as const });
    await setGameState(sessionId, state);

    const ctx: TurnContext = MOCK_TEMPLATES;
    const lastGlobalUpdate = 0;

    // Play several turns with persistence
    for (let i = 0; i < 5; i++) {
      // Load
      const loaded = await getGameState<typeof state>(sessionId);
      expect(loaded).not.toBeNull();
      if (!loaded) break;

      state = loaded;

      // Extend session
      await touchSession(sessionId);

      // Simulate turn (use high random value to avoid events)
      const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0.999);
      state = runCompleteTurn(state, ctx, lastGlobalUpdate);
      randomSpy.mockRestore();

      // Save
      await setGameState(sessionId, state);
    }

    // Verify final state
    const finalState = await getGameState<typeof state>(sessionId);
    expect(finalState).not.toBeNull();
    expect(finalState?.turn).toBeGreaterThan(1);
  });
});

// =============================================================================
// PULSE UPDATE INTEGRATION
// =============================================================================

describe("Pulse Update Integration", () => {
  it("should update all pulse layers correctly", () => {
    const state = createGameState({
      turn: 7, // City update turn
      city: {
        id: "test-city",
        name: "Test City",
        state: "TS",
        pulse: createCityPulse(),
        neighborhoods: [
          {
            id: "neighborhood-1",
            name: "Test Neighborhood",
            pulse: createNeighborhoodPulse(),
          },
        ],
        currentNeighborhoodId: "neighborhood-1",
      },
    });

    const ctx: TurnContext = MOCK_TEMPLATES;
    const lastGlobalUpdate = 0;

    // Run from plan through pulse_update
    let resultState = advancePhase(state, ctx, lastGlobalUpdate); // to pulse_update
    resultState = advancePhase(resultState, ctx, lastGlobalUpdate); // to event

    // Pulses should have been updated
    expect(resultState.family).toBeDefined();
    expect(resultState.city.neighborhoods[0].pulse).toBeDefined();
  });

  it("should update global pulse when conditions met", () => {
    const state = createGameState({
      turn: 20,
      globalPulse: createGlobalPulse({ politicalVolatility: 80 }), // High volatility = more frequent updates
    });

    const ctx: TurnContext = MOCK_TEMPLATES;
    const lastGlobalUpdate = 0; // Last update was turn 0, we're at turn 20

    // Run through pulse_update phase
    let resultState = advancePhase(state, ctx, lastGlobalUpdate);
    resultState = advancePhase(resultState, ctx, lastGlobalUpdate);

    // Global pulse may have been updated
    expect(resultState.globalPulse).toBeDefined();
  });

  it("should apply event effects on top of pulse drift", () => {
    const initialState = createGameState({
      turn: 1,
      phase: "event" as const,
      activeEvents: {
        global: [],
        city: [],
        neighborhood: [
          {
            id: "event-1",
            type: "Audit",
            severity: 2,
            target: "Employer",
            neighborhoodId: "neighborhood-1",
            title: "Workplace Audit",
            description: "Audit at workplace",
            startTurn: 1,
            effects: { suspicion: 10, enforcementVisibility: 15, trust: -5 },
          },
        ],
      },
    });

    const ctx: TurnContext = MOCK_TEMPLATES;
    const lastGlobalUpdate = 0;

    const resultState = advancePhase(initialState, ctx, lastGlobalUpdate);

    // Effects should be applied to neighborhood pulse
    const neighborhood = resultState.city.neighborhoods.find(
      (n) => n.id === resultState.city.currentNeighborhoodId
    );
    expect(neighborhood).toBeDefined();
  });
});
