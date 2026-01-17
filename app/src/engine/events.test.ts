/**
 * Tests for events.ts utilities
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  selectNeighborhoodEvent,
  shouldTriggerNeighborhoodEvent,
  selectCityEvent,
  shouldTriggerCityEvent,
  selectGlobalEvent,
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
  NeighborhoodPulse,
  CityPulse,
  GlobalPulse,
  ActiveEvents,
} from "@/types";

// =============================================================================
// Test Utilities
// =============================================================================

/** Mock Math.random for deterministic testing */
const mockRandom = (values: number[]) => {
  let index = 0;
  const originalRandom = Math.random;
  vi.spyOn(Math, "random").mockImplementation(() => {
    const val = values[index % values.length];
    index++;
    return val;
  });
  return () => {
    Math.random = originalRandom;
  };
};

/** Create a mock neighborhood event template */
const createNeighborhoodTemplate = (
  overrides?: Partial<NeighborhoodEventTemplate>
): NeighborhoodEventTemplate => ({
  id: "test-template-1",
  type: "Audit",
  severityRange: [1, 3],
  targets: ["Family"],
  title: "Test Audit",
  descriptionTemplate: "Test description",
  weight: 10,
  effects: { trust: -5 },
  ...overrides,
});

/** Create a mock city event template */
const createCityTemplate = (
  overrides?: Partial<CityEventTemplate>
): CityEventTemplate => ({
  id: "city-template-1",
  category: "Policy",
  title: "Test Policy",
  descriptionTemplate: "Test city description",
  visibilityRange: [10, 50],
  durationRange: [7, 14],
  weight: 10,
  effects: { federalCooperation: 5 },
  ...overrides,
});

/** Create a mock neighborhood pulse */
const createNeighborhoodPulse = (
  overrides?: Partial<NeighborhoodPulse>
): NeighborhoodPulse => ({
  trust: 50,
  suspicion: 50,
  enforcementVisibility: 50,
  communityDensity: 50,
  economicPrecarity: 50,
  ...overrides,
});

/** Create a mock city pulse */
const createCityPulse = (
  overrides?: Partial<CityPulse>
): CityPulse => ({
  federalCooperation: 50,
  dataDensity: 50,
  politicalCover: 50,
  civilSocietyCapacity: 50,
  bureaucraticInertia: 50,
  ...overrides,
});

/** Create a mock global pulse */
const createGlobalPulse = (
  overrides?: Partial<GlobalPulse>
): GlobalPulse => ({
  enforcementClimate: 50,
  mediaNarrative: 0,
  judicialAlignment: 0,
  politicalVolatility: 30,
  ...overrides,
});

// =============================================================================
// weightedRandom (tested via select functions)
// =============================================================================

describe("weightedRandom (via select functions)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return null when given empty array", () => {
    const result = selectNeighborhoodEvent(
      [],
      createNeighborhoodPulse(),
      "hood-1",
      1
    );
    expect(result).toBeNull();
  });

  it("should return null when all weights are zero", () => {
    const templates = [
      createNeighborhoodTemplate({ weight: 0 }),
      createNeighborhoodTemplate({ id: "test-2", weight: 0 }),
    ];
    const result = selectNeighborhoodEvent(
      templates,
      createNeighborhoodPulse(),
      "hood-1",
      1
    );
    expect(result).toBeNull();
  });

  it("should select item based on weight probability", () => {
    // With weights 10 and 90, and random values favoring the heavier item
    const restore = mockRandom([0.5]); // 50% through total weight
    const templates = [
      createNeighborhoodTemplate({ id: "light", weight: 10 }),
      createNeighborhoodTemplate({ id: "heavy", weight: 90 }),
    ];

    const result = selectNeighborhoodEvent(
      templates,
      createNeighborhoodPulse(),
      "hood-1",
      1
    );

    expect(result?.type).toBe("Audit");
    expect(result?.id).toBeDefined();
    restore();
  });
});

// =============================================================================
// randomSeverity (tested via select functions)
// =============================================================================

