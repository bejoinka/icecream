/**
 * Base Neighborhood Event Templates
 *
 * Neighborhood events are frequent, small-scale, and directly player-facing.
 * Types: Audit, Checkpoint, RaidRumor, Meeting, Detention
 * Severity 1-5 controls scope, duration, and cross-system spillover.
 */

import type { NeighborhoodEventTemplate } from "../../types/city";

export const AUDIT_EVENTS: NeighborhoodEventTemplate[] = [
  {
    id: "audit-employer-routine",
    type: "Audit",
    severityRange: [1, 2],
    targets: ["Employer"],
    title: "Workplace I-9 Review",
    descriptionTemplate:
      "Federal agents conduct routine employment eligibility audits at local businesses in {neighborhood}. Workers are on edge.",
    weight: 3,
    effects: {
      suspicion: 5,
      enforcementVisibility: 10,
      trust: -5,
    },
  },
  {
    id: "audit-employer-targeted",
    type: "Audit",
    severityRange: [3, 4],
    targets: ["Employer"],
    title: "Targeted Worksite Investigation",
    descriptionTemplate:
      "ICE announces a formal investigation into specific employers in {neighborhood}. Names aren't public, but everyone is worried.",
    weight: 2,
    triggers: {
      minEnforcementVisibility: 40,
    },
    effects: {
      suspicion: 15,
      enforcementVisibility: 20,
      trust: -10,
      economicPrecarity: 10,
    },
  },
  {
    id: "audit-school-records",
    type: "Audit",
    severityRange: [2, 3],
    targets: ["School"],
    title: "School Record Request",
    descriptionTemplate:
      "Authorities request enrollment records from schools in {neighborhood}. Parents keep children home.",
    weight: 2,
    effects: {
      suspicion: 10,
      trust: -15,
      communityDensity: -5,
    },
  },
  {
    id: "audit-benefits-review",
    type: "Audit",
    severityRange: [2, 3],
    targets: ["Family", "Block"],
    title: "Benefits Eligibility Review",
    descriptionTemplate:
      "Social services conducts expanded eligibility reviews in {neighborhood}. Families fear losing assistance.",
    weight: 2,
    effects: {
      suspicion: 10,
      economicPrecarity: 15,
      trust: -5,
    },
  },
];

export const CHECKPOINT_EVENTS: NeighborhoodEventTemplate[] = [
  {
    id: "checkpoint-traffic",
    type: "Checkpoint",
    severityRange: [1, 2],
    targets: ["Block"],
    title: "Traffic Checkpoint",
    descriptionTemplate:
      "Local police set up a DUI/license checkpoint in {neighborhood}. Rumors spread about federal involvement.",
    weight: 3,
    effects: {
      enforcementVisibility: 15,
      suspicion: 5,
    },
  },
  {
    id: "checkpoint-transit",
    type: "Checkpoint",
    severityRange: [2, 3],
    targets: ["Block"],
    title: "Transit Station Presence",
    descriptionTemplate:
      "Uniformed agents appear at {neighborhood} transit stops, checking IDs and asking questions.",
    weight: 2,
    triggers: {
      minEnforcementVisibility: 30,
    },
    effects: {
      enforcementVisibility: 20,
      suspicion: 15,
      trust: -10,
    },
  },
  {
    id: "checkpoint-courthouse",
    type: "Checkpoint",
    severityRange: [3, 4],
    targets: ["Family", "Block"],
    title: "Courthouse Surveillance",
    descriptionTemplate:
      "Federal agents stationed near the courthouse in {neighborhood} approach people leaving hearings.",
    weight: 1,
    triggers: {
      minEnforcementVisibility: 50,
    },
    effects: {
      enforcementVisibility: 25,
      suspicion: 20,
      trust: -20,
    },
  },
];

export const RAID_RUMOR_EVENTS: NeighborhoodEventTemplate[] = [
  {
    id: "raidrumor-social-media",
    type: "RaidRumor",
    severityRange: [1, 2],
    targets: ["Block"],
    title: "Social Media Warnings",
    descriptionTemplate:
      "Unverified reports of ICE activity spread through social media in {neighborhood}. Some are false alarms.",
    weight: 4,
    effects: {
      suspicion: 10,
      trust: -5,
      enforcementVisibility: 5,
    },
  },
  {
    id: "raidrumor-credible",
    type: "RaidRumor",
    severityRange: [2, 3],
    targets: ["Block", "Family"],
    title: "Credible Raid Warning",
    descriptionTemplate:
      "Community networks in {neighborhood} issue warnings: agents seen in unmarked vehicles, asking questions.",
    weight: 2,
    triggers: {
      minEnforcementVisibility: 40,
      minSuspicion: 30,
    },
    effects: {
      suspicion: 20,
      trust: -10,
      enforcementVisibility: 15,
      communityDensity: -5,
    },
  },
  {
    id: "raidrumor-workplace",
    type: "RaidRumor",
    severityRange: [3, 4],
    targets: ["Employer"],
    title: "Workplace Raid Alert",
    descriptionTemplate:
      "Word spreads that agents will target specific worksites in {neighborhood} this week. Workers call in sick.",
    weight: 1,
    triggers: {
      minEnforcementVisibility: 50,
    },
    effects: {
      suspicion: 25,
      economicPrecarity: 15,
      trust: -15,
    },
  },
];

