/**
 * City-Specific Special Events
 *
 * These events are based on real-world characteristics of each city
 * and can dramatically shift neighborhood conditions.
 * They serve as content refreshes and city-specific flavor.
 *
 * Each city has 3-5 special events that reflect its unique context.
 */

import type { CityEventTemplate, NeighborhoodEventTemplate } from "../../types/city";

/** City-specific event collection */
export interface CitySpecialEvents {
  cityName: string;
  state: string;
  cityEvents: CityEventTemplate[];
  neighborhoodEvents: NeighborhoodEventTemplate[];
}

// =============================================================================
// LOS ANGELES, CA
// =============================================================================

export const LOS_ANGELES_EVENTS: CitySpecialEvents = {
  cityName: "Los Angeles",
  state: "CA",
  cityEvents: [
    {
      id: "la-special-lapd-policy",
      category: "Policy",
      title: "LAPD Special Order 40 Review",
      descriptionTemplate:
        "City council debates revisions to Special Order 40, the longstanding policy limiting LAPD cooperation with immigration authorities.",
      visibilityRange: [70, 90],
      durationRange: [14, 30],
      weight: 2,
      effects: {
        federalCooperation: -10,
        politicalCover: 15,
      },
    },
    {
      id: "la-special-port-operations",
      category: "Infrastructure",
      title: "Port of LA Security Enhancement",
      descriptionTemplate:
        "New security measures at the Port of Los Angeles include expanded documentation requirements for workers.",
      visibilityRange: [40, 60],
      durationRange: [30, 60],
      weight: 1,
      effects: {
        dataDensity: 10,
        federalCooperation: 5,
      },
    },
    {
      id: "la-special-metro-presence",
      category: "Infrastructure",
      title: "Metro Transit Security Expansion",
      descriptionTemplate:
        "LA Metro announces expanded security presence across rail lines. Civil liberties groups raise concerns.",
      visibilityRange: [50, 70],
      durationRange: [30, 60],
      weight: 2,
      effects: {
        dataDensity: 5,
        civilSocietyCapacity: -5,
      },
    },
  ],
  neighborhoodEvents: [
    {
      id: "la-special-macarthur-park",
      type: "Meeting",
      severityRange: [2, 3],
      targets: ["Block", "Family"],
      title: "MacArthur Park Community Vigil",
      descriptionTemplate:
        "Large community gathering in MacArthur Park honors detained community members. Media coverage is significant.",
      weight: 2,
      effects: {
        trust: 15,
        communityDensity: 10,
        suspicion: -5,
      },
    },
    {
      id: "la-special-fashion-district",
      type: "Audit",
      severityRange: [3, 4],
      targets: ["Employer"],
      title: "Fashion District Workplace Sweep",
      descriptionTemplate:
        "Multi-agency operation targets garment factories in the Fashion District. Workers flee to surrounding areas.",
      weight: 1,
      triggers: {
        minEnforcementVisibility: 50,
      },
      effects: {
        suspicion: 25,
        trust: -20,
        economicPrecarity: 15,
      },
    },
  ],
};

// =============================================================================
// CHICAGO, IL
// =============================================================================