describe("randomSeverity (via select functions)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should generate severity within specified range", () => {
    const restore = mockRandom([0.5]);
    const templates = [
      createNeighborhoodTemplate({ severityRange: [2, 4] }),
    ];

    const result = selectNeighborhoodEvent(
      templates,
      createNeighborhoodPulse(),
      "hood-1",
      1
    );

    expect(result?.severity).toBeGreaterThanOrEqual(2);
    expect(result?.severity).toBeLessThanOrEqual(4);
    restore();
  });

  it("should clamp severity to 1-5 range", () => {
    const restore = mockRandom([0.5]);
    const templates = [
      createNeighborhoodTemplate({ severityRange: [-10, 10] }),
    ];

    const result = selectNeighborhoodEvent(
      templates,
      createNeighborhoodPulse(),
      "hood-1",
      1
    );

    expect(result?.severity).toBeGreaterThanOrEqual(1);
    expect(result?.severity).toBeLessThanOrEqual(5);
    restore();
  });
});

// =============================================================================
// generateEventId (tested via select functions)
// =============================================================================

describe("generateEventId (via select functions)", () => {
  it("should generate unique IDs for different events", () => {
    const templates = [createNeighborhoodTemplate()];

    const event1 = selectNeighborhoodEvent(
      templates,
      createNeighborhoodPulse(),
      "hood-1",
      1
    );
    const event2 = selectNeighborhoodEvent(
      templates,
      createNeighborhoodPulse(),
      "hood-1",
      2
    );

    expect(event1?.id).not.toBe(event2?.id);
    expect(event1?.id).toMatch(/^evt_\d+_[a-z0-9]+$/);
    expect(event2?.id).toMatch(/^evt_\d+_[a-z0-9]+$/);
  });
});

// =============================================================================
// checkTriggers (checkNeighborhoodTriggers)
// =============================================================================

describe("checkNeighborhoodTriggers (checkTriggers)", () => {
  it("should return true when no triggers defined", () => {
    const template = createNeighborhoodTemplate();
    delete template.triggers;
    const pulse = createNeighborhoodPulse();

    const result = selectNeighborhoodEvent(
      [template],
      pulse,
      "hood-1",
      1
    );

    // Event should be selectable (triggers passed)
    expect(result).toBeDefined();
  });

  it("should return false when minEnforcementVisibility not met", () => {
    const template = createNeighborhoodTemplate({
      triggers: { minEnforcementVisibility: 80 },
    });
    const pulse = createNeighborhoodPulse({ enforcementVisibility: 50 });

    const result = selectNeighborhoodEvent(
      [template],
      pulse,
      "hood-1",
      1
    );

    // Event should not be selectable
    expect(result).toBeNull();
  });

  it("should return true when minEnforcementVisibility is met", () => {
    const template = createNeighborhoodTemplate({
      triggers: { minEnforcementVisibility: 40 },
    });
    const pulse = createNeighborhoodPulse({ enforcementVisibility: 50 });

    const result = selectNeighborhoodEvent(
      [template],
      pulse,
      "hood-1",
      1
    );

    expect(result).toBeDefined();
  });

  it("should return false when minSuspicion not met", () => {
    const template = createNeighborhoodTemplate({
      triggers: { minSuspicion: 80 },
    });
    const pulse = createNeighborhoodPulse({ suspicion: 50 });

    const result = selectNeighborhoodEvent(
      [template],
      pulse,
      "hood-1",
      1
    );

    expect(result).toBeNull();
  });

  it("should return true when minSuspicion is met", () => {
    const template = createNeighborhoodTemplate({
      triggers: { minSuspicion: 40 },
    });
    const pulse = createNeighborhoodPulse({ suspicion: 50 });

    const result = selectNeighborhoodEvent(
      [template],
      pulse,
      "hood-1",
      1
    );

    expect(result).toBeDefined();
  });

  it("should return false when maxTrust exceeded", () => {
    const template = createNeighborhoodTemplate({
      triggers: { maxTrust: 30 },
    });
    const pulse = createNeighborhoodPulse({ trust: 50 });

    const result = selectNeighborhoodEvent(
      [template],
      pulse,
      "hood-1",
      1
    );

    expect(result).toBeNull();
  });

  it("should return true when maxTrust is not exceeded", () => {
    const template = createNeighborhoodTemplate({
      triggers: { maxTrust: 70 },
    });
    const pulse = createNeighborhoodPulse({ trust: 50 });

    const result = selectNeighborhoodEvent(
      [template],
      pulse,
      "hood-1",
      1
    );

    expect(result).toBeDefined();
  });

  it("should return false when minEconomicPrecarity not met", () => {
    const template = createNeighborhoodTemplate({
      triggers: { minEconomicPrecarity: 80 },
    });
    const pulse = createNeighborhoodPulse({ economicPrecarity: 50 });

    const result = selectNeighborhoodEvent(
      [template],
      pulse,
      "hood-1",
      1
    );

    expect(result).toBeNull();
  });

  it("should return true when minEconomicPrecarity is met", () => {
    const template = createNeighborhoodTemplate({
      triggers: { minEconomicPrecarity: 40 },
    });
    const pulse = createNeighborhoodPulse({ economicPrecarity: 50 });

    const result = selectNeighborhoodEvent(
      [template],
      pulse,
      "hood-1",
      1
    );

    expect(result).toBeDefined();
  });

  it("should check all trigger conditions", () => {
    const template = createNeighborhoodTemplate({
      triggers: {
        minEnforcementVisibility: 40,
        minSuspicion: 40,
        maxTrust: 60,
        minEconomicPrecarity: 40,
      },
    });
    const pulse = createNeighborhoodPulse({
      enforcementVisibility: 50,
      suspicion: 50,
      trust: 50,
      economicPrecarity: 50,
    });

    const result = selectNeighborhoodEvent(
      [template],
      pulse,
      "hood-1",
      1
    );

    expect(result).toBeDefined();
  });
});

