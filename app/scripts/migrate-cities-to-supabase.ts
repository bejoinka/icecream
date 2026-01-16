/**
 * Migration script: Import JSON city profiles to Supabase
 *
 * Run with: pnpm tsx scripts/migrate-cities-to-supabase.ts
 *
 * Requires environment variables:
 * - NEXT_PUBLIC_SUPABASE_URL
 * - SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { readdir, readFile } from "fs/promises";
import { join } from "path";

const CITIES_DIR = join(__dirname, "../src/data/cities");

interface CityProfile {
  id: string;
  name: string;
  state: string;
  overview: string;
  pulse: {
    federalCooperation: number;
    dataDensity: number;
    politicalCover: number;
    civilSocietyCapacity: number;
    bureaucraticInertia: number;
  };
  neighborhoods: Array<{
    id: string;
    name: string;
    description: string;
    pulse: {
      trust: number;
      suspicion: number;
      enforcementVisibility: number;
      communityDensity: number;
      economicPrecarity: number;
    };
    rationale?: string;
    eventPool?: unknown[];
  }>;
  playabilityRationale?: string;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
    );
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Read all JSON files from cities directory
  const files = await readdir(CITIES_DIR);
  const jsonFiles = files.filter((f) => f.endsWith(".json"));

  console.log(`Found ${jsonFiles.length} city profiles to migrate\n`);

  let citiesInserted = 0;
  let neighborhoodsInserted = 0;

  for (const file of jsonFiles) {
    const filePath = join(CITIES_DIR, file);
    const content = await readFile(filePath, "utf-8");
    const profile: CityProfile = JSON.parse(content);

    console.log(`Processing ${profile.name}, ${profile.state}...`);

    // Insert city
    const { error: cityError } = await supabase.from("cities").upsert(
      {
        id: profile.id,
        name: profile.name,
        state: profile.state,
        overview: profile.overview,
        pulse: profile.pulse,
        playability_rationale: profile.playabilityRationale || null,
        enabled: true,
      },
      { onConflict: "id" }
    );

    if (cityError) {
      console.error(`  Error inserting city: ${cityError.message}`);
      continue;
    }

    citiesInserted++;

    // Insert neighborhoods
    const neighborhoods = profile.neighborhoods.map((n, idx) => ({
      id: n.id,
      city_id: profile.id,
      name: n.name,
      description: n.description,
      pulse: n.pulse,
      rationale: n.rationale || null,
      event_pool: n.eventPool || null,
      enabled: true,
      sort_order: idx,
    }));

    const { error: neighborhoodError } = await supabase
      .from("neighborhoods")
      .upsert(neighborhoods, { onConflict: "id" });

    if (neighborhoodError) {
      console.error(
        `  Error inserting neighborhoods: ${neighborhoodError.message}`
      );
      continue;
    }

    neighborhoodsInserted += neighborhoods.length;
    console.log(`  ✓ City + ${neighborhoods.length} neighborhoods`);
  }

  console.log(`\n✓ Migration complete!`);
  console.log(`  Cities: ${citiesInserted}`);
  console.log(`  Neighborhoods: ${neighborhoodsInserted}`);
}

main().catch(console.error);
