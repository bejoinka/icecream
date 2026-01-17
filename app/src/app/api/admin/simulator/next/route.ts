import { NextRequest, NextResponse } from "next/server";
import { getGameState, setGameState, touchSession } from "@/lib/redis";
import { createDemoGameState } from "@/lib/types/factory";
import type { GameState } from "@/types/game";

const SIMULATOR_SESSION_KEY = "simulator";

/**
 * POST /api/admin/simulator/next
 * Advances the game to the next phase
 */
export async function POST(request: NextRequest) {
  // Check admin API key
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const state = await getGameState<GameState>(SIMULATOR_SESSION_KEY);

    if (!state) {
      // Create a new simulator session if none exists
      const newState = createDemoGameState(SIMULATOR_SESSION_KEY);
      await setGameState(SIMULATOR_SESSION_KEY, newState);
      return NextResponse.json(newState, { status: 201 });
    }

    // Update the timestamp
    await touchSession(SIMULATOR_SESSION_KEY);

    // Advance the phase - for the simulator, we just increment the turn/phase
    // This is a simplified version since we're not using the full turn engine
    const phaseOrder: Array<"plan" | "pulse_update" | "event" | "decision" | "consequence"> = [
      "plan",
      "pulse_update",
      "event",
      "decision",
      "consequence",
    ];

    const currentPhaseIndex = phaseOrder.indexOf(state.phase as any);
    let nextPhase: GameState["phase"];

    if (currentPhaseIndex === phaseOrder.length - 1) {
      // Move to next turn
      nextPhase = "plan";
      state.turn = (state.turn || 1) + 1;
      state.updatedAt = new Date().toISOString();
    } else {
      // Move to next phase
      nextPhase = phaseOrder[currentPhaseIndex + 1] as GameState["phase"];
    }

    state.phase = nextPhase;
    state.updatedAt = new Date().toISOString();

    await setGameState(SIMULATOR_SESSION_KEY, state);

    return NextResponse.json(state);
  } catch (error) {
    console.error("POST /api/admin/simulator/next error:", error);
    return NextResponse.json(
      { error: "Failed to advance simulator" },
      { status: 500 }
    );
  }
}
