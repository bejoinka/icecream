/**
 * City Profiling Agent Workflow
 *
 * Takes NewsAPI + Census data and produces structured city profiles
 * per CITY_PROFILING_BRIEF_AGENT_INSTRUCTIONS.md
 */

import { getCityProfilingNews, formatNewsForAgent } from "./news-api";
import {
  getCityDemographics,
  formatDemographicsForAgent,
  CityDemographics,
} from "./census-api";
import {
  CityProfile,
  CityProfileWithJustifications,
  Neighborhood,
  NeighborhoodEventTemplate,
  CityEventTemplate,
  LAUNCH_CITIES,
} from "@/types/city";
import { CityPulse, NeighborhoodPulse } from "@/types/pulse";

/** City profiling context assembled for the agent */
export interface CityProfilingContext {
  cityName: string;
  state: string;
  demographics: CityDemographics | null;
  demographicsFormatted: string;
  recentNews: string;
  newsArticleCount: number;
}

/**
 * Gather all context needed for profiling a city
 */
export async function gatherCityProfilingContext(
  cityName: string,
  state: string
): Promise<CityProfilingContext> {
  // Fetch demographics and news in parallel
  const [demographics, newsArticles] = await Promise.all([
    getCityDemographics({ cityName, state }).catch((err) => {
      console.error(`Failed to fetch demographics for ${cityName}:`, err);
      return null;
    }),
    getCityProfilingNews({ cityName, state, daysBack: 90 }).catch((err) => {
      console.error(`Failed to fetch news for ${cityName}:`, err);
      return [];
    }),
  ]);

  return {
    cityName,
    state,
    demographics,
    demographicsFormatted: demographics
      ? formatDemographicsForAgent(demographics)
      : "Demographics data unavailable.",
    recentNews: formatNewsForAgent(newsArticles),
    newsArticleCount: newsArticles.length,
  };
}

/**
 * Generate the agent prompt for city profiling
 */
export function generateCityProfilingPrompt(
  context: CityProfilingContext
): string {
  return `# City Profiling Task: ${context.cityName}, ${context.state}

You are a city profiling agent for a game about immigrant families navigating U.S. cities under enforcement pressure. Your task is to produce structured data that can be directly used in the game engine.

## Available Data

### Demographics
${context.demographicsFormatted}

### Recent News (${context.newsArticleCount} articles from last 90 days)
${context.recentNews}

## Your Task

Produce a JSON city profile following this exact structure:

\`\`\`json
{
  "overview": "1-2 paragraph overview of the city's character, political identity, and relationship to federal enforcement",

  "pulse": {
    "federalCooperation": {
      "value": 0-100,
      "rationale": "1-2 sentence justification"
    },
    "dataDensity": {
      "value": 0-100,
      "rationale": "1-2 sentence justification"
    },
    "politicalCover": {
      "value": 0-100,
      "rationale": "1-2 sentence justification"
    },
    "civilSocietyCapacity": {
      "value": 0-100,
      "rationale": "1-2 sentence justification"
    },
    "bureaucraticInertia": {
      "value": 0-100,
      "rationale": "1-2 sentence justification"
    }
  },

  "neighborhoods": [
    {
      "name": "Real or abstracted neighborhood name",
      "description": "One-sentence characterization",
      "pulse": {
        "trust": { "value": 0-100, "rationale": "..." },
        "suspicion": { "value": 0-100, "rationale": "..." },
        "enforcementVisibility": { "value": 0-100, "rationale": "..." },
        "communityDensity": { "value": 0-100, "rationale": "..." },
        "economicPrecarity": { "value": 0-100, "rationale": "..." }
      },
      "rationale": "2-3 sentences on why this neighborhood is interesting"
    }
  ],

  "playabilityRationale": "Brief explanation of what stories this city enables and what makes it distinct"
}
\`\`\`

## Scoring Guidance

### federalCooperation
- 0-20: Explicit resistance, legal challenges, refusal to cooperate
- 21-50: Symbolic sanctuary, quiet compliance
- 51-80: Routine cooperation
- 81-100: Active partnership, joint task forces

### dataDensity
- 0-30: Fragmented, paper-heavy systems
- 31-60: Partially modernized
- 61-100: Integrated digital systems across agencies

### politicalCover
- 0-30: Leadership avoids confrontation, prioritizes optics
- 31-60: Mixed signals
- 61-100: Leadership willing to absorb legal/media backlash

### civilSocietyCapacity
- 0-30: Few NGOs, limited legal aid
- 31-60: Present but stretched
- 61-100: Dense networks of support and advocacy

### bureaucraticInertia
- 0-30: Efficient, fast-moving administration
- 31-60: Average bureaucracy
- 61-100: Slow, inconsistent, internally fragmented

### Neighborhood Pulses
- trust and suspicion can BOTH be high (they're not inverses)
- enforcementVisibility is about presence, not severity
- communityDensity is social connectedness, not population

## Requirements
- Select 3-6 neighborhoods representing different demographic compositions and enforcement dynamics
- Justify every numeric value
- Focus on systemic dynamics, not individual anecdotes
- Write neutrally and analytically

Return ONLY the JSON object, no additional commentary.`;
}