export const CHICAGO_EVENTS: CitySpecialEvents = {
  cityName: "Chicago",
  state: "IL",
  cityEvents: [
    {
      id: "chi-special-welcoming-city",
      category: "Policy",
      title: "Welcoming City Ordinance Challenged",
      descriptionTemplate:
        "State lawmakers challenge Chicago's Welcoming City ordinance. City officials vow to defend it in court.",
      visibilityRange: [70, 90],
      durationRange: [30, 60],
      weight: 2,
      effects: {
        politicalCover: 10,
        civilSocietyCapacity: 5,
      },
    },
    {
      id: "chi-special-cook-county",
      category: "Policy",
      title: "Cook County Jail Policy Shift",
      descriptionTemplate:
        "New sheriff implements changes to how ICE detainers are handled at Cook County Jail.",
      visibilityRange: [50, 70],
      durationRange: [30, 90],
      weight: 2,
      effects: {
        federalCooperation: 10,
        politicalCover: -10,
      },
    },
    {
      id: "chi-special-legal-fund",
      category: "Budget",
      title: "Chicago Legal Protection Fund Expanded",
      descriptionTemplate:
        "City allocates additional funding for legal representation. Demand already exceeds capacity.",
      visibilityRange: [60, 80],
      durationRange: [30, 60],
      weight: 2,
      effects: {
        civilSocietyCapacity: 15,
        politicalCover: 10,
      },
    },
  ],
  neighborhoodEvents: [
    {
      id: "chi-special-pilsen-mural",
      type: "Meeting",
      severityRange: [1, 2],
      targets: ["Block"],
      title: "Pilsen Community Art Rally",
      descriptionTemplate:
        "Artists and residents gather in Pilsen to create murals honoring immigrant heritage. Coverage goes national.",
      weight: 2,
      effects: {
        trust: 15,
        communityDensity: 10,
      },
    },
    {
      id: "chi-special-little-village",
      type: "Checkpoint",
      severityRange: [2, 3],
      targets: ["Block"],
      title: "Little Village Traffic Operation",
      descriptionTemplate:
        "Joint CPD-federal operation in Little Village ostensibly targets gang activity. Community members report immigration questions.",
      weight: 1,
      triggers: {
        minEnforcementVisibility: 40,
      },
      effects: {
        enforcementVisibility: 20,
        trust: -15,
        suspicion: 20,
      },
    },
  ],
};

// =============================================================================
// MIAMI, FL
// =============================================================================

export const MIAMI_EVENTS: CitySpecialEvents = {
  cityName: "Miami",
  state: "FL",
  cityEvents: [
    {
      id: "mia-special-tps-venezuela",
      category: "Policy",
      title: "Venezuelan TPS Community Impact",
      descriptionTemplate:
        "Changes to TPS status for Venezuelans affect thousands in Miami. Confusion about documentation requirements spreads.",
      visibilityRange: [70, 90],
      durationRange: [30, 60],
      weight: 2,
      effects: {
        civilSocietyCapacity: -10,
        bureaucraticInertia: 15,
      },
    },
    {
      id: "mia-special-state-mandate",
      category: "Policy",
      title: "Florida State Immigration Mandate",
      descriptionTemplate:
        "New state law requires local cooperation with immigration authorities. Miami officials debate compliance.",
      visibilityRange: [80, 100],
      durationRange: [30, 90],
      weight: 2,
      effects: {
        federalCooperation: 20,
        politicalCover: -15,
      },
    },
    {
      id: "mia-special-port-security",
      category: "Infrastructure",
      title: "Port of Miami Enhanced Screening",
      descriptionTemplate:
        "New screening procedures at Port of Miami affect cruise industry workers and freight operations.",
      visibilityRange: [40, 60],
      durationRange: [30, 60],
      weight: 1,
      effects: {
        dataDensity: 10,
        federalCooperation: 5,
      },
    },
  ],
  neighborhoodEvents: [
    {
      id: "mia-special-little-havana",
      type: "Meeting",
      severityRange: [2, 3],
      targets: ["Block", "Family"],
      title: "Little Havana Solidarity March",
      descriptionTemplate:
        "Cuban-American community organizations in Little Havana hold march supporting recent arrivals. Inter-generational tensions surface.",
      weight: 2,
      effects: {
        trust: 10,
        communityDensity: 5,
        suspicion: 5,
      },
    },
    {
      id: "mia-special-hialeah-raid",
      type: "Detention",
      severityRange: [3, 4],
      targets: ["Employer", "Family"],
      title: "Hialeah Warehouse Operation",
      descriptionTemplate:
        "ICE operation at a Hialeah warehouse results in multiple arrests. Community networks scramble to track affected families.",
      weight: 1,
      triggers: {
        minEnforcementVisibility: 50,
      },
      effects: {
        trust: -20,
        suspicion: 25,
        enforcementVisibility: 20,
      },
    },
  ],
};

// =============================================================================
// PHOENIX, AZ
// =============================================================================

