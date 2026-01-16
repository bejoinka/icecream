import { NextRequest, NextResponse } from "next/server";
import {
  getNeighborhoods,
  upsertNeighborhood,
  upsertNeighborhoods,
} from "@/lib/content";
import type { NeighborhoodInsert } from "@/types/database";

/**
 * GET /api/neighborhoods?city_id=xxx
 * Returns neighborhoods for a city
 */
export async function GET(request: NextRequest) {
  try {
    const cityId = request.nextUrl.searchParams.get("city_id");

    if (!cityId) {
      return NextResponse.json(
        { error: "city_id query parameter required" },
        { status: 400 }
      );
    }

    const neighborhoods = await getNeighborhoods(cityId);
    return NextResponse.json(neighborhoods);
  } catch (error) {
    console.error("GET /api/neighborhoods error:", error);
    return NextResponse.json(
      { error: "Failed to fetch neighborhoods" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/neighborhoods
 * Create or update neighborhood(s) (requires admin API key)
 * Accepts single object or array for bulk operations
 */
export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();

    // Handle bulk upsert (array)
    if (Array.isArray(body)) {
      // Validate each neighborhood
      for (const n of body) {
        if (!n.id || !n.city_id || !n.name || !n.description || !n.pulse) {
          return NextResponse.json(
            {
              error:
                "Each neighborhood requires: id, city_id, name, description, pulse",
            },
            { status: 400 }
          );
        }
      }

      const neighborhoods = await upsertNeighborhoods(body);
      return NextResponse.json(neighborhoods, { status: 201 });
    }

    // Handle single upsert
    const neighborhood: NeighborhoodInsert = body;

    if (
      !neighborhood.id ||
      !neighborhood.city_id ||
      !neighborhood.name ||
      !neighborhood.description ||
      !neighborhood.pulse
    ) {
      return NextResponse.json(
        {
          error: "Missing required fields: id, city_id, name, description, pulse",
        },
        { status: 400 }
      );
    }

    const result = await upsertNeighborhood(neighborhood);
    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    console.error("POST /api/neighborhoods error:", error);
    return NextResponse.json(
      { error: "Failed to create neighborhood" },
      { status: 500 }
    );
  }
}
