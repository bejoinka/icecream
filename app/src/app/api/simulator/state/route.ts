import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import type { GameState, NeighborhoodPulse, CityPulse, GlobalPulse, FamilyImpact } from "@/types";
import { DEFAULT_FAMILY_IMPACT, DEFAULT_GLOBAL_PULSE } from "@/types";
import { getCityWithNeighborhoods } from "@/lib/content";

/**
 * In-memory session storage for simulator
 * In production, this would use Redis or similar
 */
export const simulatorSessions = new Map<string, GameState>();

/**
 * GET /api/simulator/state
 * List all sessions or get a specific session by sessionId query param
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sessionId = searchParams.get("sessionId");

  if (sessionId) {
    const state = simulatorSessions.get(sessionId);
    if (!state) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }
    return NextResponse.json(state);
  }

  // Return list of all sessions
  const sessions = Array.from(simulatorSessions.values()).map((s) => ({
    sessionId: s.sessionId,
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
    turn: s.turn,
    phase: s.phase,
    city: s.city.name,
    neighborhood: s.city.neighborhoods.find((n) => n.id === s.city.currentNeighborhoodId)?.name,
    ending: s.ending,
  }));

  return NextResponse.json({ sessions, count: sessions.length });
}

/**
 * POST /api/simulator/state
 * Create a new simulator session
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cityId } = body;

    if (!cityId) {
      return NextResponse.json({ error: "Missing cityId" }, { status: 400 });
    }

    // Load city data
    const cityData = await getCityWithNeighborhoods(cityId);
    if (!cityData) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    const sessionId = uuidv4();
    const now = new Date().toISOString();

    // Convert database city to game state format
    // Global pulse uses defaults (not city-specific)
    const globalPulse: GlobalPulse = {
      ...DEFAULT_GLOBAL_PULSE,
    };

    const cityPulse: CityPulse = {
      federalCooperation: cityData.pulse.federalCooperation ?? 50,
      dataDensity: cityData.pulse.dataDensity ?? 50,
      politicalCover: cityData.pulse.politicalCover ?? 50,
      civilSocietyCapacity: cityData.pulse.civilSocietyCapacity ?? 50,
      bureaucraticInertia: cityData.pulse.bureaucraticInertia ?? 50,
    };

    const family: FamilyImpact = {
      ...DEFAULT_FAMILY_IMPACT,
    };

    const neighborhoods = cityData.neighborhoods.map((n) => ({
      id: n.id,
      name: n.name,
      pulse: {
        trust: n.pulse.trust ?? 50,
        suspicion: n.pulse.suspicion ?? 50,
        enforcementVisibility: n.pulse.enforcementVisibility ?? 50,
        communityDensity: n.pulse.communityDensity ?? 50,
        economicPrecarity: n.pulse.economicPrecarity ?? 50,
      } as NeighborhoodPulse,
    }));

    const state: GameState = {
      sessionId,
      createdAt: now,
      updatedAt: now,
      turn: 1,
      phase: "plan",
      maxTurns: 80,
      globalPulse,
      city: {
        id: cityData.id,
        name: cityData.name,
        state: cityData.state,
        pulse: cityPulse,
        neighborhoods,
        currentNeighborhoodId: neighborhoods[0]?.id ?? "",
      },
      family,
      activeEvents: {
        global: [],
        city: [],
        neighborhood: [],
      },
      currentDecision: null,
      choiceHistory: [],
      rightsKnowledge: [],
      ending: null,
    };

    simulatorSessions.set(sessionId, state);

    return NextResponse.json(state, { status: 201 });
  } catch (error) {
    console.error("POST /api/simulator/state error:", error);
    return NextResponse.json(
      { error: "Failed to create session" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/simulator/state
 * Delete a session
 */
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const existed = simulatorSessions.delete(sessionId);

    if (!existed) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/simulator/state error:", error);
    return NextResponse.json(
      { error: "Failed to delete session" },
      { status: 500 }
    );
  }
}