export const PHOENIX_EVENTS: CitySpecialEvents = {
  cityName: "Phoenix",
  state: "AZ",
  cityEvents: [
    {
      id: "phx-special-sb1070-legacy",
      category: "Policy",
      title: "SB 1070 Enforcement Questions",
      descriptionTemplate:
        "Renewed debate over which provisions of Arizona's immigration law remain enforceable. Police seek clarity.",
      visibilityRange: [60, 80],
      durationRange: [14, 30],
      weight: 2,
      effects: {
        federalCooperation: 10,
        bureaucraticInertia: 10,
      },
    },
    {
      id: "phx-special-maricopa-sheriff",
      category: "Policy",
      title: "Maricopa County Sheriff Policy Change",
      descriptionTemplate:
        "New sheriff announces changes to immigration enforcement policies. Community groups remain cautious.",
      visibilityRange: [70, 90],
      durationRange: [30, 60],
      weight: 2,
      effects: {
        federalCooperation: -10,
        politicalCover: 5,
      },
    },
    {
      id: "phx-special-desert-deaths",
      category: "Media",
      title: "Desert Crossing Deaths Reported",
      descriptionTemplate:
        "Rising temperatures lead to increased border-crossing fatalities. Media coverage sparks competing narratives.",
      visibilityRange: [70, 90],
      durationRange: [7, 14],
      weight: 2,
      effects: {
        politicalCover: -5,
        civilSocietyCapacity: 5,
      },
    },
  ],
  neighborhoodEvents: [
    {
      id: "phx-special-maryvale",
      type: "RaidRumor",
      severityRange: [2, 3],
      targets: ["Block", "Family"],
      title: "Maryvale Enforcement Warnings",
      descriptionTemplate:
        "Community networks in Maryvale circulate warnings about planned operations. Businesses see reduced foot traffic.",
      weight: 2,
      triggers: {
        minEnforcementVisibility: 40,
      },
      effects: {
        suspicion: 20,
        trust: -10,
        economicPrecarity: 10,
      },
    },
    {
      id: "phx-special-guadalupe",
      type: "Meeting",
      severityRange: [2, 3],
      targets: ["Block"],
      title: "Guadalupe Town Hall",
      descriptionTemplate:
        "The town of Guadalupe, surrounded by Phoenix, hosts community meeting on local sanctuary measures.",
      weight: 2,
      effects: {
        trust: 15,
        communityDensity: 10,
        politicalCover: 5,
      },
    },
  ],
};

// =============================================================================
// NEW YORK, NY
// =============================================================================

export const NEW_YORK_EVENTS: CitySpecialEvents = {
  cityName: "New York",
  state: "NY",
  cityEvents: [
    {
      id: "nyc-special-sanctuary-defense",
      category: "Policy",
      title: "NYC Sanctuary City Legal Challenge",
      descriptionTemplate:
        "Federal lawsuit challenges New York City's sanctuary policies. Mayor vows city will not back down.",
      visibilityRange: [80, 100],
      durationRange: [30, 90],
      weight: 2,
      effects: {
        politicalCover: 15,
        civilSocietyCapacity: 10,
      },
    },
    {
      id: "nyc-special-idnyc-expansion",
      category: "Policy",
      title: "IDNYC Program Expansion",
      descriptionTemplate:
        "City expands municipal ID program with new benefits. Enrollment centers report long lines.",
      visibilityRange: [60, 80],
      durationRange: [30, 60],
      weight: 2,
      effects: {
        civilSocietyCapacity: 10,
        dataDensity: 5,
      },
    },
    {
      id: "nyc-special-courthouse-order",
      category: "Policy",
      title: "Courthouse Enforcement Ban",
      descriptionTemplate:
        "State issues order restricting immigration enforcement at courthouses. Implementation questions remain.",
      visibilityRange: [60, 80],
      durationRange: [30, 60],
      weight: 2,
      effects: {
        federalCooperation: -10,
        civilSocietyCapacity: 10,
      },
    },
  ],
  neighborhoodEvents: [
    {
      id: "nyc-special-jackson-heights",
      type: "Meeting",
      severityRange: [2, 3],
      targets: ["Block", "Family"],
      title: "Jackson Heights Unity Rally",
      descriptionTemplate:
        "Massive community rally in Jackson Heights brings together diverse immigrant groups. Political candidates attend.",
      weight: 2,
      effects: {
        trust: 20,
        communityDensity: 15,
        suspicion: -10,
      },
    },
    {
      id: "nyc-special-sunset-park",
      type: "Audit",
      severityRange: [2, 3],
      targets: ["Employer"],
      title: "Sunset Park Business Audits",
      descriptionTemplate:
        "Series of workplace audits in Sunset Park's industrial area. Workers share information through WeChat groups.",
      weight: 1,
      triggers: {
        minEnforcementVisibility: 40,
      },
      effects: {
        suspicion: 15,
        trust: -10,
        economicPrecarity: 10,
      },
    },
  ],
};