export const MEETING_EVENTS: NeighborhoodEventTemplate[] = [
  {
    id: "meeting-know-your-rights",
    type: "Meeting",
    severityRange: [1, 2],
    targets: ["Block", "Family"],
    title: "Know Your Rights Workshop",
    descriptionTemplate:
      "A local organization hosts a 'Know Your Rights' session in {neighborhood}. Attendance is cautious but growing.",
    weight: 3,
    effects: {
      trust: 10,
      communityDensity: 5,
      suspicion: -5,
    },
  },
  {
    id: "meeting-rapid-response",
    type: "Meeting",
    severityRange: [2, 3],
    targets: ["Block"],
    title: "Rapid Response Training",
    descriptionTemplate:
      "Community members in {neighborhood} train to document and respond to enforcement actions.",
    weight: 2,
    triggers: {
      minEnforcementVisibility: 30,
    },
    effects: {
      trust: 15,
      communityDensity: 10,
    },
  },
  {
    id: "meeting-sanctuary-discussion",
    type: "Meeting",
    severityRange: [2, 3],
    targets: ["Block"],
    title: "Sanctuary Policy Discussion",
    descriptionTemplate:
      "Town hall in {neighborhood} debates local sanctuary measures. Turnout is high, opinions divided.",
    weight: 2,
    effects: {
      trust: 5,
      suspicion: 5,
      communityDensity: 10,
    },
  },
  {
    id: "meeting-mutual-aid",
    type: "Meeting",
    severityRange: [1, 2],
    targets: ["Block", "Family"],
    title: "Mutual Aid Network Forming",
    descriptionTemplate:
      "Neighbors in {neighborhood} organize to share resources and provide emergency support.",
    weight: 2,
    effects: {
      trust: 15,
      communityDensity: 10,
      economicPrecarity: -5,
    },
  },
];

export const DETENTION_EVENTS: NeighborhoodEventTemplate[] = [
  {
    id: "detention-traffic-stop",
    type: "Detention",
    severityRange: [2, 3],
    targets: ["Family"],
    title: "Traffic Stop Detention",
    descriptionTemplate:
      "Someone from {neighborhood} was detained after a routine traffic stop. Family is scrambling for information.",
    weight: 2,
    triggers: {
      minEnforcementVisibility: 40,
    },
    effects: {
      trust: -15,
      suspicion: 20,
      enforcementVisibility: 10,
    },
  },
  {
    id: "detention-workplace",
    type: "Detention",
    severityRange: [3, 4],
    targets: ["Employer", "Family"],
    title: "Workplace Arrest",
    descriptionTemplate:
      "Federal agents make arrests at a {neighborhood} business. Co-workers witness the operation.",
    weight: 1,
    triggers: {
      minEnforcementVisibility: 50,
    },
    effects: {
      trust: -20,
      suspicion: 25,
      enforcementVisibility: 20,
      economicPrecarity: 10,
    },
  },
  {
    id: "detention-home-raid",
    type: "Detention",
    severityRange: [4, 5],
    targets: ["Family", "Block"],
    title: "Home Enforcement Action",
    descriptionTemplate:
      "Agents conduct an early-morning operation at a residence in {neighborhood}. Neighbors are shaken.",
    weight: 1,
    triggers: {
      minEnforcementVisibility: 60,
      minSuspicion: 50,
    },
    effects: {
      trust: -25,
      suspicion: 30,
      enforcementVisibility: 25,
      communityDensity: -10,
    },
  },
  {
    id: "detention-courthouse-arrest",
    type: "Detention",
    severityRange: [3, 4],
    targets: ["Family"],
    title: "Courthouse Arrest",
    descriptionTemplate:
      "Someone leaving a {neighborhood} courthouse is detained by waiting agents. Community groups protest.",
    weight: 1,
    triggers: {
      minEnforcementVisibility: 50,
    },
    effects: {
      trust: -20,
      suspicion: 25,
      enforcementVisibility: 15,
    },
  },
];

/** All neighborhood event templates */
export const NEIGHBORHOOD_EVENT_POOL: NeighborhoodEventTemplate[] = [
  ...AUDIT_EVENTS,
  ...CHECKPOINT_EVENTS,
  ...RAID_RUMOR_EVENTS,
  ...MEETING_EVENTS,
  ...DETENTION_EVENTS,
];
