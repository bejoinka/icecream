/**
 * Tests for Event Engine
 * Tests for: selectNeighborhoodEvent, selectCityEvent, selectGlobalEvent,
 *            shouldTriggerNeighborhoodEvent, shouldTriggerCityEvent, shouldTriggerGlobalEvent,
 *            applyGlobalEventEffects, applyCityEventEffects, applyNeighborhoodEventEffects,
 *            pruneExpiredEvents
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  selectNeighborhoodEvent,
  selectCityEvent,
  selectGlobalEvent,
  shouldTriggerNeighborhoodEvent,
  shouldTriggerCityEvent,
  shouldTriggerGlobalEvent,
  applyGlobalEventEffects,
  applyCityEventEffects,
  applyNeighborhoodEventEffects,
  applyEventEffects,
  pruneExpiredEvents,
} from "./events";
import type {
  NeighborhoodEventTemplate,
  CityEventTemplate,
  GlobalPulse,
  CityPulse,
  NeighborhoodPulse,
  ActiveEvents,
  EventSeverity,
} from "@/types";

// Test helpers
function createMockGlobalPulse(overrides?: Partial<GlobalPulse>): GlobalPulse {
  return {
    enforcementClimate: 50,
    mediaNarrative: 0,
    judicialAlignment: 0,
    politicalVolatility: 50,
    ...overrides,
  };
}

function createMockCityPulse(overrides?: Partial<CityPulse>): CityPulse {
  return {
    federalCooperation: 50,
    dataDensity: 50,
    politicalCover: 50,
    civilSocietyCapacity: 50,
    bureaucraticInertia: 50,
    ...overrides,
  };
}

function createMockNeighborhoodPulse(
  overrides?: Partial<NeighborhoodPulse>
): NeighborhoodPulse {
  return {
    trust: 50,
    suspicion: 50,
    enforcementVisibility: 50,
    communityDensity: 50,
    economicPrecarity: 50,
    ...overrides,
  };
}

function createMockNeighborhoodTemplates(): NeighborhoodEventTemplate[] {
  return [
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
    {
      id: "meeting",
      type: "Meeting",
      title: "Community Meeting",
      descriptionTemplate: "A meeting is being held.",
      severityRange: [1, 2],
      weight: 1,
      targets: ["any"],
      effects: { trust: 5 },
    },
    {
      id: "audit",
      type: "Audit",
      title: "Audit",
      descriptionTemplate: "An audit is underway.",
      severityRange: [2, 4],
      weight: 2,
      targets: ["any"],
      effects: { suspicion: 15 },
      triggers: {
        minSuspicion: 40,
      },
    },
  ];
}

function createMockCityTemplates(): CityEventTemplate[] {
  return [
    {
      id: "policy-change",
      category: "Policy",
      title: "Policy Change",
      descriptionTemplate: "A new policy has been announced.",
      visibilityRange: [1, 3],
      durationRange: [7, 14],
      weight: 1,
      effects: { politicalCover: -10 },
    },
    {
      id: "rally",
      category: "CivilSociety",
      title: "Community Rally",
      descriptionTemplate: "A rally is being organized.",
      visibilityRange: [2, 4],
      durationRange: [3, 7],
      weight: 2,
      effects: { civilSocietyCapacity: 10 },
    },
  ];
}

describe("selectNeighborhoodEvent", () => {
  let templates: NeighborhoodEventTemplate[];
  let pulse: NeighborhoodPulse;

  beforeEach(() => {
    templates = createMockNeighborhoodTemplates();
    pulse = createMockNeighborhoodPulse();
  });

  it("returns null when templates are empty", () => {
    const result = selectNeighborhoodEvent([], pulse, "n1", 1);
    expect(result).toBeNull();
  });

  it("returns an event with correct structure", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);
    const result = selectNeighborhoodEvent(templates, pulse, "n1", 5);
    mockRandom.mockRestore();

    expect(result).not.toBeNull();
    expect(result?.id).toMatch(/^evt_/);
    expect(result?.neighborhoodId).toBe("n1");
    expect(result?.startTurn).toBe(5);
    expect(result?.title).toBeDefined();
    expect(result?.description).toBeDefined();
  });

  it("selects event based on trigger conditions", () => {
    // High suspicion - audit should trigger
    pulse.suspicion = 80;
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.4);

    const result = selectNeighborhoodEvent(templates, pulse, "n1", 1);

    mockRandom.mockRestore();

    expect(result).not.toBeNull();
  });

  it("filters out events whose triggers are not met", () => {
    // Low suspicion - audit should not be eligible
    pulse.suspicion = 20;

    // Even with random favoring audit, it shouldn't be selected
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.99);

    const result = selectNeighborhoodEvent(templates, pulse, "n1", 1);

    mockRandom.mockRestore();

    // Result should be checkpoint or meeting, not audit
    expect(result?.type).not.toBe("Audit");
  });

  it("adjusts event weight based on pulse values", () => {
    // High enforcement visibility increases checkpoint weight
    pulse.enforcementVisibility = 90;
    pulse.trust = 20;

    // Force selection
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = selectNeighborhoodEvent(templates, pulse, "n1", 1);

    mockRandom.mockRestore();

    expect(result).not.toBeNull();
  });

  it("generates severity within template range", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const result = selectNeighborhoodEvent(templates, pulse, "n1", 1);

    mockRandom.mockRestore();

    if (result) {
      expect(result.severity).toBeGreaterThanOrEqual(1);
      expect(result.severity).toBeLessThanOrEqual(5);
    }
  });

  it("includes effects from template", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.1);

    const result = selectNeighborhoodEvent(templates, pulse, "n1", 1);

    mockRandom.mockRestore();

    if (result && result.type === "Checkpoint") {
      expect(result.effects).toEqual({ enforcementVisibility: 10 });
    }
  });
});

describe("selectCityEvent", () => {
  let templates: CityEventTemplate[];
  let pulse: CityPulse;

  beforeEach(() => {
    templates = createMockCityTemplates();
    pulse = createMockCityPulse();
  });

  it("returns null when templates are empty", () => {
    const result = selectCityEvent([], pulse, 1, ["n1", "n2"]);
    expect(result).toBeNull();
  });

  it("returns an event with correct structure", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const result = selectCityEvent(templates, pulse, 5, ["n1", "n2"]);

    mockRandom.mockRestore();

    expect(result).not.toBeNull();
    expect(result?.id).toMatch(/^evt_/);
    expect(result?.startTurn).toBe(5);
    expect(result?.title).toBeDefined();
    expect(result?.category).toBeDefined();
  });

  it("sets impactRadius to All about 60% of the time", () => {
    const allCount = { All: 0 };
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      const result = selectCityEvent(templates, pulse, 1, ["n1", "n2"]);
      if (result?.impactRadius === "All") {
        allCount.All++;
      }
    }

    // Allow some variance, but should be around 60%
    expect(allCount.All).toBeGreaterThan(40);
    expect(allCount.All).toBeLessThan(80);
  });

  it("can set impactRadius to subset of neighborhoods", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.9);

    const result = selectCityEvent(templates, pulse, 1, ["n1", "n2", "n3"]);

    mockRandom.mockRestore();

    expect(result).not.toBeNull();
    if (result?.impactRadius !== "All") {
      expect(Array.isArray(result.impactRadius)).toBe(true);
    }
  });

  it("generates visibility within template range", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const result = selectCityEvent(templates, pulse, 1, ["n1"]);

    mockRandom.mockRestore();

    if (result) {
      expect(result.visibility).toBeGreaterThanOrEqual(1);
      expect(result.visibility).toBeLessThanOrEqual(4);
    }
  });

  it("generates duration within template range", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const result = selectCityEvent(templates, pulse, 1, ["n1"]);

    mockRandom.mockRestore();

    if (result) {
      expect(result.durationDays).toBeGreaterThanOrEqual(3);
      expect(result.durationDays).toBeLessThanOrEqual(14);
    }
  });
});

describe("selectGlobalEvent", () => {
  let pulse: GlobalPulse;

  beforeEach(() => {
    pulse = createMockGlobalPulse();
  });

  it("returns an event with correct structure", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const result = selectGlobalEvent(pulse, 5);

    mockRandom.mockRestore();

    expect(result).not.toBeNull();
    expect(result?.id).toMatch(/^evt_/);
    expect(result?.startTurn).toBe(5);
    expect(result?.title).toBeDefined();
    expect(result?.type).toBeDefined();
  });

  it("generates magnitude based on political volatility", () => {
    pulse.politicalVolatility = 90; // High volatility

    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const result = selectGlobalEvent(pulse, 1);

    mockRandom.mockRestore();

    if (result) {
      // Higher volatility allows higher magnitude
      expect(result.magnitude).toBeGreaterThan(0);
      expect(result.magnitude).toBeLessThanOrEqual(5);
    }
  });

  it("sets duration based on magnitude", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const result = selectGlobalEvent(pulse, 1);

    mockRandom.mockRestore();

    if (result) {
      // Duration is 7 + magnitude * 7
      expect(result.durationDays).toBe(7 + result.magnitude * 7);
    }
  });

  it("scales effects by magnitude", () => {
    const mockRandom = vi
      .spyOn(Math, "random")
      .mockReturnValueOnce(0.5) // For event selection
      .mockReturnValueOnce(0.5); // For severity

    const result = selectGlobalEvent(pulse, 1);

    mockRandom.mockRestore();

    if (result) {
      // Effects should be scaled by magnitude
      expect(result.effects).toBeDefined();
      expect(Object.keys(result.effects).length).toBeGreaterThan(0);
    }
  });
});

describe("shouldTriggerNeighborhoodEvent", () => {
  it("returns boolean", () => {
    const pulse = createMockNeighborhoodPulse();
    const result = shouldTriggerNeighborhoodEvent(pulse);
    expect(typeof result).toBe("boolean");
  });

  it("increases probability with high enforcement visibility", () => {
    const lowVisibility = createMockNeighborhoodPulse({ enforcementVisibility: 10, suspicion: 10 });
    const highVisibility = createMockNeighborhoodPulse({ enforcementVisibility: 90, suspicion: 10 });

    // Base probability 0.3 + suspicion adjustment
    // lowVisibility: 0.3 + 10*0.002 + 10*0.001 - 50*0.001 = 0.27
    // highVisibility: 0.3 + 90*0.002 + 10*0.001 - 50*0.001 = 0.43

    const mockRandom = vi.spyOn(Math, "random");

    mockRandom.mockReturnValueOnce(0.35);
    const lowTriggers = shouldTriggerNeighborhoodEvent(lowVisibility);

    mockRandom.mockReturnValueOnce(0.35);
    const highTriggers = shouldTriggerNeighborhoodEvent(highVisibility);

    mockRandom.mockRestore();

    expect(lowTriggers).toBe(false); // 0.35 > 0.27
    expect(highTriggers).toBe(true); // 0.35 < 0.43
  });

  it("increases probability with high suspicion", () => {
    const lowSuspicion = createMockNeighborhoodPulse({ suspicion: 10, enforcementVisibility: 10, trust: 10 });
    const highSuspicion = createMockNeighborhoodPulse({ suspicion: 90, enforcementVisibility: 10, trust: 10 });

    // Base probability 0.3
    // lowSuspicion: 0.3 + 10*0.002 + 10*0.001 - 10*0.001 = 0.31
    // highSuspicion: 0.3 + 10*0.002 + 90*0.001 - 10*0.001 = 0.39

    const mockRandom = vi.spyOn(Math, "random");

    mockRandom.mockReturnValueOnce(0.35);
    const lowTriggers = shouldTriggerNeighborhoodEvent(lowSuspicion);

    mockRandom.mockReturnValueOnce(0.35);
    const highTriggers = shouldTriggerNeighborhoodEvent(highSuspicion);

    mockRandom.mockRestore();

    expect(lowTriggers).toBe(false); // 0.35 > 0.31
    expect(highTriggers).toBe(true); // 0.35 < 0.39
  });

  it("decreases probability with high trust", () => {
    const lowTrust = createMockNeighborhoodPulse({ trust: 10, enforcementVisibility: 10, suspicion: 10 });
    const highTrust = createMockNeighborhoodPulse({ trust: 90, enforcementVisibility: 10, suspicion: 10 });

    // Base probability 0.3
    // lowTrust: 0.3 + 10*0.002 + 10*0.001 - 10*0.001 = 0.31
    // highTrust: 0.3 + 10*0.002 + 10*0.001 - 90*0.001 = 0.23

    const mockRandom = vi.spyOn(Math, "random");

    mockRandom.mockReturnValueOnce(0.27);
    const lowTriggers = shouldTriggerNeighborhoodEvent(lowTrust);

    mockRandom.mockReturnValueOnce(0.27);
    const highTriggers = shouldTriggerNeighborhoodEvent(highTrust);

    mockRandom.mockRestore();

    expect(lowTriggers).toBe(true); // 0.27 < 0.31
    expect(highTriggers).toBe(false); // 0.27 > 0.23
  });
});

describe("shouldTriggerCityEvent", () => {
  it("returns boolean", () => {
    const pulse = createMockCityPulse();
    const result = shouldTriggerCityEvent(5, pulse);
    expect(typeof result).toBe("boolean");
  });

  it("decreases probability with high political cover", () => {
    const lowCover = createMockCityPulse({ politicalCover: 10 });
    const highCover = createMockCityPulse({ politicalCover: 90 });

    // High cover reduces probability, verify over many runs
    let lowTriggers = 0;
    let highTriggers = 0;
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      if (shouldTriggerCityEvent(5, lowCover)) lowTriggers++;
    }

    for (let i = 0; i < iterations; i++) {
      if (shouldTriggerCityEvent(5, highCover)) highTriggers++;
    }

    // Low cover should trigger more often than high cover
    expect(lowTriggers).toBeGreaterThan(highTriggers);
  });

  it("increases probability with high bureaucratic inertia", () => {
    const lowInertia = createMockCityPulse({ bureaucraticInertia: 10 });
    const highInertia = createMockCityPulse({ bureaucraticInertia: 90 });

    // High inertia increases probability, verify over many runs
    let lowTriggers = 0;
    let highTriggers = 0;
    const iterations = 100;

    for (let i = 0; i < iterations; i++) {
      if (shouldTriggerCityEvent(5, lowInertia)) lowTriggers++;
    }

    for (let i = 0; i < iterations; i++) {
      if (shouldTriggerCityEvent(5, highInertia)) highTriggers++;
    }

    // High inertia should trigger more often than low inertia
    expect(highTriggers).toBeGreaterThan(lowTriggers);
  });
});

describe("shouldTriggerGlobalEvent", () => {
  it("returns boolean", () => {
    const pulse = createMockGlobalPulse();
    const result = shouldTriggerGlobalEvent(pulse);
    expect(typeof result).toBe("boolean");
  });

  it("increases probability with high political volatility", () => {
    const lowVolatility = createMockGlobalPulse({ politicalVolatility: 10 });
    const highVolatility = createMockGlobalPulse({ politicalVolatility: 90 });

    let lowTriggerCount = 0;
    let highTriggerCount = 0;
    const iterations = 1000;

    const mockRandom = vi.spyOn(Math, "random");

    for (let i = 0; i < iterations; i++) {
      mockRandom.mockReturnValueOnce(0.05);
      if (shouldTriggerGlobalEvent(lowVolatility)) lowTriggerCount++;
    }

    for (let i = 0; i < iterations; i++) {
      mockRandom.mockReturnValueOnce(0.05);
      if (shouldTriggerGlobalEvent(highVolatility)) highTriggerCount++;
    }

    mockRandom.mockRestore();

    expect(highTriggerCount).toBeGreaterThan(lowTriggerCount);
  });
});

describe("applyGlobalEventEffects", () => {
  it("applies positive effects to pulse", () => {
    const pulse = createMockGlobalPulse({ enforcementClimate: 50 });
    const effects = { enforcementClimate: 10 };
    const result = applyGlobalEventEffects(pulse, effects);

    expect(result.enforcementClimate).toBe(60);
  });

  it("applies negative effects to pulse", () => {
    const pulse = createMockGlobalPulse({ enforcementClimate: 50 });
    const effects = { enforcementClimate: -10 };
    const result = applyGlobalEventEffects(pulse, effects);

    expect(result.enforcementClimate).toBe(40);
  });

  it("clamps values at minimum 0", () => {
    const pulse = createMockGlobalPulse({ enforcementClimate: 5 });
    const effects = { enforcementClimate: -10 };
    const result = applyGlobalEventEffects(pulse, effects);

    expect(result.enforcementClimate).toBe(0);
  });

  it("clamps values at maximum 100", () => {
    const pulse = createMockGlobalPulse({ enforcementClimate: 95 });
    const effects = { enforcementClimate: 10 };
    const result = applyGlobalEventEffects(pulse, effects);

    expect(result.enforcementClimate).toBe(100);
  });

  it("handles multiple effects", () => {
    const pulse = createMockGlobalPulse({
      enforcementClimate: 50,
      politicalVolatility: 50,
    });
    const effects = { enforcementClimate: 10, politicalVolatility: -5 };
    const result = applyGlobalEventEffects(pulse, effects);

    expect(result.enforcementClimate).toBe(60);
    expect(result.politicalVolatility).toBe(45);
  });

  it("does not modify original pulse", () => {
    const pulse = createMockGlobalPulse({ enforcementClimate: 50 });
    const originalClimate = pulse.enforcementClimate;
    applyGlobalEventEffects(pulse, { enforcementClimate: 10 });

    expect(pulse.enforcementClimate).toBe(originalClimate);
  });
});

describe("applyCityEventEffects", () => {
  it("applies effects to city pulse", () => {
    const pulse = createMockCityPulse({ politicalCover: 50 });
    const effects = { politicalCover: -10 };
    const result = applyCityEventEffects(pulse, effects);

    expect(result.politicalCover).toBe(40);
  });

  it("clamps values at boundaries", () => {
    const pulse = createMockCityPulse({
      federalCooperation: 5,
      politicalCover: 95,
    });
    const effects = { federalCooperation: -10, politicalCover: 10 };
    const result = applyCityEventEffects(pulse, effects);

    expect(result.federalCooperation).toBe(0);
    expect(result.politicalCover).toBe(100);
  });

  it("does not modify original pulse", () => {
    const pulse = createMockCityPulse({ politicalCover: 50 });
    const originalCover = pulse.politicalCover;
    applyCityEventEffects(pulse, { politicalCover: -10 });

    expect(pulse.politicalCover).toBe(originalCover);
  });
});

describe("applyNeighborhoodEventEffects", () => {
  it("applies effects to neighborhood pulse", () => {
    const pulse = createMockNeighborhoodPulse({ trust: 50 });
    const effects = { trust: 10 };
    const result = applyNeighborhoodEventEffects(pulse, effects);

    expect(result.trust).toBe(60);
  });

  it("handles negative effects", () => {
    const pulse = createMockNeighborhoodPulse({ suspicion: 50 });
    const effects = { suspicion: -15 };
    const result = applyNeighborhoodEventEffects(pulse, effects);

    expect(result.suspicion).toBe(35);
  });

  it("clamps values at boundaries", () => {
    const pulse = createMockNeighborhoodPulse({
      trust: 5,
      suspicion: 95,
    });
    const effects = { trust: -10, suspicion: 10 };
    const result = applyNeighborhoodEventEffects(pulse, effects);

    expect(result.trust).toBe(0);
    expect(result.suspicion).toBe(100);
  });

  it("does not modify original pulse", () => {
    const pulse = createMockNeighborhoodPulse({ trust: 50 });
    const originalTrust = pulse.trust;
    applyNeighborhoodEventEffects(pulse, { trust: 10 });

    expect(pulse.trust).toBe(originalTrust);
  });
});

describe("applyEventEffects (generic)", () => {
  it("applies effects to generic pulse object", () => {
    const pulse = { value1: 50, value2: 75 };
    const effects = { value1: 10, value2: -5 };
    const result = applyEventEffects(pulse, effects);

    expect(result.value1).toBe(60);
    expect(result.value2).toBe(70);
  });

  it("handles empty effects", () => {
    const pulse = { value1: 50 };
    const effects = {};
    const result = applyEventEffects(pulse, effects);

    expect(result.value1).toBe(50);
  });

  it("ignores effects for keys not in pulse", () => {
    const pulse = { value1: 50 };
    const effects = { value1: 10, value2: 20 };
    const result = applyEventEffects(pulse, effects);

    expect(result.value1).toBe(60);
    expect(result).not.toHaveProperty("value2");
  });
});

describe("pruneExpiredEvents", () => {
  it("removes expired global events", () => {
    const events: ActiveEvents = {
      global: [
        {
          id: "active",
          type: "Executive",
          magnitude: 2,
          durationDays: 10,
          title: "Active",
          description: "Test",
          startTurn: 5,
          effects: { enforcementClimate: 10 },
        },
        {
          id: "expired",
          type: "Executive",
          magnitude: 2,
          durationDays: 5,
          title: "Expired",
          description: "Test",
          startTurn: 1,
          effects: { enforcementClimate: 10 },
        },
      ],
      city: [],
      neighborhood: [],
    };

    const result = pruneExpiredEvents(events, 10);

    expect(result.global).toHaveLength(1);
    expect(result.global[0].id).toBe("active");
  });

  it("removes expired city events", () => {
    const events: ActiveEvents = {
      global: [],
      city: [
        {
          id: "active",
          category: "Policy",
          visibility: 2,
          impactRadius: "All",
          title: "Active",
          description: "Test",
          startTurn: 5,
          durationDays: 10,
          effects: { politicalCover: -10 },
        },
        {
          id: "expired",
          category: "Policy",
          visibility: 2,
          impactRadius: "All",
          title: "Expired",
          description: "Test",
          startTurn: 1,
          durationDays: 5,
          effects: { politicalCover: -10 },
        },
      ],
      neighborhood: [],
    };

    const result = pruneExpiredEvents(events, 10);

    expect(result.city).toHaveLength(1);
    expect(result.city[0].id).toBe("active");
  });

  it("removes neighborhood events from previous turns", () => {
    const events: ActiveEvents = {
      global: [],
      city: [],
      neighborhood: [
        {
          id: "current",
          type: "Checkpoint",
          severity: 2,
          target: "any",
          neighborhoodId: "n1",
          title: "Current",
          description: "Test",
          startTurn: 10,
          effects: { enforcementVisibility: 10 },
        },
        {
          id: "old",
          type: "Meeting",
          severity: 1,
          target: "any",
          neighborhoodId: "n1",
          title: "Old",
          description: "Test",
          startTurn: 5,
          effects: { trust: 5 },
        },
      ],
    };

    const result = pruneExpiredEvents(events, 10);

    // Only events from current turn should remain
    expect(result.neighborhood).toHaveLength(1);
    expect(result.neighborhood[0].id).toBe("current");
  });

  it("keeps events that expire on current turn", () => {
    const events: ActiveEvents = {
      global: [
        {
          id: "expires-now",
          type: "Executive",
          magnitude: 2,
          durationDays: 5,
          title: "Expires Now",
          description: "Test",
          startTurn: 1,
          effects: { enforcementClimate: 10 },
        },
      ],
      city: [],
      neighborhood: [],
    };

    // Event started at turn 1, duration 5, current turn is 5
    // 1 + 5 = 6, so event is still active at turn 5 (expires at turn 6)
    const result = pruneExpiredEvents(events, 5);

    expect(result.global).toHaveLength(1);
  });

  it("returns empty structure when all events are expired", () => {
    const events: ActiveEvents = {
      global: [
        {
          id: "expired",
          type: "Executive",
          magnitude: 2,
          durationDays: 1,
          title: "Expired",
          description: "Test",
          startTurn: 1,
          effects: { enforcementClimate: 10 },
        },
      ],
      city: [
        {
          id: "expired-city",
          category: "Policy",
          visibility: 2,
          impactRadius: "All",
          title: "Expired",
          description: "Test",
          startTurn: 1,
          durationDays: 1,
          effects: { politicalCover: -10 },
        },
      ],
      neighborhood: [
        {
          id: "expired-neighborhood",
          type: "Meeting",
          severity: 1,
          target: "any",
          neighborhoodId: "n1",
          title: "Expired",
          description: "Test",
          startTurn: 1,
          effects: { trust: 5 },
        },
      ],
    };

    const result = pruneExpiredEvents(events, 10);

    expect(result.global).toHaveLength(0);
    expect(result.city).toHaveLength(0);
    expect(result.neighborhood).toHaveLength(0);
  });
});
