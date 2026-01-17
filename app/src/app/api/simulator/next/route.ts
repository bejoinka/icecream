import { NextRequest, NextResponse } from "next/server";
import { advancePhase, runCompleteTurn, checkGameEnding, type TurnContext } from "@/engine/turn";
import { simulatorSessions } from "../state/route";
import { getCityWithNeighborhoods } from "@/lib/content";
import { NEIGHBORHOOD_EVENT_POOL, CITY_EVENT_POOL } from "@/data/events";

/**
 * POST /api/simulator/next
 * Advances the game state by one phase
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    const state = simulatorSessions.get(body.sessionId);
    if (!state) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (state.ending) {
      return NextResponse.json({ error: "Game has ended", ending: state.ending }, { status: 400 });
    }

    // Load city for event templates
    const city = await getCityWithNeighborhoods(state.city.id);
    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    // Build turn context
    const ctx: TurnContext = {
      neighborhoodEventTemplates: NEIGHBORHOOD_EVENT_POOL,
      cityEventTemplates: CITY_EVENT_POOL,
    };

    // Track last global update (simplified)
    const lastGlobalUpdate = state.turn - 14;

    // Advance phase
    let newState = advancePhase(state, ctx, lastGlobalUpdate);

    // Check for game ending
    newState = checkGameEnding(newState);

    newState.updatedAt = new Date().toISOString();
    simulatorSessions.set(body.sessionId, newState);

    return NextResponse.json(newState);
  } catch (error) {
    console.error("POST /api/simulator/next error:", error);
    return NextResponse.json(
      { error: "Failed to advance phase" },
      { status: 500 }
    );
  }
}
