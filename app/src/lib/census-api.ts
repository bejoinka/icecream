/**
 * Census American Community Survey (ACS) API Integration
 *
 * Fetches demographic data for city profiling:
 * - Population
 * - Median household income
 * - Foreign-born percentage
 * - Language spoken at home
 * - Housing costs
 *
 * Uses the Census ACS 5-Year Estimates (most comprehensive coverage)
 * API docs: https://www.census.gov/data/developers/data-sets/acs-5year.html
 */

const CENSUS_API_BASE = "https://api.census.gov/data";
const ACS_YEAR = "2022"; // Most recent 5-year ACS data
const ACS_DATASET = "acs/acs5";

/**
 * ACS variable codes for demographic data
 * Reference: https://api.census.gov/data/2022/acs/acs5/variables.html
 */
const ACS_VARIABLES = {
  // Population
  totalPopulation: "B01003_001E",

  // Income
  medianHouseholdIncome: "B19013_001E",

  // Foreign-born population
  totalPopulationForNativity: "B05002_001E",
  foreignBorn: "B05002_013E",

  // Language spoken at home (population 5+)
  populationOver5: "B16001_001E",
  englishOnly: "B16001_002E",
  spanishTotal: "B16001_003E",
  spanishLimitedEnglish: "B16001_005E",
  otherLanguages: "B16001_006E", // Simplified - actual data has more detail

  // Housing costs
  medianGrossRent: "B25064_001E",
  medianHomeValue: "B25077_001E",

  // Poverty
  totalForPovertyStatus: "B17001_001E",
  belowPovertyLevel: "B17001_002E",
} as const;

/** State FIPS codes for API queries */
const STATE_FIPS: Record<string, string> = {
  AL: "01",
  AK: "02",
  AZ: "04",
  AR: "05",
  CA: "06",
  CO: "08",
  CT: "09",
  DE: "10",
  DC: "11",
  FL: "12",
  GA: "13",
  HI: "15",
  ID: "16",
  IL: "17",
  IN: "18",
  IA: "19",
  KS: "20",
  KY: "21",
  LA: "22",
  ME: "23",
  MD: "24",
  MA: "25",
  MI: "26",
  MN: "27",
  MS: "28",
  MO: "29",
  MT: "30",
  NE: "31",
  NV: "32",
  NH: "33",
  NJ: "34",
  NM: "35",
  NY: "36",
  NC: "37",
  ND: "38",
  OH: "39",
  OK: "40",
  OR: "41",
  PA: "42",
  RI: "44",
  SC: "45",
  SD: "46",
  TN: "47",
  TX: "48",
  UT: "49",
  VT: "50",
  VA: "51",
  WA: "53",
  WV: "54",
  WI: "55",
  WY: "56",
  PR: "72",
};

/** Place FIPS codes for major cities (subset for launch cities) */
const CITY_PLACE_FIPS: Record<string, string> = {
  // Format: "CityName, ST" -> place FIPS code
  "Los Angeles, CA": "44000",
  "San Francisco, CA": "67000",
  "Phoenix, AZ": "55000",
  "Seattle, WA": "63000",
  "El Paso, TX": "24000",
  "Tucson, AZ": "77000",
  "San Antonio, TX": "65000",
  "Chicago, IL": "14000",
  "Detroit, MI": "22000",
  "Minneapolis, MN": "43000",
  "Columbus, OH": "18000",
  "Houston, TX": "35000",
  "Miami, FL": "45000",
  "Atlanta, GA": "04000",
  "Nashville, TN": "52006", // Nashville-Davidson metropolitan government
  "New York, NY": "51000",
  "Boston, MA": "07000",
  "Philadelphia, PA": "60000",
  "Newark, NJ": "51000",
  "Denver, CO": "20000",
};

/** Demographic data for a city */
export interface CityDemographics {
  cityName: string;
  state: string;
  population: number;
  medianHouseholdIncome: number;
  foreignBornPercent: number;
  languageData: {
    englishOnlyPercent: number;
    spanishPercent: number;
    spanishLimitedEnglishPercent: number;
    otherLanguagesPercent: number;
  };
  housingCosts: {
    medianRent: number;
    medianHomeValue: number;
  };
  povertyRate: number;
}

/** Parameters for fetching city demographics */
export interface CityDemographicsParams {
  cityName: string;
  state: string;
}

function getApiKey(): string | undefined {
  // Census API works without a key but has rate limits
  // With a key, you get higher limits
  return process.env.CENSUS_API_KEY;
}

function getStateFips(state: string): string {
  const fips = STATE_FIPS[state.toUpperCase()];
  if (!fips) {
    throw new Error(`Unknown state: ${state}`);
  }
  return fips;
}

function getCityPlaceFips(cityName: string, state: string): string {
  const key = `${cityName}, ${state}`;
  const fips = CITY_PLACE_FIPS[key];
  if (!fips) {
    throw new Error(
      `Unknown city: ${key}. Add FIPS code to CITY_PLACE_FIPS mapping.`
    );
  }
  return fips;
}

function parseNumber(value: string | null | undefined): number {
  if (value === null || value === undefined || value === "-666666666") {
    return 0; // Census uses -666666666 for missing data
  }
  const num = parseInt(value, 10);
  return isNaN(num) ? 0 : num;
}