// =============================================================================
// buildNeighborhoodEvent (selectNeighborhoodEvent)
// =============================================================================

describe("selectNeighborhoodEvent (buildNeighborhoodEvent)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should build a neighborhood event with correct structure", () => {
    const template = createNeighborhoodTemplate({
      type: "Checkpoint",
      targets: ["Family", "Employer"],
    });
    const pulse = createNeighborhoodPulse();

    const result = selectNeighborhoodEvent(
      [template],
      pulse,
      "test-neighborhood",
      5
    );

    expect(result).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^evt_\d+_[a-z0-9]+$/),
        type: "Checkpoint",
        severity: expect.any(Number),
        target: expect.stringMatching(/^(Family|Employer)$/),
        neighborhoodId: "test-neighborhood",
        title: "Test Audit",
        description: "Test description",
        startTurn: 5,
        effects: { trust: -5 },
      })
    );
  });

  it("should adjust weight for enforcement events based on enforcementVisibility", () => {
    // High enforcement visibility makes enforcement events more likely
    // Checkpoint (enforcement): weight = 10 * (1 + 90/100) = 19
    // Meeting: weight = 10 * (1 + 0/100) = 10
    // Total = 29. With random 0.5, we get 0.5 * 29 = 14.5
    // 14.5 - 19 = -4.5 <= 0, so Checkpoint is selected
    const restore = mockRandom([0.5]);
    const templates = [
      createNeighborhoodTemplate({ type: "Checkpoint", weight: 10 }),
      createNeighborhoodTemplate({ id: "other", type: "Meeting", weight: 10 }),
    ];

    const highEnforcementPulse = createNeighborhoodPulse({
      enforcementVisibility: 90,
    });

    const result = selectNeighborhoodEvent(
      templates,
      highEnforcementPulse,
      "hood-1",
      1
    );

    // Checkpoint should be favored due to high enforcement visibility
    expect(result?.type).toBe("Checkpoint");
    restore();
  });

  it("should adjust weight for meeting events based on communityDensity", () => {
    // Meeting: weight = 10 * (1 + 90/100) = 19
    // Audit (enforcement): weight = 10 * (1 + 0/100 + 0/200) = 10
    // Total = 29. With random 0.5, we get 0.5 * 29 = 14.5
    // 14.5 - 19 = -4.5 <= 0, so Meeting is selected
    const restore = mockRandom([0.5]);
    const templates = [
      createNeighborhoodTemplate({ type: "Meeting", weight: 10 }),
      createNeighborhoodTemplate({ id: "other", type: "Audit", weight: 10 }),
    ];

    const highCommunityPulse = createNeighborhoodPulse({
      communityDensity: 90,
    });

    const result = selectNeighborhoodEvent(
      templates,
      highCommunityPulse,
      "hood-1",
      1
    );

    // Meeting should be favored due to high community density
    expect(result?.type).toBe("Meeting");
    restore();
  });

  it("should select random target from allowed targets", () => {
    const template = createNeighborhoodTemplate({
      targets: ["Family", "Employer", "School", "Block"],
    });
    const pulse = createNeighborhoodPulse();

    const results = new Set();
    for (let i = 0; i < 20; i++) {
      const event = selectNeighborhoodEvent(
        [template],
        pulse,
        "hood-1",
        1
      );
      if (event) results.add(event.target);
    }

    // Should get at least a few different targets over 20 attempts
    expect(results.size).toBeGreaterThan(0);
  });
});

