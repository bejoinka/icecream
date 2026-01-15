/**
 * Base City Event Templates
 *
 * City events re-weight neighborhoods; they do not target families directly.
 * Categories: Policy, Budget, Infrastructure, Media
 * Update cadence: every 1-3 weeks
 */

import type { CityEventTemplate } from "../../types/city";

export const POLICY_EVENTS: CityEventTemplate[] = [
  {
    id: "policy-sanctuary-debate",
    category: "Policy",
    title: "Sanctuary Policy Debate",
    descriptionTemplate:
      "City council debates strengthening or weakening sanctuary protections. Hearings draw crowds.",
    visibilityRange: [60, 80],
    durationRange: [7, 21],
    weight: 2,
    effects: {
      politicalCover: 10,
      civilSocietyCapacity: 5,
    },
  },
  {
    id: "policy-cooperation-agreement",
    category: "Policy",
    title: "Federal Cooperation Agreement",
    descriptionTemplate:
      "City signs or renews agreement with federal immigration authorities. Details are sparse.",
    visibilityRange: [30, 50],
    durationRange: [30, 60],
    weight: 1,
    effects: {
      federalCooperation: 15,
      politicalCover: -10,
    },
  },
  {
    id: "policy-id-program",
    category: "Policy",
    title: "Municipal ID Program",
    descriptionTemplate:
      "City announces or expands municipal ID program accessible regardless of immigration status.",
    visibilityRange: [50, 70],
    durationRange: [14, 30],
    weight: 2,
    effects: {
      civilSocietyCapacity: 10,
      politicalCover: 5,
    },
  },
  {
    id: "policy-police-training",
    category: "Policy",
    title: "Police Immigration Training",
    descriptionTemplate:
      "New training program for local police on immigration enforcement—either for cooperation or limits.",
    visibilityRange: [40, 60],
    durationRange: [14, 28],
    weight: 2,
    effects: {
      federalCooperation: 5,
      dataDensity: 5,
    },
  },
  {
    id: "policy-legal-defense-fund",
    category: "Policy",
    title: "Legal Defense Fund Created",
    descriptionTemplate:
      "City establishes fund to provide legal representation for residents facing deportation.",
    visibilityRange: [60, 80],
    durationRange: [30, 90],
    weight: 1,
    effects: {
      civilSocietyCapacity: 15,
      politicalCover: 10,
    },
  },
];

export const BUDGET_EVENTS: CityEventTemplate[] = [
  {
    id: "budget-police-increase",
    category: "Budget",
    title: "Police Budget Increase",
    descriptionTemplate:
      "City approves significant increase in police funding. Community groups question allocation priorities.",
    visibilityRange: [50, 70],
    durationRange: [30, 60],
    weight: 2,
    effects: {
      federalCooperation: 5,
      dataDensity: 10,
      civilSocietyCapacity: -5,
    },
  },
  {
    id: "budget-social-services-cut",
    category: "Budget",
    title: "Social Services Cuts",
    descriptionTemplate:
      "Budget shortfalls lead to cuts in social services and community programs citywide.",
    visibilityRange: [40, 60],
    durationRange: [30, 90],
    weight: 2,
    effects: {
      civilSocietyCapacity: -15,
      bureaucraticInertia: 10,
    },
  },
  {
    id: "budget-community-grant",
    category: "Budget",
    title: "Community Organization Grants",
    descriptionTemplate:
      "City allocates grants to community organizations providing immigrant services and integration support.",
    visibilityRange: [40, 60],
    durationRange: [30, 60],
    weight: 2,
    effects: {
      civilSocietyCapacity: 10,
      politicalCover: 5,
    },
  },
  {
    id: "budget-data-system",
    category: "Budget",
    title: "Database System Upgrade",
    descriptionTemplate:
      "City invests in upgrading and integrating government database systems. Privacy advocates raise concerns.",
    visibilityRange: [20, 40],
    durationRange: [60, 120],
    weight: 1,
    effects: {
      dataDensity: 15,
      bureaucraticInertia: -10,
    },
  },
];

