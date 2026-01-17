import { NextRequest, NextResponse } from "next/server";
import {
  getCityWithNeighborhoods,
  updateCity,
  deleteCity,
} from "@/lib/content";
import type { CityUpdate } from "@/types/database";

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/cities/[id]
 * Returns a city with its neighborhoods
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const city = await getCityWithNeighborhoods(id);

    if (!city) {
      return NextResponse.json({ error: "City not found" }, { status: 404 });
    }

    return NextResponse.json(city);
  } catch (error) {
    console.error("GET /api/cities/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to fetch city" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/cities/[id]
 * Update a city (requires admin API key)
 */
export async function PUT(request: NextRequest, { params }: RouteParams) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const body: CityUpdate = await request.json();

    const city = await updateCity(id, body);
    return NextResponse.json(city);
  } catch (error) {
    console.error("PUT /api/cities/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to update city" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cities/[id]
 * Delete a city (requires admin API key)
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    await deleteCity(id);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/cities/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete city" },
      { status: 500 }
    );
  }
}