/**
 * Parse agent response into structured profile
 */
export function parseAgentResponse(
  response: string,
  cityName: string,
  state: string
): CityProfileWithJustifications | null {
  try {
    // Extract JSON from response (handle markdown code blocks)
    let jsonStr = response;
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonStr = jsonMatch[1];
    }

    const parsed = JSON.parse(jsonStr.trim());

    // Validate required fields
    if (!parsed.overview || !parsed.pulse || !parsed.neighborhoods) {
      throw new Error("Missing required fields in response");
    }

    return {
      id: `${cityName.toLowerCase().replace(/\s+/g, "-")}-${state.toLowerCase()}`,
      name: cityName,
      state,
      overview: parsed.overview,
      pulse: parsed.pulse,
      neighborhoods: parsed.neighborhoods,
      playabilityRationale: parsed.playabilityRationale || "",
    };
  } catch (error) {
    console.error("Failed to parse agent response:", error);
    return null;
  }
}

/**
 * Convert justified profile to game-ready profile
 */
export function convertToGameProfile(
  profile: CityProfileWithJustifications
): CityProfile {
  const id = profile.id;

  // Extract just the values from justified pulse
  const cityPulse: CityPulse = {
    federalCooperation: profile.pulse.federalCooperation.value,
    dataDensity: profile.pulse.dataDensity.value,
    politicalCover: profile.pulse.politicalCover.value,
    civilSocietyCapacity: profile.pulse.civilSocietyCapacity.value,
    bureaucraticInertia: profile.pulse.bureaucraticInertia.value,
  };

  // Convert neighborhoods
  const neighborhoods: Neighborhood[] = profile.neighborhoods.map((n, idx) => {
    const neighborhoodPulse: NeighborhoodPulse = {
      trust: n.pulse.trust.value,
      suspicion: n.pulse.suspicion.value,
      enforcementVisibility: n.pulse.enforcementVisibility.value,
      communityDensity: n.pulse.communityDensity.value,
      economicPrecarity: n.pulse.economicPrecarity.value,
    };

    return {
      id: `${id}-n${idx + 1}`,
      name: n.name,
      description: n.description,
      pulse: neighborhoodPulse,
      eventPool: generateDefaultNeighborhoodEvents(neighborhoodPulse),
    };
  });

  return {
    id,
    name: profile.name,
    state: profile.state,
    overview: profile.overview,
    pulse: cityPulse,
    neighborhoods,
    eventPool: generateDefaultCityEvents(cityPulse),
    specialEvents: [], // To be populated from news analysis
    playabilityRationale: profile.playabilityRationale,
  };
}

/**
 * Generate default neighborhood event templates based on pulse
 */
