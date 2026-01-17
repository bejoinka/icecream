import { POST, GET, DELETE } from "../route";
import { POST as POST_NEXT } from "../next/route";
import { POST as POST_CHOOSE } from "../choose/route";
import { NextRequest } from "next/server";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Mock Redis functions
vi.mock("@/lib/redis", () => ({
  getGameState: vi.fn(),
  setGameState: vi.fn(),
  deleteGameState: vi.fn(),
  sessionExists: vi.fn(),
  touchSession: vi.fn(),
}));

// Mock factory functions
vi.mock("@/lib/types/factory", () => ({
  createDemoGameState: vi.fn(() => ({
    sessionId: "simulator",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    turn: { day: 1, phase: "Plan", week: 1 },
    global: {
      pulse: {
        enforcementClimate: 60,
        mediaNarrative: 20,
        judicialAlignment: 15,
        politicalVolatility: 45,
      },
      activeEvents: [],
    },
    city: {
      id: "city-1",
      name: "Harbor City",
      state: "CA",
      pulse: {
        federalCooperation: 55,
        dataDensity: 80,
        politicalCover: 35,
        civilSocietyCapacity: 60,
        bureaucraticInertia: 70,
      },
      neighborhoods: [],
      activeEvents: [],
    },
    currentNeighborhoodId: "neighborhood-1",
    family: {
      visibility: 30,
      stress: 20,
      cohesion: 70,
      trustNetworkStrength: 40,
    },
    result: {
      outcome: "InProgress",
    },
    seed: 12345,
  })),
}));

import {
  getGameState,
  setGameState,
  sessionExists,
  touchSession,
} from "@/lib/redis";

const mockGetGameState = vi.mocked(getGameState);
const mockSetGameState = vi.mocked(setGameState);
const mockSessionExists = vi.mocked(sessionExists);
const mockTouchSession = vi.mocked(touchSession);

