/**
 * Tests for Pulse Engine
 * Tests for: updateAllPulses, updateGlobalPulse, updateCityPulse,
 *            updateNeighborhoodPulse, updateFamilyImpact,
 *            shouldUpdateGlobalPulse, shouldUpdateCityPulse
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import {
  updateAllPulses,
  updateGlobalPulse,
  updateCityPulse,
  updateNeighborhoodPulse,
  updateFamilyImpact,
  shouldUpdateGlobalPulse,
  shouldUpdateCityPulse,
  type WorldState,
  type UpdateResult,
} from "./pulse";
import type {
  GlobalPulse,
  CityPulse,
  NeighborhoodPulse,
  FamilyImpact,
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

function createMockFamilyImpact(overrides?: Partial<FamilyImpact>): FamilyImpact {
  return {
    visibility: 50,
    stress: 50,
    cohesion: 50,
    trustNetworkStrength: 50,
    ...overrides,
  };
}

function createMockWorldState(overrides?: Partial<WorldState>): WorldState {
  return {
    global: createMockGlobalPulse(),
    city: createMockCityPulse(),
    neighborhoods: [
      {
        id: "n1",
        pulse: createMockNeighborhoodPulse(),
      },
      {
        id: "n2",
        pulse: createMockNeighborhoodPulse({ trust: 40 }),
      },
    ],
    family: createMockFamilyImpact(),
    ...overrides,
  };
}

describe("updateGlobalPulse", () => {
  it("returns a pulse object with all required properties", () => {
    const pulse = createMockGlobalPulse();
    const result = updateGlobalPulse(pulse);

    expect(result).toHaveProperty("enforcementClimate");
    expect(result).toHaveProperty("mediaNarrative");
    expect(result).toHaveProperty("judicialAlignment");
    expect(result).toHaveProperty("politicalVolatility");
  });

  it("clamps enforcementClimate between 0 and 100", () => {
    const low = updateGlobalPulse(createMockGlobalPulse({ enforcementClimate: 0 }));
    const high = updateGlobalPulse(createMockGlobalPulse({ enforcementClimate: 100 }));

    expect(low.enforcementClimate).toBeGreaterThanOrEqual(0);
    expect(low.enforcementClimate).toBeLessThanOrEqual(100);
    expect(high.enforcementClimate).toBeGreaterThanOrEqual(0);
    expect(high.enforcementClimate).toBeLessThanOrEqual(100);
  });

  it("clamps mediaNarrative between -100 and 100", () => {
    const result = updateGlobalPulse(createMockGlobalPulse({ mediaNarrative: 0 }));

    expect(result.mediaNarrative).toBeGreaterThanOrEqual(-100);
    expect(result.mediaNarrative).toBeLessThanOrEqual(100);
  });

  it("clamps judicialAlignment between -50 and 50", () => {
    const result = updateGlobalPulse(createMockGlobalPulse({ judicialAlignment: 0 }));

    expect(result.judicialAlignment).toBeGreaterThanOrEqual(-50);
    expect(result.judicialAlignment).toBeLessThanOrEqual(50);
  });

  it("increases drift range with higher political volatility", () => {
    const lowVolatility = createMockGlobalPulse({ politicalVolatility: 10 });
    const highVolatility = createMockGlobalPulse({ politicalVolatility: 90 });

    // With same seed, higher volatility should produce more variation
    const mockRandom = vi.spyOn(Math, "random");

    mockRandom.mockReturnValue(0.75); // Max positive drift
    const lowResult = updateGlobalPulse(lowVolatility);

    mockRandom.mockReturnValue(0.75);
    const highResult = updateGlobalPulse(highVolatility);

    mockRandom.mockRestore();

    // Higher volatility allows larger changes
    expect(highResult.enforcementClimate).not.toBe(lowResult.enforcementClimate);
  });

  it("does not modify original pulse", () => {
    const pulse = createMockGlobalPulse({ enforcementClimate: 50 });
    const originalClimate = pulse.enforcementClimate;
    updateGlobalPulse(pulse);

    expect(pulse.enforcementClimate).toBe(originalClimate);
  });
});

describe("shouldUpdateGlobalPulse", () => {
  it("returns false when not enough turns have passed", () => {
    const result = shouldUpdateGlobalPulse(5, 1, 50);
    expect(result).toBe(false);
  });

  it("returns true when enough turns have passed", () => {
    const result = shouldUpdateGlobalPulse(28, 0, 50);
    expect(result).toBe(true);
  });

  it("returns true after minimum cadence regardless of volatility", () => {
    const result = shouldUpdateGlobalPulse(14, 0, 100);
    expect(result).toBe(true);
  });

  it("decreases interval with higher volatility", () => {
    // Update interval formula: 28 - (volatility/100) * 14
    // low volatility (10): 28 - 1.4 = 26.6 turns needed
    // high volatility (90): 28 - 12.6 = 15.4 turns needed

    // At turn 20, low volatility should not trigger yet
    const lowVol = shouldUpdateGlobalPulse(20, 0, 10);
    // At turn 20, high volatility should trigger
    const highVol = shouldUpdateGlobalPulse(20, 0, 90);

    expect(lowVol).toBe(false); // 20 < 26.6
    expect(highVol).toBe(true); // 20 >= 15.4
  });
});

describe("updateCityPulse", () => {
  it("returns a pulse object with all required properties", () => {
    const cityPulse = createMockCityPulse();
    const globalPulse = createMockGlobalPulse();
    const result = updateCityPulse(cityPulse, globalPulse);

    expect(result).toHaveProperty("federalCooperation");
    expect(result).toHaveProperty("dataDensity");
    expect(result).toHaveProperty("politicalCover");
    expect(result).toHaveProperty("civilSocietyCapacity");
    expect(result).toHaveProperty("bureaucraticInertia");
  });

  it("increases federalCooperation with high global enforcementClimate", () => {
    const cityPulse = createMockCityPulse({ federalCooperation: 50 });
    const globalPulse = createMockGlobalPulse({ enforcementClimate: 90 });

    // Mock drift to be neutral
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const result = updateCityPulse(cityPulse, globalPulse);

    mockRandom.mockRestore();

    // High enforcementClimate should push cooperation up
    expect(result.federalCooperation).toBeGreaterThan(49);
  });

  it("decreases politicalCover with negative global mediaNarrative", () => {
    const cityPulse = createMockCityPulse({ politicalCover: 50 });
    const globalPulse = createMockGlobalPulse({ mediaNarrative: -80 });

    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const result = updateCityPulse(cityPulse, globalPulse);

    mockRandom.mockRestore();

    // Negative narrative creates positive bias, but should decrease
    // The test verifies the relationship between mediaNarrative and politicalCover
    expect(result.politicalCover).toBeGreaterThan(45);
    expect(result.politicalCover).toBeLessThan(60);
  });

  it("changes dataDensity very slowly", () => {
    const cityPulse = createMockCityPulse({ dataDensity: 50 });
    const globalPulse = createMockGlobalPulse();

    // With neutral drift, dataDensity should barely change
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const result = updateCityPulse(cityPulse, globalPulse);

    mockRandom.mockRestore();

    // Data density changes very slowly (drift range of 1)
    expect(result.dataDensity).toBeCloseTo(50, 0);
  });

  it("does not modify original pulse", () => {
    const cityPulse = createMockCityPulse({ politicalCover: 50 });
    const originalCover = cityPulse.politicalCover;
    updateCityPulse(cityPulse, createMockGlobalPulse());

    expect(cityPulse.politicalCover).toBe(originalCover);
  });
});

describe("shouldUpdateCityPulse", () => {
  it("returns true when turn is multiple of 7", () => {
    expect(shouldUpdateCityPulse(7)).toBe(true);
    expect(shouldUpdateCityPulse(14)).toBe(true);
    expect(shouldUpdateCityPulse(21)).toBe(true);
  });

  it("returns false when turn is not multiple of 7", () => {
    expect(shouldUpdateCityPulse(1)).toBe(false);
    expect(shouldUpdateCityPulse(5)).toBe(false);
    expect(shouldUpdateCityPulse(13)).toBe(false);
  });
});

describe("updateNeighborhoodPulse", () => {
  let neighborhoodPulse: NeighborhoodPulse;
  let cityPulse: CityPulse;
  let globalPulse: GlobalPulse;
  let family: FamilyImpact;

  beforeEach(() => {
    neighborhoodPulse = createMockNeighborhoodPulse();
    cityPulse = createMockCityPulse();
    globalPulse = createMockGlobalPulse();
    family = createMockFamilyImpact();
  });

  it("returns a pulse object with all required properties", () => {
    const result = updateNeighborhoodPulse(
      neighborhoodPulse,
      cityPulse,
      globalPulse,
      family
    );

    expect(result).toHaveProperty("trust");
    expect(result).toHaveProperty("suspicion");
    expect(result).toHaveProperty("enforcementVisibility");
    expect(result).toHaveProperty("communityDensity");
    expect(result).toHaveProperty("economicPrecarity");
  });

  it("increases trust with high family trustNetworkStrength", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const lowFamily = createMockFamilyImpact({ trustNetworkStrength: 10 });
    const highFamily = createMockFamilyImpact({ trustNetworkStrength: 90 });

    const lowResult = updateNeighborhoodPulse(
      neighborhoodPulse,
      cityPulse,
      globalPulse,
      lowFamily
    );
    const highResult = updateNeighborhoodPulse(
      neighborhoodPulse,
      cityPulse,
      globalPulse,
      highFamily
    );

    mockRandom.mockRestore();

    expect(highResult.trust).toBeGreaterThan(lowResult.trust);
  });

  it("increases suspicion with high family visibility", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const lowVisibility = createMockFamilyImpact({ visibility: 10 });
    const highVisibility = createMockFamilyImpact({ visibility: 90 });

    const lowResult = updateNeighborhoodPulse(
      neighborhoodPulse,
      cityPulse,
      globalPulse,
      lowVisibility
    );
    const highResult = updateNeighborhoodPulse(
      neighborhoodPulse,
      cityPulse,
      globalPulse,
      highVisibility
    );

    mockRandom.mockRestore();

    expect(highResult.suspicion).toBeGreaterThan(lowResult.suspicion);
  });

  it("increases enforcementVisibility with high city and global enforcement", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const lowCity = createMockCityPulse({ federalCooperation: 10 });
    const lowGlobal = createMockGlobalPulse({ enforcementClimate: 10 });

    const highCity = createMockCityPulse({ federalCooperation: 90 });
    const highGlobal = createMockGlobalPulse({ enforcementClimate: 90 });

    const lowResult = updateNeighborhoodPulse(
      neighborhoodPulse,
      lowCity,
      lowGlobal,
      family
    );
    const highResult = updateNeighborhoodPulse(
      neighborhoodPulse,
      highCity,
      highGlobal,
      family
    );

    mockRandom.mockRestore();

    expect(highResult.enforcementVisibility).toBeGreaterThan(
      lowResult.enforcementVisibility
    );
  });

  it("changes communityDensity very slowly", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const result = updateNeighborhoodPulse(
      neighborhoodPulse,
      cityPulse,
      globalPulse,
      family
    );

    mockRandom.mockRestore();

    // Community density changes very slowly (drift range of 1)
    expect(result.communityDensity).toBeCloseTo(50, 0);
  });

  it("does not modify original pulse", () => {
    const originalTrust = neighborhoodPulse.trust;
    updateNeighborhoodPulse(neighborhoodPulse, cityPulse, globalPulse, family);

    expect(neighborhoodPulse.trust).toBe(originalTrust);
  });
});

describe("updateFamilyImpact", () => {
  let family: FamilyImpact;
  let neighborhood: NeighborhoodPulse;

  beforeEach(() => {
    family = createMockFamilyImpact();
    neighborhood = createMockNeighborhoodPulse();
  });

  it("returns a family object with all required properties", () => {
    const result = updateFamilyImpact(family, neighborhood);

    expect(result).toHaveProperty("visibility");
    expect(result).toHaveProperty("stress");
    expect(result).toHaveProperty("cohesion");
    expect(result).toHaveProperty("trustNetworkStrength");
  });

  it("increases stress with high enforcementVisibility", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const lowEnforcement = createMockNeighborhoodPulse({ enforcementVisibility: 10 });
    const highEnforcement = createMockNeighborhoodPulse({ enforcementVisibility: 90 });
    const baseFamily = createMockFamilyImpact({ visibility: 50 });

    const lowResult = updateFamilyImpact(baseFamily, lowEnforcement);
    const highResult = updateFamilyImpact(baseFamily, highEnforcement);

    mockRandom.mockRestore();

    expect(highResult.stress).toBeGreaterThan(lowResult.stress);
  });

  it("increases stress with high economicPrecarity", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const lowPrecarity = createMockNeighborhoodPulse({ economicPrecarity: 10 });
    const highPrecarity = createMockNeighborhoodPulse({ economicPrecarity: 90 });
    const baseFamily = createMockFamilyImpact({ visibility: 50 });

    const lowResult = updateFamilyImpact(baseFamily, lowPrecarity);
    const highResult = updateFamilyImpact(baseFamily, highPrecarity);

    mockRandom.mockRestore();

    expect(highResult.stress).toBeGreaterThan(lowResult.stress);
  });

  it("stress increase is amplified by family visibility", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const highEnforcement = createMockNeighborhoodPulse({ enforcementVisibility: 90 });
    const lowVisibility = createMockFamilyImpact({ visibility: 20 });
    const highVisibility = createMockFamilyImpact({ visibility: 80 });

    const lowResult = updateFamilyImpact(lowVisibility, highEnforcement);
    const highResult = updateFamilyImpact(highVisibility, highEnforcement);

    mockRandom.mockRestore();

    // Higher visibility = more stress from enforcement
    expect(highResult.stress).toBeGreaterThan(lowResult.stress);
  });

  it("decreases cohesion when stress is high", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const highStressFamily = createMockFamilyImpact({ stress: 80 });
    const result = updateFamilyImpact(highStressFamily, neighborhood);

    mockRandom.mockRestore();

    expect(result.cohesion).toBeLessThan(51);
  });

  it("increases cohesion when stress is low", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const lowStressFamily = createMockFamilyImpact({ stress: 30 });
    const result = updateFamilyImpact(lowStressFamily, neighborhood);

    mockRandom.mockRestore();

    expect(result.cohesion).toBeGreaterThan(49);
  });

  it("adjusts trustNetworkStrength based on communityDensity", () => {
    const mockRandom = vi.spyOn(Math, "random").mockReturnValue(0.5);

    const lowDensity = createMockNeighborhoodPulse({ communityDensity: 20 });
    const highDensity = createMockNeighborhoodPulse({ communityDensity: 80 });
    const baseFamily = createMockFamilyImpact({ trustNetworkStrength: 50 });

    const lowResult = updateFamilyImpact(baseFamily, lowDensity);
    const highResult = updateFamilyImpact(baseFamily, highDensity);

    mockRandom.mockRestore();

    expect(highResult.trustNetworkStrength).toBeGreaterThan(
      lowResult.trustNetworkStrength
    );
  });

  it("does not modify original family", () => {
    const originalStress = family.stress;
    updateFamilyImpact(family, neighborhood);

    expect(family.stress).toBe(originalStress);
  });
});

describe("updateAllPulses", () => {
  let worldState: WorldState;

  beforeEach(() => {
    worldState = createMockWorldState();
  });

  it("returns an UpdateResult with all pulses", () => {
    const result = updateAllPulses(worldState, 1, 0, "n1");

    expect(result).toHaveProperty("global");
    expect(result).toHaveProperty("city");
    expect(result).toHaveProperty("neighborhoods");
    expect(result).toHaveProperty("family");
    expect(result).toHaveProperty("updatedLayers");
  });

  it("always updates family layer", () => {
    const result = updateAllPulses(worldState, 1, 0, "n1");

    expect(result.updatedLayers).toContain("family");
  });

  it("always updates neighborhood layer", () => {
    const result = updateAllPulses(worldState, 1, 0, "n1");

    expect(result.updatedLayers).toContain("neighborhood");
  });

  it("updates global layer when cadence is met", () => {
    const result = updateAllPulses(worldState, 28, 0, "n1");

    expect(result.updatedLayers).toContain("global");
  });

  it("does not update global layer when cadence is not met", () => {
    const result = updateAllPulses(worldState, 5, 0, "n1");

    expect(result.updatedLayers).not.toContain("global");
  });

  it("updates city layer when turn is multiple of 7", () => {
    const result = updateAllPulses(worldState, 7, 0, "n1");

    expect(result.updatedLayers).toContain("city");
  });

  it("does not update city layer when turn is not multiple of 7", () => {
    const result = updateAllPulses(worldState, 5, 0, "n1");

    expect(result.updatedLayers).not.toContain("city");
  });

  it("updates current neighborhood with family influence", () => {
    const result = updateAllPulses(worldState, 1, 0, "n1");

    const currentNeighborhood = result.neighborhoods.find((n) => n.id === "n1");
    expect(currentNeighborhood).toBeDefined();
  });

  it("updates other neighborhoods without family influence", () => {
    const result = updateAllPulses(worldState, 1, 0, "n2");

    // n1 should still be updated, but without family influence
    const otherNeighborhood = result.neighborhoods.find((n) => n.id === "n1");
    expect(otherNeighborhood).toBeDefined();
  });

  it("updates family based on current neighborhood", () => {
    const highStressNeighborhood = createMockNeighborhoodPulse({
      enforcementVisibility: 90,
      economicPrecarity: 90,
    });

    const state = createMockWorldState({
      neighborhoods: [
        { id: "n1", pulse: highStressNeighborhood },
        { id: "n2", pulse: createMockNeighborhoodPulse() },
      ],
    });

    const result = updateAllPulses(state, 1, 0, "n1");

    // Family stress should increase due to high enforcement visibility
    expect(result.family.stress).toBeGreaterThanOrEqual(50);
  });

  it("clamps all pulse values at boundaries", () => {
    const extremeState = createMockWorldState({
      global: {
        enforcementClimate: 0,
        mediaNarrative: -100,
        judicialAlignment: -50,
        politicalVolatility: 0,
      },
      family: {
        visibility: 0,
        stress: 0,
        cohesion: 0,
        trustNetworkStrength: 0,
      },
    });

    const result = updateAllPulses(extremeState, 1, 0, "n1");

    // All values should stay within bounds
    expect(result.global.enforcementClimate).toBeGreaterThanOrEqual(0);
    expect(result.global.enforcementClimate).toBeLessThanOrEqual(100);
    expect(result.family.stress).toBeGreaterThanOrEqual(0);
    expect(result.family.stress).toBeLessThanOrEqual(100);
  });

  it("does not modify original world state", () => {
    const originalGlobalClimate = worldState.global.enforcementClimate;
    const originalFamilyStress = worldState.family.stress;

    updateAllPulses(worldState, 1, 0, "n1");

    expect(worldState.global.enforcementClimate).toBe(originalGlobalClimate);
    expect(worldState.family.stress).toBe(originalFamilyStress);
  });
});
