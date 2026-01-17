import { NextRequest, NextResponse } from "next/server";
import { getGameState, setGameState, sessionExists } from "@/lib/redis";
import { createDemoGameState } from "@/lib/types/factory";
import type { GameState } from "@/types/game";

const SIMULATOR_SESSION_KEY = "simulator";

/**
 * GET /api/admin/simulator/state
 * Returns the current simulator game state
 */
export async function GET(request: NextRequest) {
  // Check admin API key
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const state = await getGameState<GameState>(SIMULATOR_SESSION_KEY);

    if (!state) {
      // Return 404 if no simulator state exists
      return NextResponse.json(
        { error: "No simulator session found. Use POST to create one." },
        { status: 404 }
      );
    }

    return NextResponse.json(state);
  } catch (error) {
    console.error("GET /api/admin/simulator/state error:", error);
    return NextResponse.json(
      { error: "Failed to fetch simulator state" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/admin/simulator
 * Creates a new simulator session
 */
export async function POST(request: NextRequest) {
  // Check admin API key
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json().catch(() => ({}));
    const { cityId } = body;

    // Create a new demo game state
    const state = createDemoGameState(SIMULATOR_SESSION_KEY);

    await setGameState(SIMULATOR_SESSION_KEY, state);

    return NextResponse.json(state, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/simulator error:", error);
    return NextResponse.json(
      { error: "Failed to create simulator session" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/admin/simulator/reset
 * Resets the simulator session
 */
export async function DELETE(request: NextRequest) {
  // Check admin API key
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const exists = await sessionExists(SIMULATOR_SESSION_KEY);

    if (!exists) {
      return NextResponse.json(
        { error: "No simulator session found" },
        { status: 404 }
      );
    }

    // Create a fresh simulator state
    const state = createDemoGameState(SIMULATOR_SESSION_KEY);
    await setGameState(SIMULATOR_SESSION_KEY, state);

    return NextResponse.json({ message: "Simulator reset successfully" });
  } catch (error) {
    console.error("DELETE /api/admin/simulator/reset error:", error);
    return NextResponse.json(
      { error: "Failed to reset simulator" },
      { status: 500 }
    );
  }
}