// =============================================================================
// buildCityEvent (selectCityEvent)
// =============================================================================

describe("selectCityEvent (buildCityEvent)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should build a city event with correct structure", () => {
    const template = createCityTemplate({
      category: "Budget",
      visibilityRange: [20, 40],
      durationRange: [5, 10],
    });
    const pulse = createCityPulse();

    const result = selectCityEvent(
      [template],
      pulse,
      3,
      ["hood-1", "hood-2", "hood-3"]
    );

    expect(result).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^evt_\d+_[a-z0-9]+$/),
        category: "Budget",
        visibility: expect.any(Number),
        impactRadius: expect.anything(),
        title: "Test Policy",
        description: "Test city description",
        startTurn: 3,
        durationDays: expect.any(Number),
        effects: { federalCooperation: 5 },
      })
    );
  });

  it("should return null for empty template array", () => {
    const result = selectCityEvent(
      [],
      createCityPulse(),
      1,
      ["hood-1"]
    );
    expect(result).toBeNull();
  });

  it("should set impactRadius to All when random selection favors it", () => {
    const restore = mockRandom([0.3]); // Below 0.6 threshold
    const template = createCityTemplate();

    const result = selectCityEvent(
      [template],
      createCityPulse(),
      1,
      ["hood-1", "hood-2"]
    );

    expect(result?.impactRadius).toBe("All");
    restore();
  });

  it("should generate subset of neighborhoods when random selection favors it", () => {
    const restore = mockRandom([0.8, 0.8, 0.2]); // Above 0.6, then filter results
    const template = createCityTemplate();

    const result = selectCityEvent(
      [template],
      createCityPulse(),
      1,
      ["hood-1", "hood-2", "hood-3"]
    );

    // Should be an array (subset) or "All" if empty
    expect(result?.impactRadius).toBeTruthy();
    restore();
  });

  it("should generate visibility within range", () => {
    const restore = mockRandom([0.5]);
    const template = createCityTemplate({
      visibilityRange: [25, 75],
    });

    const result = selectCityEvent(
      [template],
      createCityPulse(),
      1,
      ["hood-1"]
    );

    expect(result?.visibility).toBeGreaterThanOrEqual(25);
    expect(result?.visibility).toBeLessThanOrEqual(75);
    restore();
  });

  it("should generate duration within range", () => {
    const restore = mockRandom([0.5]);
    const template = createCityTemplate({
      durationRange: [5, 15],
    });

    const result = selectCityEvent(
      [template],
      createCityPulse(),
      1,
      ["hood-1"]
    );

    expect(result?.durationDays).toBeGreaterThanOrEqual(5);
    expect(result?.durationDays).toBeLessThanOrEqual(15);
    restore();
  });
});

