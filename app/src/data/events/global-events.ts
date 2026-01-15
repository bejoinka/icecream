/**
 * Base Global Event Templates
 *
 * Global events are rare, high-impact shocks at the national level.
 * Types: Executive, Judicial, Media, Security
 * Update cadence: every 7-14 in-game days (events are rarer)
 */

import type { GlobalEventType, EventSeverity } from "../../types/event";

/** Template for global event generation */
export interface GlobalEventTemplate {
  id: string;
  type: GlobalEventType;
  magnitudeRange: [EventSeverity, EventSeverity];
  title: string;
  descriptionTemplate: string;
  durationRange: [number, number];
  weight: number;
  effects: Partial<{
    enforcementClimate: number;
    mediaNarrative: number;
    judicialAlignment: number;
    politicalVolatility: number;
  }>;
}

export const EXECUTIVE_EVENTS: GlobalEventTemplate[] = [
  {
    id: "exec-policy-announcement",
    type: "Executive",
    magnitudeRange: [2, 3],
    title: "New Immigration Policy Announced",
    descriptionTemplate:
      "The administration announces significant changes to immigration enforcement priorities. Details remain unclear.",
    durationRange: [14, 30],
    weight: 2,
    effects: {
      enforcementClimate: 10,
      mediaNarrative: 15,
      politicalVolatility: 10,
    },
  },
  {
    id: "exec-enforcement-surge",
    type: "Executive",
    magnitudeRange: [3, 4],
    title: "Nationwide Enforcement Surge",
    descriptionTemplate:
      "Federal agencies announce expanded enforcement operations across multiple cities. Resources are mobilized.",
    durationRange: [21, 45],
    weight: 1,
    effects: {
      enforcementClimate: 20,
      mediaNarrative: 25,
      politicalVolatility: 15,
    },
  },
  {
    id: "exec-deportation-flights",
    type: "Executive",
    magnitudeRange: [2, 3],
    title: "Accelerated Deportation Flights",
    descriptionTemplate:
      "Reports of increased deportation flights from multiple cities. Processing times shortened dramatically.",
    durationRange: [14, 30],
    weight: 2,
    effects: {
      enforcementClimate: 15,
      mediaNarrative: 10,
    },
  },
  {
    id: "exec-status-review",
    type: "Executive",
    magnitudeRange: [3, 4],
    title: "Protected Status Review",
    descriptionTemplate:
      "Administration announces review of temporary protected status for multiple countries. Hundreds of thousands affected.",
    durationRange: [30, 60],
    weight: 1,
    effects: {
      enforcementClimate: 10,
      mediaNarrative: 20,
      politicalVolatility: 20,
    },
  },
  {
    id: "exec-enforcement-pause",
    type: "Executive",
    magnitudeRange: [2, 3],
    title: "Enforcement Priority Shift",
    descriptionTemplate:
      "New guidance narrows enforcement priorities to specific categories. Implementation varies by region.",
    durationRange: [30, 60],
    weight: 1,
    effects: {
      enforcementClimate: -15,
      mediaNarrative: -10,
      politicalVolatility: 10,
    },
  },
];

export const JUDICIAL_EVENTS: GlobalEventTemplate[] = [
  {
    id: "judicial-ruling-favorable",
    type: "Judicial",
    magnitudeRange: [2, 3],
    title: "Court Blocks Enforcement Measure",
    descriptionTemplate:
      "Federal court issues injunction against a key enforcement policy. Administration vows to appeal.",
    durationRange: [30, 90],
    weight: 2,
    effects: {
      judicialAlignment: -10,
      enforcementClimate: -10,
      politicalVolatility: 10,
    },
  },
  {
    id: "judicial-ruling-unfavorable",
    type: "Judicial",
    magnitudeRange: [2, 3],
    title: "Court Upholds Enforcement Authority",
    descriptionTemplate:
      "Appeals court rules in favor of expanded enforcement authority. Legal challenges continue.",
    durationRange: [30, 60],
    weight: 2,
    effects: {
      judicialAlignment: 10,
      enforcementClimate: 10,
    },
  },
  {
    id: "judicial-supreme-court",
    type: "Judicial",
    magnitudeRange: [4, 5],
    title: "Supreme Court Immigration Decision",
    descriptionTemplate:
      "Supreme Court issues major ruling on immigration enforcement powers. Legal landscape shifts dramatically.",
    durationRange: [60, 120],
    weight: 1,
    effects: {
      judicialAlignment: 15,
      politicalVolatility: 20,
      mediaNarrative: 15,
    },
  },
  {
    id: "judicial-class-action",
    type: "Judicial",
    magnitudeRange: [2, 3],
    title: "Class Action Lawsuit Filed",
    descriptionTemplate:
      "Major class action lawsuit challenges detention conditions or enforcement practices nationwide.",
    durationRange: [30, 60],
    weight: 2,
    effects: {
      judicialAlignment: -5,
      mediaNarrative: -10,
      politicalVolatility: 5,
    },
  },
];

