/**
 * Supabase database types
 *
 * These types mirror the Supabase schema for type-safe queries
 */

import type { CityPulse, NeighborhoodPulse } from "./pulse";
import type { NeighborhoodEventTemplate } from "./city";

export interface Database {
  public: {
    Tables: {
      cities: {
        Row: {
          id: string;
          name: string;
          state: string;
          overview: string;
          pulse: CityPulse;
          playability_rationale: string | null;
          enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          state: string;
          overview: string;
          pulse: CityPulse;
          playability_rationale?: string | null;
          enabled?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          state?: string;
          overview?: string;
          pulse?: CityPulse;
          playability_rationale?: string | null;
          enabled?: boolean;
          updated_at?: string;
        };
        Relationships: [];
      };
      neighborhoods: {
        Row: {
          id: string;
          city_id: string;
          name: string;
          description: string;
          pulse: NeighborhoodPulse;
          rationale: string | null;
          event_pool: NeighborhoodEventTemplate[] | null;
          enabled: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          city_id: string;
          name: string;
          description: string;
          pulse: NeighborhoodPulse;
          rationale?: string | null;
          event_pool?: NeighborhoodEventTemplate[] | null;
          enabled?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          city_id?: string;
          name?: string;
          description?: string;
          pulse?: NeighborhoodPulse;
          rationale?: string | null;
          event_pool?: NeighborhoodEventTemplate[] | null;
          enabled?: boolean;
          sort_order?: number;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "neighborhoods_city_id_fkey";
            columns: ["city_id"];
            referencedRelation: "cities";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

/** City row from database */
export type CityRow = Database["public"]["Tables"]["cities"]["Row"];
export type CityInsert = Database["public"]["Tables"]["cities"]["Insert"];
export type CityUpdate = Database["public"]["Tables"]["cities"]["Update"];

/** Neighborhood row from database */
export type NeighborhoodRow = Database["public"]["Tables"]["neighborhoods"]["Row"];
export type NeighborhoodInsert = Database["public"]["Tables"]["neighborhoods"]["Insert"];
export type NeighborhoodUpdate = Database["public"]["Tables"]["neighborhoods"]["Update"];

/** City with its neighborhoods (joined query result) */
export interface CityWithNeighborhoods extends CityRow {
  neighborhoods: NeighborhoodRow[];
}