function generateDefaultNeighborhoodEvents(
  pulse: NeighborhoodPulse
): NeighborhoodEventTemplate[] {
  const events: NeighborhoodEventTemplate[] = [
    {
      id: "checkpoint-standard",
      type: "Checkpoint",
      severityRange: [1, 3],
      targets: ["Family", "Block"],
      title: "Checkpoint Ahead",
      descriptionTemplate:
        "Law enforcement has set up a checkpoint in the area.",
      weight: 10 + pulse.enforcementVisibility * 0.2,
      effects: { suspicion: 5, enforcementVisibility: 10 },
    },
    {
      id: "raid-rumor",
      type: "RaidRumor",
      severityRange: [2, 4],
      targets: ["Block"],
      title: "Whispers of a Raid",
      descriptionTemplate:
        "Word spreads through the community about possible enforcement activity.",
      weight: 5 + pulse.suspicion * 0.15,
      triggers: { minSuspicion: 30 },
      effects: { suspicion: 15, trust: -5 },
    },
    {
      id: "community-meeting",
      type: "Meeting",
      severityRange: [1, 2],
      targets: ["Block"],
      title: "Community Gathering",
      descriptionTemplate:
        "Neighbors are organizing a meeting to discuss shared concerns.",
      weight: 8 + pulse.communityDensity * 0.2,
      triggers: { minEnforcementVisibility: 20 },
      effects: { trust: 10, communityDensity: 5 },
    },
    {
      id: "audit-employer",
      type: "Audit",
      severityRange: [2, 4],
      targets: ["Employer"],
      title: "Workplace Audit",
      descriptionTemplate:
        "Federal agents are conducting an audit at a local business.",
      weight: 5 + pulse.enforcementVisibility * 0.1,
      effects: { economicPrecarity: 10, suspicion: 10 },
    },
    {
      id: "detention-incident",
      type: "Detention",
      severityRange: [4, 5],
      targets: ["Family", "Block"],
      title: "Someone Was Taken",
      descriptionTemplate:
        "Word spreads that someone in the community has been detained.",
      weight: 3,
      triggers: { minEnforcementVisibility: 50 },
      effects: { trust: -10, suspicion: 20, communityDensity: -5 },
    },
  ];

  return events;
}

/**
 * Generate default city event templates based on pulse
 */
function generateDefaultCityEvents(pulse: CityPulse): CityEventTemplate[] {
  const events: CityEventTemplate[] = [
    {
      id: "policy-announcement",
      category: "Policy",
      title: "Policy Shift",
      descriptionTemplate:
        "City officials announce changes to cooperation policies.",
      visibilityRange: [60, 90],
      durationRange: [14, 28],
      weight: 5,
      effects: {
        federalCooperation: pulse.federalCooperation > 50 ? 5 : -5,
        politicalCover: pulse.politicalCover > 50 ? 5 : -5,
      },
    },
    {
      id: "budget-crisis",
      category: "Budget",
      title: "Budget Pressures",
      descriptionTemplate: "City faces difficult budget decisions.",
      visibilityRange: [40, 70],
      durationRange: [21, 42],
      weight: 4,
      effects: {
        civilSocietyCapacity: -10,
        bureaucraticInertia: 5,
      },
    },
    {
      id: "media-spotlight",
      category: "Media",
      title: "Media Attention",
      descriptionTemplate: "The city draws media attention on immigration issues.",
      visibilityRange: [70, 95],
      durationRange: [7, 21],
      weight: 6,
      effects: {
        politicalCover: -5,
      },
    },
    {
      id: "infrastructure-failure",
      category: "Infrastructure",
      title: "System Delays",
      descriptionTemplate: "Technical issues cause processing delays.",
      visibilityRange: [30, 60],
      durationRange: [7, 14],
      weight: 3,
      effects: {
        bureaucraticInertia: 15,
        dataDensity: -5,
      },
    },
  ];

  return events;
}

/**
 * Get list of all launch cities to profile
 */
export function getLaunchCities(): Array<{ name: string; state: string }> {
  return [...LAUNCH_CITIES];
}
