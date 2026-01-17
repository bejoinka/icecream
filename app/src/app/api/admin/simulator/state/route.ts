/**
 * GET /api/admin/simulator/state
 *
 * Returns the current game state for the session.
 */

import { NextRequest, NextResponse } from "next/server";
import { loadSession } from "@/lib/session";
import { StateResponse } from "../types";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Get session from cookie or create new
    const { sessionId, state, isNew } = await loadSession<any>();

    const response: StateResponse = {
      state,
      sessionId,
      isNew,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error loading session state:", error);
    return NextResponse.json(
      {
        error: "internal_error",
        message: "Failed to load game state",
      } as const,
      { status: 500 }
    );
  }
}