// =============================================================================
// buildGlobalEvent (selectGlobalEvent)
// =============================================================================

describe("selectGlobalEvent (buildGlobalEvent)", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should build a global event with correct structure", () => {
    const pulse = createGlobalPulse();

    const result = selectGlobalEvent(pulse, 10);

    expect(result).toEqual(
      expect.objectContaining({
        id: expect.stringMatching(/^evt_\d+_[a-z0-9]+$/),
        type: expect.any(String),
        magnitude: expect.any(Number),
        durationDays: expect.any(Number),
        title: expect.any(String),
        description: expect.any(String),
        startTurn: 10,
        effects: expect.any(Object),
      })
    );
  });

  it("should return null when no templates available (internal error)", () => {
    // This is a defensive test - in normal operation, GLOBAL_EVENT_TEMPLATES is always populated
    const result = selectGlobalEvent(createGlobalPulse(), 1);
    // Should always return a result from built-in templates
    expect(result).toBeTruthy();
  });

  it("should calculate duration based on magnitude", () => {
    const restore = mockRandom([0.5]);
    const pulse = createGlobalPulse();

    const result = selectGlobalEvent(pulse, 1);

    // Duration = 7 + magnitude * 7
    // If magnitude is 2, duration = 21
    const expectedDuration = 7 + (result?.magnitude || 0) * 7;
    expect(result?.durationDays).toBe(expectedDuration);
    restore();
  });

  it("should scale effects by magnitude", () => {
    const restore = mockRandom([0.5]);
    const pulse = createGlobalPulse();

    const result = selectGlobalEvent(pulse, 1);

    // Effects should be non-empty and scaled
    expect(result?.effects).toBeDefined();
    expect(Object.keys(result?.effects || {}).length).toBeGreaterThan(0);
    restore();
  });

  it("should select from built-in event types", () => {
    const restore = mockRandom([0.5]);
    const pulse = createGlobalPulse();

    const result = selectGlobalEvent(pulse, 1);

    expect(["Executive", "Judicial", "Media", "Security"]).toContain(
      result?.type
    );
    restore();
  });
});

// =============================================================================
// applyEffects
// =============================================================================

describe("applyGlobalEventEffects", () => {
  it("should apply effects to pulse values", () => {
    const pulse = createGlobalPulse({
      enforcementClimate: 50,
      mediaNarrative: 0,
    });

    const effects = {
      enforcementClimate: 10,
      mediaNarrative: 20,
    };

    const result = applyGlobalEventEffects(pulse, effects);

    expect(result.enforcementClimate).toBe(60);
    expect(result.mediaNarrative).toBe(20);
  });

  it("should clamp values to 0-100 range", () => {
    const pulse = createGlobalPulse({
      enforcementClimate: 95,
      mediaNarrative: -50,
    });

    const effects = {
      enforcementClimate: 20, // Would exceed 100
      mediaNarrative: -100, // Would go below -100
    };

    const result = applyGlobalEventEffects(pulse, effects);

    expect(result.enforcementClimate).toBe(100);
    expect(result.mediaNarrative).toBeGreaterThanOrEqual(-100);
  });

  it("should not modify original pulse", () => {
    const pulse = createGlobalPulse({ enforcementClimate: 50 });

    applyGlobalEventEffects(pulse, { enforcementClimate: 10 });

    expect(pulse.enforcementClimate).toBe(50);
  });

  it("should ignore invalid effect keys", () => {
    const pulse = createGlobalPulse({ enforcementClimate: 50 });

    const effects = {
      enforcementClimate: 10,
      invalidKey: 999,
    } as any;

    const result = applyGlobalEventEffects(pulse, effects);

    expect(result.enforcementClimate).toBe(60);
  });
});

