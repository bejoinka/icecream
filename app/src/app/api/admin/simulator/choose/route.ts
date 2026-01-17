/**
 * POST /api/admin/simulator/choose
 *
 * Submits player choices for the current decision.
 * Advances to the consequence phase and applies effects.
 */

import { NextRequest, NextResponse } from "next/server";
import { loadSession } from "@/lib/session";
import { setGameState } from "@/lib/redis";
import { executeTurn, TurnContext, recordChoice } from "@/lib/game-loop";
import { GameState, FamilyImpact } from "@/types";
import { NEIGHBORHOOD_EVENT_POOL, CITY_EVENT_POOL } from "@/data/events";
import { checkVictoryConditions } from "@/lib/game-loop";

export const dynamic = "force-dynamic";

interface ChooseRequest {
  choiceIds: string[];
}

interface ChooseResponse {
  state: GameState;
  effectsApplied: Partial<FamilyImpact>;
  ending: {
    type: "victory" | "failure" | null;
    victoryType?: string;
    reason?: string;
  };
}

/**
 * Get turn context with event templates
 */
function getTurnContext(): TurnContext {
  return {
    neighborhoodEventTemplates: NEIGHBORHOOD_EVENT_POOL,
    cityEventTemplates: CITY_EVENT_POOL,
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as ChooseRequest;
    const { choiceIds } = body;

    // Validate request
    if (!Array.isArray(choiceIds) || choiceIds.length === 0) {
      return NextResponse.json(
        {
          error: "invalid_request",
          message: "choiceIds must be a non-empty array",
        } as const,
        { status: 400 }
      );
    }

    // Load session
    const { sessionId, state: existingState, isNew } = await loadSession<GameState>();

    if (isNew || !existingState) {
      return NextResponse.json(
        {
          error: "no_game",
          message: "No active game. Call /next to start a game.",
        } as const,
        { status: 400 }
      );
    }

    const state = existingState;

    // Check if game has ended
    if (state.ending) {
      return NextResponse.json({
        state,
        effectsApplied: {},
        ending: {
          type: state.ending.type,
          victoryType: "victoryType" in state.ending ? state.ending.victoryType : undefined,
          reason: state.ending.type === "failure" ? state.ending.reason : undefined,
        },
      });
    }

    // Check if there's a decision waiting
    if (!state.currentDecision) {
      return NextResponse.json(
        {
          error: "no_decision",
          message: "No active decision. Call /next first.",
        } as const,
        { status: 400 }
      );
    }

    // Validate choice IDs
    const validChoiceIds = state.currentDecision.choices.map((c) => c.id);
    const invalidChoiceIds = choiceIds.filter((id) => !validChoiceIds.includes(id));

    if (invalidChoiceIds.length > 0) {
      return NextResponse.json(
        {
          error: "invalid_choices",
          message: `Invalid choice IDs: ${invalidChoiceIds.join(", ")}`,
        } as const,
        { status: 400 }
      );
    }

    // Calculate effects to report back
    const selectedChoices = state.currentDecision.choices.filter((c) =>
      choiceIds.includes(c.id)
    );
    const effectsApplied = selectedChoices.reduce(
      (acc, choice) => {
        if (choice.effects) {
          // Merge effects by summing numeric values
          for (const [key, value] of Object.entries(choice.effects)) {
            if (typeof value === "number") {
              acc[key] = (acc[key] || 0) + value;
            }
          }
        }
        return acc;
      },
      {} as Partial<FamilyImpact>
    );

    // Get turn context and advance
    const ctx = getTurnContext();
    const lastGlobalUpdate = state.turn - 1;

    // Process the choice and advance to consequence
    const result = executeTurn(state, ctx, lastGlobalUpdate, choiceIds);

    // Check victory conditions
    const finalState = checkVictoryConditions(result.state);

    // Save updated state
    await setGameState(sessionId, finalState);

    return NextResponse.json({
      state: finalState,
      effectsApplied,
      ending: {
        type: finalState.ending?.type ?? null,
        victoryType: finalState.ending?.type === "victory" ? finalState.ending.victoryType : undefined,
        reason: finalState.ending?.type === "failure" ? finalState.ending.reason : undefined,
      },
    });
  } catch (error) {
    console.error("Error processing choice:", error);
    return NextResponse.json(
      {
        error: "internal_error",
        message: "Failed to process choice",
      } as const,
      { status: 500 }
    );
  }
}