// =============================================================================
// HOUSTON, TX
// =============================================================================

export const HOUSTON_EVENTS: CitySpecialEvents = {
  cityName: "Houston",
  state: "TX",
  cityEvents: [
    {
      id: "hou-special-sb4",
      category: "Policy",
      title: "Texas SB 4 Implementation Questions",
      descriptionTemplate:
        "Houston officials grapple with implementation of state immigration law. HPD issues conflicting guidance.",
      visibilityRange: [70, 90],
      durationRange: [30, 60],
      weight: 2,
      effects: {
        federalCooperation: 15,
        bureaucraticInertia: 15,
        politicalCover: -10,
      },
    },
    {
      id: "hou-special-harris-county",
      category: "Policy",
      title: "Harris County Jail ICE Access",
      descriptionTemplate:
        "New county policy changes ICE access to county jail. Sheriff faces criticism from multiple directions.",
      visibilityRange: [60, 80],
      durationRange: [30, 60],
      weight: 2,
      effects: {
        federalCooperation: 10,
        politicalCover: -5,
      },
    },
    {
      id: "hou-special-consulate-lines",
      category: "Infrastructure",
      title: "Mexican Consulate Overwhelmed",
      descriptionTemplate:
        "Long lines at Mexican consulate as residents seek documentation. Processing times extend to months.",
      visibilityRange: [50, 70],
      durationRange: [30, 60],
      weight: 2,
      effects: {
        bureaucraticInertia: 10,
        civilSocietyCapacity: -5,
      },
    },
  ],
  neighborhoodEvents: [
    {
      id: "hou-special-gulfton",
      type: "Meeting",
      severityRange: [2, 3],
      targets: ["Block", "Family"],
      title: "Gulfton Mutual Aid Network",
      descriptionTemplate:
        "Gulfton's diverse immigrant communities form cross-ethnic mutual aid network. Organizers share resources in multiple languages.",
      weight: 2,
      effects: {
        trust: 15,
        communityDensity: 15,
        economicPrecarity: -5,
      },
    },
    {
      id: "hou-special-ship-channel",
      type: "Checkpoint",
      severityRange: [2, 3],
      targets: ["Employer", "Block"],
      title: "Ship Channel Worker Checks",
      descriptionTemplate:
        "Federal presence reported near Ship Channel industrial area. Workers report being questioned about documentation.",
      weight: 1,
      triggers: {
        minEnforcementVisibility: 40,
      },
      effects: {
        enforcementVisibility: 15,
        suspicion: 15,
        trust: -10,
      },
    },
  ],
};

// =============================================================================
// COLLECTION OF ALL CITY-SPECIFIC EVENTS
// =============================================================================

export const CITY_SPECIAL_EVENTS: Record<string, CitySpecialEvents> = {
  "Los Angeles, CA": LOS_ANGELES_EVENTS,
  "Chicago, IL": CHICAGO_EVENTS,
  "Miami, FL": MIAMI_EVENTS,
  "Phoenix, AZ": PHOENIX_EVENTS,
  "New York, NY": NEW_YORK_EVENTS,
  "Houston, TX": HOUSTON_EVENTS,
};

/**
 * Get special events for a city
 */
export function getCitySpecialEvents(
  cityName: string,
  state: string
): CitySpecialEvents | undefined {
  return CITY_SPECIAL_EVENTS[`${cityName}, ${state}`];
}

/**
 * Get all city special events as an array
 */
export function getAllCitySpecialEvents(): CitySpecialEvents[] {
  return Object.values(CITY_SPECIAL_EVENTS);
}
