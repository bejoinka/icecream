import { NextRequest, NextResponse } from "next/server";
import {
  getNeighborhood,
  updateNeighborhood,
  deleteNeighborhood,
} from "@/lib/content";
import type { NeighborhoodUpdate } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/neighborhoods/[id]
 * Returns a single neighborhood
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const neighborhood = await getNeighborhood(id);

    if (!neighborhood) {
      return NextResponse.json(
        { error: "Neighborhood not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(neighborhood);
  } catch (error) {
    console.error("GET /api/neighborhoods/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch neighborhood" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/neighborhoods/[id]
 * Update a neighborhood (requires admin API key)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body: NeighborhoodUpdate = await request.json();

    const neighborhood = await updateNeighborhood(id, body);
    return NextResponse.json(neighborhood);
  } catch (error) {
    console.error("PUT /api/neighborhoods/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update neighborhood" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/neighborhoods/[id]
 * Delete a neighborhood (requires admin API key)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteNeighborhood(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/neighborhoods/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete neighborhood" },
      { status: 500 }
    );
  }
}
