import { NextRequest, NextResponse } from "next/server";
import { advancePhase, checkGameEnding } from "@/engine/turn";
import { simulatorSessions } from "../state/route";
import { getCityWithNeighborhoods } from "@/lib/content";
import { NEIGHBORHOOD_EVENT_POOL, CITY_EVENT_POOL } from "@/data/events";

interface ChooseRequest {
  sessionId: string;
  choiceIds: string[];
}

/**
 * POST /api/simulator/choose
 * Submits player choices for the current decision
 */
export async function POST(request: NextRequest) {
  try {
    const body: ChooseRequest = await request.json();

    if (!body.sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    if (!body.choiceIds || !Array.isArray(body.choiceIds)) {
      return NextResponse.json({ error: "Missing or invalid choiceIds" }, { status: 400 });
    }

    const state = simulatorSessions.get(body.sessionId);
    if (!state) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    if (state.ending) {
      return NextResponse.json({ error: "Game has ended", ending: state.ending }, { status: 400 });
    }

    if (state.phase !== "decision") {
      return NextResponse.json(
        { error: "Not in decision phase", currentPhase: state.phase },
        { status: 400 }
      );
    }

    if (!state.currentDecision) {
      return NextResponse.json({ error: "No active decision" }, { status: 400 });
    }

    // Load city for event templates
    const city = await getCityWithNeighborhoods(state.city.id);
    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    // Build turn context
    const ctx = {
      neighborhoodEventTemplates: NEIGHBORHOOD_EVENT_POOL,
      cityEventTemplates: CITY_EVENT_POOL,
    };

    const lastGlobalUpdate = state.turn - 14;

    // Process the choice (advance from decision to consequence)
    let newState = advancePhase(state, ctx, lastGlobalUpdate, body.choiceIds);

    // Check for game ending
    newState = checkGameEnding(newState);

    newState.updatedAt = new Date().toISOString();
    simulatorSessions.set(body.sessionId, newState);

    return NextResponse.json(newState);
  } catch (error) {
    console.error("POST /api/simulator/choose error:", error);
    return NextResponse.json(
      { error: "Failed to process choice" },
      { status: 500 }
    );
  }
}