function calculatePercent(part: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((part / total) * 1000) / 10; // One decimal place
}

/**
 * Fetch demographic data for a city from Census ACS
 */
export async function getCityDemographics(
  params: CityDemographicsParams
): Promise<CityDemographics> {
  const { cityName, state } = params;
  const stateFips = getStateFips(state);
  const placeFips = getCityPlaceFips(cityName, state);

  // Build list of variables to fetch
  const variables = Object.values(ACS_VARIABLES).join(",");

  // Build API URL
  const url = new URL(`${CENSUS_API_BASE}/${ACS_YEAR}/${ACS_DATASET}`);
  url.searchParams.set("get", `NAME,${variables}`);
  url.searchParams.set("for", `place:${placeFips}`);
  url.searchParams.set("in", `state:${stateFips}`);

  const apiKey = getApiKey();
  if (apiKey) {
    url.searchParams.set("key", apiKey);
  }

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(
      `Census API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();

  // Response is array of arrays: [headers, data]
  if (!Array.isArray(data) || data.length < 2) {
    throw new Error(`No data found for ${cityName}, ${state}`);
  }

  const headers: string[] = data[0];
  const values: string[] = data[1];

  // Create lookup from headers to values
  const getValue = (variableCode: string): string | undefined => {
    const index = headers.indexOf(variableCode);
    return index >= 0 ? values[index] : undefined;
  };

  // Parse all the data
  const totalPop = parseNumber(getValue(ACS_VARIABLES.totalPopulation));
  const medianIncome = parseNumber(
    getValue(ACS_VARIABLES.medianHouseholdIncome)
  );

  const popForNativity = parseNumber(
    getValue(ACS_VARIABLES.totalPopulationForNativity)
  );
  const foreignBorn = parseNumber(getValue(ACS_VARIABLES.foreignBorn));

  const popOver5 = parseNumber(getValue(ACS_VARIABLES.populationOver5));
  const englishOnly = parseNumber(getValue(ACS_VARIABLES.englishOnly));
  const spanishTotal = parseNumber(getValue(ACS_VARIABLES.spanishTotal));
  const spanishLimited = parseNumber(
    getValue(ACS_VARIABLES.spanishLimitedEnglish)
  );
  const otherLangs = parseNumber(getValue(ACS_VARIABLES.otherLanguages));

  const medianRent = parseNumber(getValue(ACS_VARIABLES.medianGrossRent));
  const medianHome = parseNumber(getValue(ACS_VARIABLES.medianHomeValue));

  const popForPoverty = parseNumber(
    getValue(ACS_VARIABLES.totalForPovertyStatus)
  );
  const belowPoverty = parseNumber(getValue(ACS_VARIABLES.belowPovertyLevel));

  return {
    cityName,
    state,
    population: totalPop,
    medianHouseholdIncome: medianIncome,
    foreignBornPercent: calculatePercent(foreignBorn, popForNativity),
    languageData: {
      englishOnlyPercent: calculatePercent(englishOnly, popOver5),
      spanishPercent: calculatePercent(spanishTotal, popOver5),
      spanishLimitedEnglishPercent: calculatePercent(spanishLimited, popOver5),
      otherLanguagesPercent: calculatePercent(otherLangs, popOver5),
    },
    housingCosts: {
      medianRent,
      medianHomeValue: medianHome,
    },
    povertyRate: calculatePercent(belowPoverty, popForPoverty),
  };
}

/**
 * Fetch demographics for all launch cities
 */
export async function getAllLaunchCityDemographics(): Promise<
  CityDemographics[]
> {
  const cities = Object.keys(CITY_PLACE_FIPS).map((key) => {
    const [cityName, state] = key.split(", ");
    return { cityName, state };
  });

  // Fetch in batches to avoid rate limiting
  const results: CityDemographics[] = [];
  const batchSize = 5;

  for (let i = 0; i < cities.length; i += batchSize) {
    const batch = cities.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((city) =>
        getCityDemographics(city).catch((err) => {
          console.error(`Failed to fetch ${city.cityName}, ${city.state}:`, err);
          return null;
        })
      )
    );

    for (const result of batchResults) {
      if (result) {
        results.push(result);
      }
    }

    // Small delay between batches
    if (i + batchSize < cities.length) {
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }

  return results;
}

/**
 * Format demographics for agent consumption
 */
export function formatDemographicsForAgent(data: CityDemographics): string {
  return `## ${data.cityName}, ${data.state} Demographics

**Population:** ${data.population.toLocaleString()}
**Median Household Income:** $${data.medianHouseholdIncome.toLocaleString()}
**Poverty Rate:** ${data.povertyRate}%

### Immigration & Language
- Foreign-born population: ${data.foreignBornPercent}%
- English only at home: ${data.languageData.englishOnlyPercent}%
- Spanish speakers: ${data.languageData.spanishPercent}%
  - Limited English proficiency: ${data.languageData.spanishLimitedEnglishPercent}%
- Other languages: ${data.languageData.otherLanguagesPercent}%

### Housing Costs
- Median Rent: $${data.housingCosts.medianRent.toLocaleString()}/month
- Median Home Value: $${data.housingCosts.medianHomeValue.toLocaleString()}
`;
}