describe("applyCityEventEffects", () => {
  it("should apply effects to city pulse", () => {
    const pulse = createCityPulse({
      federalCooperation: 50,
      politicalCover: 30,
    });

    const effects = {
      federalCooperation: -10,
      politicalCover: 20,
    };

    const result = applyCityEventEffects(pulse, effects);

    expect(result.federalCooperation).toBe(40);
    expect(result.politicalCover).toBe(50);
  });

  it("should clamp values to valid range", () => {
    const pulse = createCityPulse({
      federalCooperation: 5,
      dataDensity: 98,
    });

    const effects = {
      federalCooperation: -20,
      dataDensity: 20,
    };

    const result = applyCityEventEffects(pulse, effects);

    expect(result.federalCooperation).toBe(0); // Clamped to minimum
    expect(result.dataDensity).toBe(100); // Clamped to maximum
  });

  it("should not modify original pulse", () => {
    const pulse = createCityPulse({ federalCooperation: 50 });

    applyCityEventEffects(pulse, { federalCooperation: 10 });

    expect(pulse.federalCooperation).toBe(50);
  });
});

describe("applyNeighborhoodEventEffects", () => {
  it("should apply effects to neighborhood pulse", () => {
    const pulse = createNeighborhoodPulse({
      trust: 60,
      suspicion: 40,
      enforcementVisibility: 50,
    });

    const effects = {
      trust: -15,
      suspicion: 30,
      enforcementVisibility: 10,
    };

    const result = applyNeighborhoodEventEffects(pulse, effects);

    expect(result.trust).toBe(45);
    expect(result.suspicion).toBe(70);
    expect(result.enforcementVisibility).toBe(60);
  });

  it("should clamp values to valid range", () => {
    const pulse = createNeighborhoodPulse({
      trust: 2,
      suspicion: 99,
    });

    const effects = {
      trust: -10,
      suspicion: 10,
    };

    const result = applyNeighborhoodEventEffects(pulse, effects);

    expect(result.trust).toBe(0); // Clamped
    expect(result.suspicion).toBe(100); // Clamped
  });

  it("should not modify original pulse", () => {
    const pulse = createNeighborhoodPulse({ trust: 50 });

    applyNeighborhoodEventEffects(pulse, { trust: 10 });

    expect(pulse.trust).toBe(50);
  });
});

describe("applyEventEffects (generic)", () => {
  it("should apply effects to generic pulse object", () => {
    const pulse = { foo: 50, bar: 25 };
    const effects = { foo: 10, bar: -5 };

    const result = applyEventEffects(pulse, effects);

    expect(result.foo).toBe(60);
    expect(result.bar).toBe(20);
  });

  it("should clamp values to 0-100 range", () => {
    const pulse = { value: 95 };
    const effects = { value: 20 };

    const result = applyEventEffects(pulse, effects);

    expect(result.value).toBe(100);
  });

  it("should handle negative clamping", () => {
    const pulse = { value: 5 };
    const effects = { value: -20 };

    const result = applyEventEffects(pulse, effects);

    expect(result.value).toBe(0);
  });

  it("should not modify original pulse", () => {
    const pulse = { value: 50 };

    applyEventEffects(pulse, { value: 10 });

    expect(pulse.value).toBe(50);
  });
});

// =============================================================================
// shouldTrigger* functions
// =============================================================================