export const INFRASTRUCTURE_EVENTS: CityEventTemplate[] = [
  {
    id: "infra-transit-expansion",
    category: "Infrastructure",
    title: "Transit Expansion",
    descriptionTemplate:
      "New transit lines connect previously isolated neighborhoods to city center. Mobility improves.",
    visibilityRange: [60, 80],
    durationRange: [30, 60],
    weight: 2,
    effects: {
      dataDensity: 5,
      bureaucraticInertia: -5,
    },
  },
  {
    id: "infra-surveillance-cameras",
    category: "Infrastructure",
    title: "Surveillance Camera Expansion",
    descriptionTemplate:
      "City installs new surveillance cameras in public spaces. Officials cite safety; critics cite privacy.",
    visibilityRange: [50, 70],
    durationRange: [30, 90],
    weight: 1,
    effects: {
      dataDensity: 15,
      federalCooperation: 5,
    },
  },
  {
    id: "infra-community-center",
    category: "Infrastructure",
    title: "Community Center Opens",
    descriptionTemplate:
      "New community center opens, providing gathering space and services for residents.",
    visibilityRange: [60, 80],
    durationRange: [14, 30],
    weight: 2,
    effects: {
      civilSocietyCapacity: 10,
      politicalCover: 5,
    },
  },
  {
    id: "infra-hospital-closure",
    category: "Infrastructure",
    title: "Hospital/Clinic Closure",
    descriptionTemplate:
      "A hospital or clinic serving underserved communities announces closure due to funding issues.",
    visibilityRange: [60, 80],
    durationRange: [14, 30],
    weight: 1,
    effects: {
      civilSocietyCapacity: -15,
    },
  },
];

export const MEDIA_EVENTS: CityEventTemplate[] = [
  {
    id: "media-local-investigation",
    category: "Media",
    title: "Local Media Investigation",
    descriptionTemplate:
      "Local news outlet publishes investigation into immigration enforcement practices in the city.",
    visibilityRange: [70, 90],
    durationRange: [7, 14],
    weight: 2,
    effects: {
      politicalCover: -10,
      civilSocietyCapacity: 5,
    },
  },
  {
    id: "media-positive-story",
    category: "Media",
    title: "Immigrant Success Story",
    descriptionTemplate:
      "Local media highlights immigrant-owned businesses or community contributions. Sentiment shifts.",
    visibilityRange: [50, 70],
    durationRange: [3, 7],
    weight: 2,
    effects: {
      politicalCover: 5,
      civilSocietyCapacity: 5,
    },
  },
  {
    id: "media-crime-coverage",
    category: "Media",
    title: "Crime Story With Immigration Angle",
    descriptionTemplate:
      "Local news runs stories linking crime to immigration. Facts are disputed but damage is done.",
    visibilityRange: [70, 90],
    durationRange: [7, 14],
    weight: 2,
    effects: {
      politicalCover: -15,
      federalCooperation: 10,
    },
  },
  {
    id: "media-community-profile",
    category: "Media",
    title: "Neighborhood Community Profile",
    descriptionTemplate:
      "In-depth reporting profiles an immigrant neighborhood, humanizing residents and their challenges.",
    visibilityRange: [60, 80],
    durationRange: [7, 14],
    weight: 2,
    effects: {
      politicalCover: 10,
      civilSocietyCapacity: 5,
    },
  },
  {
    id: "media-enforcement-footage",
    category: "Media",
    title: "Enforcement Action Footage Viral",
    descriptionTemplate:
      "Video of an enforcement action in the city goes viral. Public reaction is divided.",
    visibilityRange: [80, 100],
    durationRange: [7, 21],
    weight: 1,
    effects: {
      politicalCover: -10,
      federalCooperation: -5,
    },
  },
];

/** All city event templates */
export const CITY_EVENT_POOL: CityEventTemplate[] = [
  ...POLICY_EVENTS,
  ...BUDGET_EVENTS,
  ...INFRASTRUCTURE_EVENTS,
  ...MEDIA_EVENTS,
];