export const MEDIA_GLOBAL_EVENTS: GlobalEventTemplate[] = [
  {
    id: "media-national-story",
    type: "Media",
    magnitudeRange: [2, 3],
    title: "National Media Spotlight",
    descriptionTemplate:
      "Major news outlets run extended coverage of immigration enforcement, featuring personal stories and policy debates.",
    durationRange: [7, 21],
    weight: 2,
    effects: {
      mediaNarrative: 20,
      politicalVolatility: 10,
    },
  },
  {
    id: "media-viral-incident",
    type: "Media",
    magnitudeRange: [3, 4],
    title: "Viral Enforcement Incident",
    descriptionTemplate:
      "Video of enforcement action goes viral nationally. Public outrage and counter-reactions dominate discourse.",
    durationRange: [7, 14],
    weight: 2,
    effects: {
      mediaNarrative: -25,
      politicalVolatility: 20,
    },
  },
  {
    id: "media-fear-narrative",
    type: "Media",
    magnitudeRange: [2, 3],
    title: "Crime-Immigration Link Pushed",
    descriptionTemplate:
      "National media amplifies stories linking immigration to crime. Fact-checkers dispute claims but narrative persists.",
    durationRange: [14, 30],
    weight: 2,
    effects: {
      mediaNarrative: 25,
      enforcementClimate: 5,
    },
  },
  {
    id: "media-sympathy-shift",
    type: "Media",
    magnitudeRange: [2, 3],
    title: "Human Interest Stories Trend",
    descriptionTemplate:
      "Wave of sympathetic coverage highlights separated families and long-term residents facing deportation.",
    durationRange: [14, 21],
    weight: 2,
    effects: {
      mediaNarrative: -20,
      politicalVolatility: 5,
    },
  },
  {
    id: "media-documentary-release",
    type: "Media",
    magnitudeRange: [2, 3],
    title: "Immigration Documentary Releases",
    descriptionTemplate:
      "A major documentary about immigration enforcement premieres, sparking national conversation.",
    durationRange: [14, 30],
    weight: 1,
    effects: {
      mediaNarrative: -15,
      politicalVolatility: 10,
    },
  },
];

export const SECURITY_EVENTS: GlobalEventTemplate[] = [
  {
    id: "security-border-incident",
    type: "Security",
    magnitudeRange: [3, 4],
    title: "Border Security Incident",
    descriptionTemplate:
      "Major incident at the border dominates news. Politicians trade blame while enforcement rhetoric escalates.",
    durationRange: [14, 30],
    weight: 2,
    effects: {
      enforcementClimate: 15,
      mediaNarrative: 20,
      politicalVolatility: 15,
    },
  },
  {
    id: "security-terrorism-claim",
    type: "Security",
    magnitudeRange: [3, 4],
    title: "Terror Threat Linked to Immigration",
    descriptionTemplate:
      "Officials claim immigration-related security threat. Details are classified but fear spreads.",
    durationRange: [14, 30],
    weight: 1,
    effects: {
      enforcementClimate: 20,
      mediaNarrative: 30,
      politicalVolatility: 20,
    },
  },
  {
    id: "security-caravan-coverage",
    type: "Security",
    magnitudeRange: [2, 3],
    title: "Migrant Movement Coverage",
    descriptionTemplate:
      "Extensive coverage of migrants moving toward the border. Political response is swift and polarized.",
    durationRange: [14, 30],
    weight: 2,
    effects: {
      enforcementClimate: 10,
      mediaNarrative: 25,
      politicalVolatility: 15,
    },
  },
  {
    id: "security-international-crisis",
    type: "Security",
    magnitudeRange: [3, 4],
    title: "International Crisis Triggers Asylum Surge",
    descriptionTemplate:
      "Crisis abroad leads to surge in asylum seekers. System strains while debate intensifies.",
    durationRange: [30, 60],
    weight: 1,
    effects: {
      enforcementClimate: 10,
      mediaNarrative: 15,
      politicalVolatility: 15,
    },
  },
];

/** All global event templates */
export const GLOBAL_EVENT_POOL: GlobalEventTemplate[] = [
  ...EXECUTIVE_EVENTS,
  ...JUDICIAL_EVENTS,
  ...MEDIA_GLOBAL_EVENTS,
  ...SECURITY_EVENTS,
];
