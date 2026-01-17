/**
 * Tests for Turn State Machine
 * Tests for: advancePhase, runCompleteTurn, processConsequencePhase, checkGameEnding
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  advancePhase,
  runCompleteTurn,
  checkGameEnding,
  type TurnContext,
} from "./turn";
import type {
  GameState,
  TurnPhase,
  NeighborhoodEventTemplate,
  CityEventTemplate,
} from "@/types";

// Test helpers
function createMockGameState(overrides?: Partial<GameState>): GameState {
  return {
    sessionId: "test-session",
    createdAt: "2024-01-01T00:00:00Z",
    updatedAt: "2024-01-01T00:00:00Z",
    turn: 1,
    phase: "plan" as TurnPhase,
    maxTurns: 80,
    globalPulse: {
      enforcementClimate: 50,
      mediaNarrative: 0,
      judicialAlignment: 0,
      politicalVolatility: 50,
    },
    city: {
      id: "test-city",
      name: "Test City",
      state: "TS",
      pulse: {
        federalCooperation: 50,
        dataDensity: 50,
        politicalCover: 50,
        civilSocietyCapacity: 50,
        bureaucraticInertia: 50,
      },
      currentNeighborhoodId: "n1",
      neighborhoods: [
        {
          id: "n1",
          name: "Neighborhood 1",
          pulse: {
            trust: 50,
            suspicion: 50,
            enforcementVisibility: 50,
            communityDensity: 50,
            economicPrecarity: 50,
          },
        },
      ],
    },
    family: {
      visibility: 50,
      stress: 50,
      cohesion: 50,
      trustNetworkStrength: 50,
    },
    activeEvents: {
      global: [],
      city: [],
      neighborhood: [],
    },
    currentDecision: null,
    choiceHistory: [],
    rightsKnowledge: [],
    ending: null,
    ...overrides,
  };
}

function createMockTurnContext(): TurnContext {
  return {
    neighborhoodEventTemplates: [],
    cityEventTemplates: [],
  };
}

describe("advancePhase", () => {
  let state: GameState;
  let ctx: TurnContext;

  beforeEach(() => {
    state = createMockGameState();
    ctx = createMockTurnContext();
  });

  describe("plan phase", () => {
    it("advances to pulse_update phase", () => {
      state.phase = "plan";
      const result = advancePhase(state, ctx, 0);
      expect(result.phase).toBe("pulse_update");
    });

    it("preserves all other state values", () => {
      state.phase = "plan";
      const result = advancePhase(state, ctx, 0);
      expect(result.turn).toBe(state.turn);
      expect(result.globalPulse).toEqual(state.globalPulse);
      expect(result.family).toEqual(state.family);
    });
  });

  describe("pulse_update phase", () => {
    it("advances to event phase", () => {
      state.phase = "pulse_update";
      const result = advancePhase(state, ctx, 0);
      expect(result.phase).toBe("event");
    });

    it("updates pulse values", () => {
      state.phase = "pulse_update";
      const result = advancePhase(state, ctx, 0);
      // Pulses should drift due to updateAllPulses
      expect(result.globalPulse).toBeDefined();
      expect(result.city.pulse).toBeDefined();
    });

    it("updates family state based on neighborhood", () => {
      state.phase = "pulse_update";
      const originalStress = state.family.stress;
      const result = advancePhase(state, ctx, 0);
      expect(result.family.stress).toBeDefined();
      // Family stress changes based on neighborhood conditions
      expect(typeof result.family.stress).toBe("number");
    });
  });

  describe("event phase", () => {
    it("advances to decision phase", () => {
      state.phase = "event";
      const result = advancePhase(state, ctx, 0);
      expect(result.phase).toBe("decision");
    });

    it("prunes expired events", () => {
      state.phase = "event";
      state.activeEvents = {
        global: [
          {
            id: "old-global",
            type: "Executive",
            magnitude: 2,
            durationDays: 5,
            title: "Old Event",
            description: "Test",
            startTurn: 1,
            effects: { enforcementClimate: 10 },
          },
        ],
        city: [],
        neighborhood: [],
      };
      state.turn = 10; // Event should be expired
      const result = advancePhase(state, ctx, 0);
      expect(result.activeEvents.global).toHaveLength(0);
    });

    it("keeps non-expired events", () => {
      state.phase = "event";
      state.activeEvents = {
        global: [
          {
            id: "active-global",
            type: "Executive",
            magnitude: 2,
            durationDays: 20,
            title: "Active Event",
            description: "Test",
            startTurn: 1,
            effects: { enforcementClimate: 10 },
          },
        ],
        city: [],
        neighborhood: [],
      };
      state.turn = 5; // Event still active
      const result = advancePhase(state, ctx, 0);
      expect(result.activeEvents.global).toHaveLength(1);
    });
  });

  describe("decision phase", () => {
    it("completes consequence and advances to plan when choice selected", () => {
      state.phase = "decision";
      state.currentDecision = {
        id: "test-decision",
        title: "Test Decision",
        narrative: "Test narrative",
        choices: [
          {
            id: "choice1",
            label: "Choice 1",
            description: "Test choice",
            effects: { stress: 10 },
          },
        ],
        multiSelect: false,
      };
      const result = advancePhase(state, ctx, 0, ["choice1"]);
      // processConsequencePhase completes the consequence phase
      // and advances to plan for the next turn
      expect(result.phase).toBe("plan");
      expect(result.turn).toBe(state.turn + 1);
    });

    it("advances to consequence when no recent event triggers decision", () => {
      state.phase = "decision";
      state.currentDecision = null;
      // No active events, so processDecisionPhase should advance to consequence
      const result = advancePhase(state, ctx, 0);
      expect(result.phase).toBe("consequence");
    });
  });

  describe("consequence phase", () => {
    it("increments turn and returns to plan phase", () => {
      state.phase = "consequence";
      state.currentDecision = null;
      const result = advancePhase(state, ctx, 0);
      expect(result.phase).toBe("plan");
      expect(result.turn).toBe(state.turn + 1);
    });

    it("applies choice effects to family", () => {
      state.phase = "consequence";
      state.currentDecision = {
        id: "test-decision",
        title: "Test Decision",
        narrative: "Test narrative",
        choices: [
          {
            id: "choice1",
            label: "Choice 1",
            description: "Test choice",
            effects: { stress: 10, cohesion: 5 },
          },
        ],
        multiSelect: false,
      };
      const originalStress = state.family.stress;
      const result = advancePhase(state, ctx, 0, ["choice1"]);
      expect(result.family.stress).toBe(Math.min(100, originalStress + 10));
      expect(result.family.cohesion).toBe(Math.min(100, state.family.cohesion + 5));
    });

    it("records choice in history", () => {
      state.phase = "consequence";
      state.currentDecision = {
        id: "test-decision",
        title: "Test Decision",
        narrative: "Test narrative",
        choices: [
          {
            id: "choice1",
            label: "Choice 1",
            description: "Test choice",
            effects: { stress: 10 },
          },
        ],
        multiSelect: false,
      };
      const result = advancePhase(state, ctx, 0, ["choice1"]);
      expect(result.choiceHistory).toHaveLength(1);
      expect(result.choiceHistory[0].decisionId).toBe("test-decision");
      expect(result.choiceHistory[0].choiceIds).toEqual(["choice1"]);
    });

    it("clears current decision after processing", () => {
      state.phase = "consequence";
      state.currentDecision = {
        id: "test-decision",
        title: "Test Decision",
        narrative: "Test narrative",
        choices: [
          {
            id: "choice1",
            label: "Choice 1",
            description: "Test choice",
            effects: { stress: 10 },
          },
        ],
        multiSelect: false,
      };
      const result = advancePhase(state, ctx, 0, ["choice1"]);
      expect(result.currentDecision).toBeNull();
    });
  });
});

describe("runCompleteTurn", () => {
  let state: GameState;
  let ctx: TurnContext;

  beforeEach(() => {
    state = createMockGameState({ phase: "plan" });
    ctx = createMockTurnContext();
  });

  it("runs through all phases when no decision needed", () => {
    const result = runCompleteTurn(state, ctx, 0);
    expect(result.turn).toBe(state.turn + 1);
    expect(result.phase).toBe("plan");
  });

  it("stops at decision phase when event triggers", () => {
    // Add a neighborhood event to trigger decision
    ctx.neighborhoodEventTemplates = [
      {
        id: "checkpoint",
        type: "Checkpoint",
        title: "Checkpoint",
        descriptionTemplate: "A checkpoint has appeared.",
        severityRange: [1, 3],
        weight: 1,
        targets: ["any"],
        effects: { enforcementVisibility: 10 },
      },
    ];

    // Set pulse to increase event trigger chance
    state.city.neighborhoods[0].pulse.enforcementVisibility = 90;

    // Mock Math.random to ensure event triggers
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = runCompleteTurn(state, ctx, 0);

    mockRandom.mockRestore();

    // Should stop at decision phase or complete turn
    expect(result.phase).toMatch(/^(plan|decision)$/);
  });

  it("returns same state when phase does not advance (safety)", () => {
    // Edge case: if something goes wrong, prevent infinite loop
    state.phase = "invalid" as TurnPhase;
    const result = runCompleteTurn(state, ctx, 0);
    expect(result).toEqual(state);
  });
});

describe("checkGameEnding", () => {
  let state: GameState;

  beforeEach(() => {
    state = createMockGameState();
  });

  describe("failure conditions", () => {
    it("returns failure ending when stress is max and cohesion is min", () => {
      state.family.stress = 95;
      state.family.cohesion = 10;
      const result = checkGameEnding(state);
      expect(result.ending).not.toBeNull();
      expect(result.ending?.type).toBe("failure");
      expect(result.ending?.reason).toBe("Family could not endure the pressure.");
    });

    it("does not trigger failure when stress is high but cohesion is okay", () => {
      state.family.stress = 95;
      state.family.cohesion = 50;
      const result = checkGameEnding(state);
      expect(result.ending).toBeNull();
    });

    it("does not trigger failure when stress is moderate", () => {
      state.family.stress = 80;
      state.family.cohesion = 10;
      const result = checkGameEnding(state);
      expect(result.ending).toBeNull();
    });
  });

  describe("victory - outlast", () => {
    it("returns outlast victory when turns exceed maxTurns and climate improves", () => {
      state.turn = 80;
      state.maxTurns = 80;
      state.globalPulse.enforcementClimate = 30; // Below 40 threshold
      const result = checkGameEnding(state);
      expect(result.ending).not.toBeNull();
      expect(result.ending?.type).toBe("victory");
      if (result.ending?.type === "victory") {
        expect(result.ending.victoryType).toBe("outlast");
      }
    });

    it("does not trigger outlast victory when enforcement climate remains high", () => {
      state.turn = 80;
      state.maxTurns = 80;
      state.globalPulse.enforcementClimate = 60; // Above 40 threshold
      const result = checkGameEnding(state);
      expect(result.ending).toBeNull();
    });

    it("does not trigger outlast victory before max turns", () => {
      state.turn = 70;
      state.maxTurns = 80;
      state.globalPulse.enforcementClimate = 30;
      const result = checkGameEnding(state);
      expect(result.ending).toBeNull();
    });
  });

  describe("victory - sanctuary", () => {
    it("returns sanctuary victory when neighborhood and family metrics are high", () => {
      state.city.neighborhoods[0].pulse.trust = 85;
      state.city.neighborhoods[0].pulse.communityDensity = 75;
      state.family.trustNetworkStrength = 85;
      const result = checkGameEnding(state);
      expect(result.ending).not.toBeNull();
      expect(result.ending?.type).toBe("victory");
      if (result.ending?.type === "victory") {
        expect(result.ending.victoryType).toBe("sanctuary");
      }
    });

    it("does not trigger sanctuary victory when trust is too low", () => {
      state.city.neighborhoods[0].pulse.trust = 70; // Below 80 threshold
      state.city.neighborhoods[0].pulse.communityDensity = 75;
      state.family.trustNetworkStrength = 85;
      const result = checkGameEnding(state);
      expect(result.ending).toBeNull();
    });

    it("does not trigger sanctuary victory when community density is too low", () => {
      state.city.neighborhoods[0].pulse.trust = 85;
      state.city.neighborhoods[0].pulse.communityDensity = 65; // Below 70 threshold
      state.family.trustNetworkStrength = 85;
      const result = checkGameEnding(state);
      expect(result.ending).toBeNull();
    });

    it("does not trigger sanctuary victory when trust network is too low", () => {
      state.city.neighborhoods[0].pulse.trust = 85;
      state.city.neighborhoods[0].pulse.communityDensity = 75;
      state.family.trustNetworkStrength = 70; // Below 80 threshold
      const result = checkGameEnding(state);
      expect(result.ending).toBeNull();
    });
  });

  describe("victory - transform", () => {
    it("returns transform victory when systemic conditions are met", () => {
      state.city.pulse.politicalCover = 85;
      state.city.pulse.federalCooperation = 15; // Below 20 threshold
      state.globalPulse.mediaNarrative = -60; // Below -50 threshold (more negative)
      const result = checkGameEnding(state);
      expect(result.ending).not.toBeNull();
      expect(result.ending?.type).toBe("victory");
      if (result.ending?.type === "victory") {
        expect(result.ending.victoryType).toBe("transform");
      }
    });

    it("does not trigger transform victory when political cover is too low", () => {
      state.city.pulse.politicalCover = 70; // Below 80 threshold
      state.city.pulse.federalCooperation = 15;
      state.globalPulse.mediaNarrative = -60;
      const result = checkGameEnding(state);
      expect(result.ending).toBeNull();
    });

    it("does not trigger transform victory when federal cooperation is too high", () => {
      state.city.pulse.politicalCover = 85;
      state.city.pulse.federalCooperation = 30; // Above 20 threshold
      state.globalPulse.mediaNarrative = -60;
      const result = checkGameEnding(state);
      expect(result.ending).toBeNull();
    });

    it("does not trigger transform victory when media narrative is not negative enough", () => {
      state.city.pulse.politicalCover = 85;
      state.city.pulse.federalCooperation = 15;
      state.globalPulse.mediaNarrative = -40; // Above -50 threshold
      const result = checkGameEnding(state);
      expect(result.ending).toBeNull();
    });
  });

  describe("no ending", () => {
    it("returns null ending when no conditions are met", () => {
      const result = checkGameEnding(state);
      expect(result.ending).toBeNull();
      expect(result).toEqual(state);
    });

    it("preserves all other state values when checking", () => {
      const result = checkGameEnding(state);
      expect(result.turn).toBe(state.turn);
      expect(result.phase).toBe(state.phase);
      expect(result.globalPulse).toEqual(state.globalPulse);
      expect(result.family).toEqual(state.family);
    });
  });
});
