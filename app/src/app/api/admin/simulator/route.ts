import { NextRequest, NextResponse } from "next/server";
import { deleteAllSessions } from "@/lib/redis";

/**
 * DELETE /api/admin/simulator
 * Resets/clears all simulation state (all game sessions)
 * Requires admin API key
 */
export async function DELETE(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const deletedCount = await deleteAllSessions();
    return NextResponse.json({
      success: true,
      deletedSessions: deletedCount,
    });
  } catch (error) {
    console.error("DELETE /api/admin/simulator error:", error);
    return NextResponse.json(
      { error: "Failed to reset simulator" },
      { status: 500 }
    );
  }
}