// Helper to create a mock request
function createMockRequest(
  method: string,
  body?: unknown,
  headers?: Record<string, string>
): NextRequest {
  const request = new NextRequest(
    new Request(`http://localhost:3000/api/admin/simulator${method === "NEXT" ? "/next" : method === "CHOOSE" ? "/choose" : ""}`, {
      method: method === "GET" ? "GET" : method === "DELETE" ? "DELETE" : "POST",
      headers: {
        "x-api-key": "test-admin-key",
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
    })
  );
  return request as unknown as NextRequest;
}

describe("Simulator API Routes", () => {
  const mockState = {
    sessionId: "simulator",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    turn: { day: 1, phase: "Plan", week: 1 },
    global: {
      pulse: {
        enforcementClimate: 60,
        mediaNarrative: 20,
        judicialAlignment: 15,
        politicalVolatility: 45,
      },
      activeEvents: [],
    },
    city: {
      id: "city-1",
      name: "Harbor City",
      state: "CA",
      pulse: {
        federalCooperation: 55,
        dataDensity: 80,
        politicalCover: 35,
        civilSocietyCapacity: 60,
        bureaucraticInertia: 70,
      },
      neighborhoods: [],
      activeEvents: [],
    },
    currentNeighborhoodId: "neighborhood-1",
    family: {
      visibility: 30,
      stress: 20,
      cohesion: 70,
      trustNetworkStrength: 40,
    },
    result: {
      outcome: "InProgress",
    },
    seed: 12345,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubEnv("ADMIN_API_KEY", "test-admin-key");
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  // ==========================================================================
  // GET /api/admin/simulator/state
  // ==========================================================================

  describe("GET /api/admin/simulator/state", () => {
    it("returns 401 when no API key is provided", async () => {
      const request = createMockRequest("GET", undefined, { "x-api-key": "" });
      const response = await GET(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("returns 401 when wrong API key is provided", async () => {
      const request = createMockRequest("GET", undefined, {
        "x-api-key": "wrong-key",
      });
      const response = await GET(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("returns 404 when no simulator session exists", async () => {
      mockGetGameState.mockResolvedValue(null);

      const request = createMockRequest("GET");
      const response = await GET(request);
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json).toEqual({
        error: "No simulator session found. Use POST to create one.",
      });
    });

    it("returns the simulator state when it exists", async () => {
      mockGetGameState.mockResolvedValue(mockState);

      const request = createMockRequest("GET");
      const response = await GET(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.sessionId).toBe("simulator");
      expect(json.turn.day).toBe(1);
    });

    it("returns 500 on error", async () => {
      mockGetGameState.mockRejectedValue(new Error("Redis error"));

      const request = createMockRequest("GET");
      const response = await GET(request);
      expect(response.status).toBe(500);

      const json = await response.json();
      expect(json.error).toBe("Failed to fetch simulator state");
    });
  });

  // ==========================================================================
  // POST /api/admin/simulator
  // ==========================================================================

  describe("POST /api/admin/simulator", () => {
    it("returns 401 when no API key is provided", async () => {
      const request = createMockRequest("POST", undefined, { "x-api-key": "" });
      const response = await POST(request);
      expect(response.status).toBe(401);
    });

    it("creates a new simulator session", async () => {
      mockSetGameState.mockResolvedValue(undefined);

      const request = createMockRequest("POST", { cityId: "atlanta-ga" });
      const response = await POST(request);
      expect(response.status).toBe(201);

      const json = await response.json();
      expect(json.sessionId).toBe("simulator");
      expect(mockSetGameState).toHaveBeenCalledWith(
        "simulator",
        expect.any(Object)
      );
    });

    it("creates a session even without cityId", async () => {
      mockSetGameState.mockResolvedValue(undefined);

      const request = createMockRequest("POST", {});
      const response = await POST(request);
      expect(response.status).toBe(201);
      expect(mockSetGameState).toHaveBeenCalled();
    });

    it("returns 500 on error", async () => {
      mockSetGameState.mockRejectedValue(new Error("Redis error"));

      const request = createMockRequest("POST", {});
      const response = await POST(request);
      expect(response.status).toBe(500);

      const json = await response.json();
      expect(json.error).toBe("Failed to create simulator session");
    });
  });

  // ==========================================================================
  // POST /api/admin/simulator/next
  // ==========================================================================

  describe("POST /api/admin/simulator/next", () => {
    it("returns 401 when no API key is provided", async () => {
      const request = createMockRequest("NEXT", undefined, { "x-api-key": "" });
      const response = await POST_NEXT(request);
      expect(response.status).toBe(401);
    });

    it("creates a new session if none exists", async () => {
      mockGetGameState.mockResolvedValue(null);
      mockSetGameState.mockResolvedValue(undefined);

      const request = createMockRequest("NEXT", {});
      const response = await POST_NEXT(request);
      expect(response.status).toBe(201);
      expect(mockSetGameState).toHaveBeenCalled();
    });

    it("advances to the next phase", async () => {
      mockGetGameState.mockResolvedValue({
        ...mockState,
        turn: { day: 1, phase: "Plan" as const, week: 1 },
      });
      mockTouchSession.mockResolvedValue(undefined);
      mockSetGameState.mockResolvedValue(undefined);

      const request = createMockRequest("NEXT", {});
      const response = await POST_NEXT(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.turn.phase).toBeDefined();
    });

    it("returns 500 on error", async () => {
      mockGetGameState.mockRejectedValue(new Error("Redis error"));

      const request = createMockRequest("NEXT", {});
      const response = await POST_NEXT(request);
      expect(response.status).toBe(500);

      const json = await response.json();
      expect(json.error).toBe("Failed to advance simulator");
    });
  });

  // ==========================================================================
  // POST /api/admin/simulator/choose
  // ==========================================================================

  describe("POST /api/admin/simulator/choose", () => {
    it("returns 401 when no API key is provided", async () => {
      const request = createMockRequest("CHOOSE", undefined, {
        "x-api-key": "",
      });
      const response = await POST_CHOOSE(request);
      expect(response.status).toBe(401);
    });

    it("returns 404 when no session exists", async () => {
      mockSessionExists.mockResolvedValue(false);

      const request = createMockRequest("CHOOSE", { choiceIds: ["choice-1"] });
      const response = await POST_CHOOSE(request);
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json.error).toBe("No simulator session found");
    });

    it("returns 400 when choiceIds is missing", async () => {
      mockSessionExists.mockResolvedValue(true);
      mockGetGameState.mockResolvedValue(mockState);

      const request = createMockRequest("CHOOSE", {});
      const response = await POST_CHOOSE(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toBe("choiceIds is required and must be an array");
    });

    it("returns 400 when choiceIds is not an array", async () => {
      mockSessionExists.mockResolvedValue(true);
      mockGetGameState.mockResolvedValue(mockState);

      const request = createMockRequest("CHOOSE", { choiceIds: "not-an-array" });
      const response = await POST_CHOOSE(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toBe("choiceIds is required and must be an array");
    });

    it("returns 400 when no active decision exists", async () => {
      mockSessionExists.mockResolvedValue(true);
      mockGetGameState.mockResolvedValue(mockState);

      const request = createMockRequest("CHOOSE", { choiceIds: ["choice-1"] });
      const response = await POST_CHOOSE(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toBe("No active decision to respond to");
    });

    it("returns 400 when invalid choices provided", async () => {
      mockSessionExists.mockResolvedValue(true);
      mockGetGameState.mockResolvedValue({
        ...mockState,
        currentDecision: {
          id: "decision-1",
          title: "Test Decision",
          narrative: "Choose wisely",
          choices: [
            { id: "choice-1", label: "Option 1", description: "Description 1", effects: {} },
          ],
          multiSelect: false,
        },
      } as any);

      const request = createMockRequest("CHOOSE", { choiceIds: ["invalid-choice"] });
      const response = await POST_CHOOSE(request);
      expect(response.status).toBe(400);

      const json = await response.json();
      expect(json.error).toBe("No valid choices provided");
    });

    it("records a valid choice and updates state", async () => {
      const stateWithDecision = {
        ...mockState,
        currentDecision: {
          id: "decision-1",
          title: "Test Decision",
          narrative: "Choose wisely",
          choices: [
            {
              id: "choice-1",
              label: "Option 1",
              description: "Description 1",
              effects: { stress: 10 },
            },
          ],
          multiSelect: false,
        },
        choiceHistory: [],
      };

      mockSessionExists.mockResolvedValue(true);
      mockGetGameState.mockResolvedValue(stateWithDecision as any);
      mockSetGameState.mockResolvedValue(undefined);

      const request = createMockRequest("CHOOSE", { choiceIds: ["choice-1"] });
      const response = await POST_CHOOSE(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(mockSetGameState).toHaveBeenCalledWith(
        "simulator",
        expect.objectContaining({
          choiceHistory: expect.arrayContaining([
            expect.objectContaining({
              decisionId: "decision-1",
              choiceIds: ["choice-1"],
            }),
          ]),
        })
      );
    });

    it("returns 500 on error", async () => {
      mockSessionExists.mockRejectedValue(new Error("Redis error"));

      const request = createMockRequest("CHOOSE", { choiceIds: ["choice-1"] });
      const response = await POST_CHOOSE(request);
      expect(response.status).toBe(500);

      const json = await response.json();
      expect(json.error).toBe("Failed to record choice");
    });
  });

  // ==========================================================================
  // DELETE /api/admin/simulator/reset
  // ==========================================================================

  describe("DELETE /api/admin/simulator/reset", () => {
    it("returns 401 when no API key is provided", async () => {
      const request = createMockRequest("DELETE", undefined, {
        "x-api-key": "",
      });
      const response = await DELETE(request);
      expect(response.status).toBe(401);

      const json = await response.json();
      expect(json).toEqual({ error: "Unauthorized" });
    });

    it("returns 404 when no session exists", async () => {
      mockSessionExists.mockResolvedValue(false);

      const request = createMockRequest("DELETE");
      const response = await DELETE(request);
      expect(response.status).toBe(404);

      const json = await response.json();
      expect(json.error).toBe("No simulator session found");
    });

    it("resets the simulator session", async () => {
      mockSessionExists.mockResolvedValue(true);
      mockSetGameState.mockResolvedValue(undefined);

      const request = createMockRequest("DELETE");
      const response = await DELETE(request);
      expect(response.status).toBe(200);

      const json = await response.json();
      expect(json.message).toBe("Simulator reset successfully");
      expect(mockSetGameState).toHaveBeenCalled();
    });

    it("returns 500 on error", async () => {
      mockSessionExists.mockRejectedValue(new Error("Redis error"));

      const request = createMockRequest("DELETE");
      const response = await DELETE(request);
      expect(response.status).toBe(500);

      const json = await response.json();
      expect(json.error).toBe("Failed to reset simulator");
    });
  });
});