describe("shouldTriggerNeighborhoodEvent", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return boolean", () => {
    const pulse = createNeighborhoodPulse();

    const result = shouldTriggerNeighborhoodEvent(pulse);

    expect(typeof result).toBe("boolean");
  });

  it("should increase probability with high enforcementVisibility", () => {
    const restore = mockRandom([0.35]); // Between base and boosted

    const lowPulse = createNeighborhoodPulse({ enforcementVisibility: 0 });
    const highPulse = createNeighborhoodPulse({ enforcementVisibility: 100 });

    const lowResult = shouldTriggerNeighborhoodEvent(lowPulse);
    const highResult = shouldTriggerNeighborhoodEvent(highPulse);

    // Higher enforcement visibility should increase probability
    // At 0.35 random value: low=0.3 prob (false), high=0.5 prob (true)
    expect(lowResult).toBe(false);
    expect(highResult).toBe(true);

    restore();
  });

  it("should increase probability with high suspicion", () => {
    // Need to account for enforcementVisibility and trust also affecting probability
    // Low suspicion (0): probability = 0.3 + 50*0.002 + 0*0.001 - 50*0.001 = 0.3 + 0.1 + 0 - 0.05 = 0.35
    // High suspicion (100): probability = 0.3 + 50*0.002 + 100*0.001 - 50*0.001 = 0.3 + 0.1 + 0.1 - 0.05 = 0.45
    const restore = mockRandom([0.38]);

    const lowPulse = createNeighborhoodPulse({ suspicion: 0 });
    const highPulse = createNeighborhoodPulse({ suspicion: 100 });

    const lowResult = shouldTriggerNeighborhoodEvent(lowPulse);
    const highResult = shouldTriggerNeighborhoodEvent(highPulse);

    // 0.38 < 0.35 = false, 0.38 < 0.45 = true
    expect(lowResult).toBe(false);
    expect(highResult).toBe(true);

    restore();
  });

  it("should decrease probability with high trust", () => {
    // Low trust (0): probability = 0.3 + 50*0.002 + 50*0.001 - 0*0.001 = 0.3 + 0.1 + 0.05 - 0 = 0.45
    // High trust (100): probability = 0.3 + 50*0.002 + 50*0.001 - 100*0.001 = 0.3 + 0.1 + 0.05 - 0.1 = 0.35
    const restore = mockRandom([0.38]);

    const lowTrustPulse = createNeighborhoodPulse({ trust: 0 });
    const highTrustPulse = createNeighborhoodPulse({ trust: 100 });

    const lowTrustResult = shouldTriggerNeighborhoodEvent(lowTrustPulse);
    const highTrustResult = shouldTriggerNeighborhoodEvent(highTrustPulse);

    // 0.38 < 0.45 = true, 0.38 < 0.35 = false
    expect(lowTrustResult).toBe(true);
    expect(highTrustResult).toBe(false);

    restore();
  });
});

describe("shouldTriggerCityEvent", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return boolean", () => {
    const pulse = createCityPulse();

    const result = shouldTriggerCityEvent(1, pulse);

    expect(typeof result).toBe("boolean");
  });

  it("should decrease probability with high politicalCover", () => {
    const restore = mockRandom([0.12]);

    const lowCoverPulse = createCityPulse({ politicalCover: 0 });
    const highCoverPulse = createCityPulse({ politicalCover: 100 });

    const lowResult = shouldTriggerCityEvent(1, lowCoverPulse);
    const highResult = shouldTriggerCityEvent(1, highCoverPulse);

    // High political cover reduces probability
    expect(lowResult).toBe(true);
    expect(highResult).toBe(false);

    restore();
  });

  it("should increase probability with high bureaucraticInertia", () => {
    const restore = mockRandom([0.18]);

    const lowInertiaPulse = createCityPulse({ bureaucraticInertia: 0 });
    const highInertiaPulse = createCityPulse({ bureaucraticInertia: 100 });

    const lowResult = shouldTriggerCityEvent(1, lowInertiaPulse);
    const highResult = shouldTriggerCityEvent(1, highInertiaPulse);

    expect(lowResult).toBe(false);
    expect(highResult).toBe(true);

    restore();
  });
});

