import { NextRequest, NextResponse } from "next/server";
import { getGameState, setGameState, sessionExists } from "@/lib/redis";
import type { GameState, ChoiceRecord } from "@/types/game";

const SIMULATOR_SESSION_KEY = "simulator";

/**
 * POST /api/admin/simulator/choose
 * Records a player's choice for the current decision
 */
export async function POST(request: NextRequest) {
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

    const state = await getGameState<GameState>(SIMULATOR_SESSION_KEY);
    if (!state) {
      return NextResponse.json(
        { error: "Failed to load simulator state" },
        { status: 500 }
      );
    }

    const body = await request.json();
    const { choiceIds } = body;

    // Validate request
    if (!choiceIds || !Array.isArray(choiceIds)) {
      return NextResponse.json(
        { error: "choiceIds is required and must be an array" },
        { status: 400 }
      );
    }

    if (!state.currentDecision) {
      return NextResponse.json(
        { error: "No active decision to respond to" },
        { status: 400 }
      );
    }

    // Validate choices exist
    const validChoices = state.currentDecision.choices.filter((c) =>
      choiceIds.includes(c.id)
    );

    if (validChoices.length === 0) {
      return NextResponse.json(
        { error: "No valid choices provided" },
        { status: 400 }
      );
    }

    // Apply choice effects to family
    let family = { ...state.family };
    for (const choice of validChoices) {
      if (choice.effects) {
        family = { ...family, ...choice.effects };
      }
    }

    // Record the choice
    const record: ChoiceRecord = {
      turn: state.turn || 1,
      decisionId: state.currentDecision.id,
      choiceIds,
      effects: validChoices.reduce(
        (acc, c) => ({ ...acc, ...c.effects }),
        {} as Partial<typeof state.family>
      ),
    };

    // Update state
    state.family = family;
    state.choiceHistory = [...(state.choiceHistory || []), record];
    state.currentDecision = null;
    state.phase = "consequence";
    state.updatedAt = new Date().toISOString();

    await setGameState(SIMULATOR_SESSION_KEY, state);

    return NextResponse.json(state);
  } catch (error) {
    console.error("POST /api/admin/simulator/choose error:", error);
    return NextResponse.json(
      { error: "Failed to record choice" },
      { status: 500 }
    );
  }
}
