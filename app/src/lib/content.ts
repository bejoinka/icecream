/**
 * Content service for cities and neighborhoods
 *
 * Read operations use the public client (anon key)
 * Write operations use the admin client (service role key)
 */

import { supabase, getAdminClient } from "./supabase";
import type {
  CityRow,
  CityInsert,
  CityUpdate,
  NeighborhoodRow,
  NeighborhoodInsert,
  NeighborhoodUpdate,
  CityWithNeighborhoods,
} from "@/types/database";

// ============================================================================
// City Operations
// ============================================================================

/**
 * Get all enabled cities
 */
export async function getCities(): Promise<CityRow[]> {
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("enabled", true)
    .order("name");

  if (error) throw new Error(`Failed to fetch cities: ${error.message}`);
  return data as CityRow[];
}

/**
 * Get a city by ID
 */
export async function getCity(id: string): Promise<CityRow | null> {
  const { data, error } = await supabase
    .from("cities")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null; // Not found
    throw new Error(`Failed to fetch city: ${error.message}`);
  }
  return data as CityRow;
}

/**
 * Get a city with all its neighborhoods
 */
export async function getCityWithNeighborhoods(
  cityId: string
): Promise<CityWithNeighborhoods | null> {
  const { data: city, error: cityError } = await supabase
    .from("cities")
    .select("*")
    .eq("id", cityId)
    .single();

  if (cityError) {
    if (cityError.code === "PGRST116") return null;
    throw new Error(`Failed to fetch city: ${cityError.message}`);
  }

  const { data: neighborhoods, error: neighborhoodError } = await supabase
    .from("neighborhoods")
    .select("*")
    .eq("city_id", cityId)
    .eq("enabled", true)
    .order("sort_order");

  if (neighborhoodError) {
    throw new Error(
      `Failed to fetch neighborhoods: ${neighborhoodError.message}`
    );
  }

  return {
    ...(city as CityRow),
    neighborhoods: (neighborhoods || []) as NeighborhoodRow[],
  };
}

/**
 * Create or update a city (admin only)
 */
export async function upsertCity(city: CityInsert): Promise<CityRow> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("cities")
    .upsert(city, { onConflict: "id" })
    .select()
    .single();

  if (error) throw new Error(`Failed to upsert city: ${error.message}`);
  return data as CityRow;
}

/**
 * Update a city (admin only)
 */
export async function updateCity(
  id: string,
  updates: CityUpdate
): Promise<CityRow> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("cities")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update city: ${error.message}`);
  return data as CityRow;
}

/**
 * Delete a city (admin only) - also deletes neighborhoods via cascade
 */
export async function deleteCity(id: string): Promise<void> {
  const admin = getAdminClient();
  const { error } = await admin.from("cities").delete().eq("id", id);

  if (error) throw new Error(`Failed to delete city: ${error.message}`);
}

// ============================================================================
// Neighborhood Operations
// ============================================================================

/**
 * Get all neighborhoods for a city
 */
export async function getNeighborhoods(
  cityId: string
): Promise<NeighborhoodRow[]> {
  const { data, error } = await supabase
    .from("neighborhoods")
    .select("*")
    .eq("city_id", cityId)
    .eq("enabled", true)
    .order("sort_order");

  if (error) throw new Error(`Failed to fetch neighborhoods: ${error.message}`);
  return data as NeighborhoodRow[];
}

/**
 * Get a neighborhood by ID
 */
export async function getNeighborhood(
  id: string
): Promise<NeighborhoodRow | null> {
  const { data, error } = await supabase
    .from("neighborhoods")
    .select("*")
    .eq("id", id)
    .single();

  if (error) {
    if (error.code === "PGRST116") return null;
    throw new Error(`Failed to fetch neighborhood: ${error.message}`);
  }
  return data as NeighborhoodRow;
}

/**
 * Create or update a neighborhood (admin only)
 */
export async function upsertNeighborhood(
  neighborhood: NeighborhoodInsert
): Promise<NeighborhoodRow> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("neighborhoods")
    .upsert(neighborhood, { onConflict: "id" })
    .select()
    .single();

  if (error) throw new Error(`Failed to upsert neighborhood: ${error.message}`);
  return data as NeighborhoodRow;
}

/**
 * Update a neighborhood (admin only)
 */
export async function updateNeighborhood(
  id: string,
  updates: NeighborhoodUpdate
): Promise<NeighborhoodRow> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("neighborhoods")
    .update(updates)
    .eq("id", id)
    .select()
    .single();

  if (error) throw new Error(`Failed to update neighborhood: ${error.message}`);
  return data as NeighborhoodRow;
}

/**
 * Delete a neighborhood (admin only)
 */
export async function deleteNeighborhood(id: string): Promise<void> {
  const admin = getAdminClient();
  const { error } = await admin.from("neighborhoods").delete().eq("id", id);

  if (error) throw new Error(`Failed to delete neighborhood: ${error.message}`);
}

/**
 * Bulk upsert neighborhoods for a city (admin only)
 */
export async function upsertNeighborhoods(
  neighborhoods: NeighborhoodInsert[]
): Promise<NeighborhoodRow[]> {
  const admin = getAdminClient();
  const { data, error } = await admin
    .from("neighborhoods")
    .upsert(neighborhoods, { onConflict: "id" })
    .select();

  if (error)
    throw new Error(`Failed to upsert neighborhoods: ${error.message}`);
  return data as NeighborhoodRow[];
}