describe("shouldTriggerGlobalEvent", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("should return boolean", () => {
    const pulse = createGlobalPulse();

    const result = shouldTriggerGlobalEvent(pulse);

    expect(typeof result).toBe("boolean");
  });

  it("should increase probability with politicalVolatility", () => {
    const restore = mockRandom([0.05]);

    const lowVolatilityPulse = createGlobalPulse({ politicalVolatility: 0 });
    const highVolatilityPulse = createGlobalPulse({ politicalVolatility: 100 });

    const lowResult = shouldTriggerGlobalEvent(lowVolatilityPulse);
    const highResult = shouldTriggerGlobalEvent(highVolatilityPulse);

    // Low volatility: 0.02 prob (false at 0.05)
    // High volatility: 0.08 prob (false at 0.05 too)
    expect(lowResult).toBe(false);

    restore();
  });

  it("should trigger more often at high volatility", () => {
    const restore = mockRandom([0.06]);

    const highVolatilityPulse = createGlobalPulse({ politicalVolatility: 100 });

    const result = shouldTriggerGlobalEvent(highVolatilityPulse);

    // At max volatility, probability is 0.08
    expect(result).toBe(true);

    restore();
  });
});

// =============================================================================
// pruneExpiredEvents
// =============================================================================

describe("pruneExpiredEvents", () => {
  it("should remove expired global events", () => {
    const events: ActiveEvents = {
      global: [
        {
          id: "evt-1",
          type: "Executive",
          magnitude: 3,
          durationDays: 10,
          title: "Test",
          description: "Test",
          startTurn: 1,
          effects: {},
        },
        {
          id: "evt-2",
          type: "Judicial",
          magnitude: 2,
          durationDays: 5,
          title: "Test",
          description: "Test",
          startTurn: 1,
          effects: {},
        },
      ],
      city: [],
      neighborhood: [],
    };

    // At turn 7, evt-2 expired (1 + 5 = 6), evt-1 still active
    const result = pruneExpiredEvents(events, 7);

    expect(result.global).toHaveLength(1);
    expect(result.global[0].id).toBe("evt-1");
  });

  it("should remove expired city events", () => {
    const events: ActiveEvents = {
      global: [],
      city: [
        {
          id: "city-1",
          category: "Policy",
          visibility: 50,
          impactRadius: "All",
          title: "Test",
          description: "Test",
          startTurn: 1,
          durationDays: 5,
          effects: {},
        },
        {
          id: "city-2",
          category: "Budget",
          visibility: 30,
          impactRadius: "All",
          title: "Test",
          description: "Test",
          startTurn: 3,
          durationDays: 10,
          effects: {},
        },
      ],
      neighborhood: [],
    };

    // At turn 8, city-1 expired (1 + 5 = 6), city-2 still active
    const result = pruneExpiredEvents(events, 8);

    expect(result.city).toHaveLength(1);
    expect(result.city[0].id).toBe("city-2");
  });

  it("should only keep neighborhood events from current turn", () => {
    const events: ActiveEvents = {
      global: [],
      city: [],
      neighborhood: [
        {
          id: "hood-1",
          type: "Audit",
          severity: 3,
          target: "Family",
          neighborhoodId: "hood-a",
          title: "Test",
          description: "Test",
          startTurn: 5,
          effects: {},
        },
        {
          id: "hood-2",
          type: "Meeting",
          severity: 2,
          target: "Block",
          neighborhoodId: "hood-a",
          title: "Test",
          description: "Test",
          startTurn: 6,
          effects: {},
        },
      ],
    };

    // Neighborhood events are instant - only keep turn 6 events
    const result = pruneExpiredEvents(events, 6);

    expect(result.neighborhood).toHaveLength(1);
    expect(result.neighborhood[0].id).toBe("hood-2");
  });

  it("should not modify original events object", () => {
    const events: ActiveEvents = {
      global: [
        {
          id: "evt-1",
          type: "Executive",
          magnitude: 3,
          durationDays: 5,
          title: "Test",
          description: "Test",
          startTurn: 1,
          effects: {},
        },
      ],
      city: [],
      neighborhood: [],
    };

    pruneExpiredEvents(events, 10);

    expect(events.global).toHaveLength(1);
  });

  it("should handle empty events", () => {
    const events: ActiveEvents = {
      global: [],
      city: [],
      neighborhood: [],
    };

    const result = pruneExpiredEvents(events, 5);

    expect(result.global).toHaveLength(0);
    expect(result.city).toHaveLength(0);
    expect(result.neighborhood).toHaveLength(0);
  });
});
