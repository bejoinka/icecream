import { NextRequest, NextResponse } from "next/server";
import { getCities, upsertCity } from "@/lib/content";
import type { CityInsert } from "@/types/database";

/**
 * GET /api/cities
 * Returns all enabled cities
 */
export async function GET() {
  try {
    const cities = await getCities();
    return NextResponse.json(cities);
  } catch (error) {
    console.error("GET /api/cities error:", error);
    return NextResponse.json(
      { error: "Failed to fetch cities" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cities
 * Create or update a city (requires admin API key)
 */
export async function POST(request: NextRequest) {
  // Check admin API key
  const apiKey = request.headers.get("x-api-key");
  if (apiKey !== process.env.ADMIN_API_KEY) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body: CityInsert = await request.json();

    // Validate required fields
    if (!body.id || !body.name || !body.state || !body.overview || !body.pulse) {
      return NextResponse.json(
        { error: "Missing required fields: id, name, state, overview, pulse" },
        { status: 400 }
      );
    }

    const city = await upsertCity(body);
    return NextResponse.json(city, { status: 201 });
  } catch (error) {
    console.error("POST /api/cities error:", error);
    return NextResponse.json(
      { error: "Failed to create city" },
      { status: 500 }
    );
  }
}
