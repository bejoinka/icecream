/**
 * NewsAPI Integration for City Profiling
 *
 * Fetches recent news (2-3 months) for specific cities
 * Focus: immigration, enforcement, sanctuary policy, local politics
 */

const NEWS_API_BASE = "https://newsapi.org/v2";

/** NewsAPI article response */
export interface NewsArticle {
  source: {
    id: string | null;
    name: string;
  };
  author: string | null;
  title: string;
  description: string | null;
  url: string;
  urlToImage: string | null;
  publishedAt: string;
  content: string | null;
}

/** NewsAPI response */
export interface NewsAPIResponse {
  status: "ok" | "error";
  totalResults: number;
  articles: NewsArticle[];
  code?: string;
  message?: string;
}

/** Search parameters for city news */
export interface CityNewsParams {
  cityName: string;
  state: string;
  /** Number of days back to search (default: 90) */
  daysBack?: number;
  /** Max results (default: 100, max: 100) */
  pageSize?: number;
}

/** Keywords for immigration/enforcement news */
const IMMIGRATION_KEYWORDS = [
  "immigration",
  "ICE",
  "deportation",
  "sanctuary",
  "undocumented",
  "border",
  "migrant",
  "asylum",
  "refugee",
  "detention",
  "raid",
  "enforcement",
];

/** Keywords for local politics */
const POLITICS_KEYWORDS = [
  "mayor",
  "city council",
  "police",
  "policy",
  "ordinance",
  "budget",
];

function getApiKey(): string {
  const key = process.env.NEWS_API_KEY;
  if (!key) {
    throw new Error("NEWS_API_KEY environment variable not set");
  }
  return key;
}

function getDateRange(daysBack: number): { from: string; to: string } {
  const to = new Date();
  const from = new Date();
  from.setDate(from.getDate() - daysBack);

  return {
    from: from.toISOString().split("T")[0],
    to: to.toISOString().split("T")[0],
  };
}

/**
 * Search for immigration-related news for a city
 */
export async function searchCityImmigrationNews(
  params: CityNewsParams
): Promise<NewsArticle[]> {
  const { cityName, state, daysBack = 90, pageSize = 100 } = params;
  const apiKey = getApiKey();
  const { from, to } = getDateRange(daysBack);

  // Build query: city name + immigration keywords
  const cityQuery = `"${cityName}" OR "${cityName}, ${state}"`;
  const keywordQuery = IMMIGRATION_KEYWORDS.map((k) => `"${k}"`).join(" OR ");
  const query = `(${cityQuery}) AND (${keywordQuery})`;

  const url = new URL(`${NEWS_API_BASE}/everything`);
  url.searchParams.set("q", query);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("sortBy", "relevancy");
  url.searchParams.set("language", "en");
  url.searchParams.set("apiKey", apiKey);

  const response = await fetch(url.toString());
  const data: NewsAPIResponse = await response.json();

  if (data.status === "error") {
    throw new Error(`NewsAPI error: ${data.message}`);
  }

  return data.articles;
}

/**
 * Search for local politics news for a city
 */
export async function searchCityPoliticsNews(
  params: CityNewsParams
): Promise<NewsArticle[]> {
  const { cityName, state, daysBack = 90, pageSize = 100 } = params;
  const apiKey = getApiKey();
  const { from, to } = getDateRange(daysBack);

  const cityQuery = `"${cityName}" OR "${cityName}, ${state}"`;
  const keywordQuery = POLITICS_KEYWORDS.map((k) => `"${k}"`).join(" OR ");
  const query = `(${cityQuery}) AND (${keywordQuery})`;

  const url = new URL(`${NEWS_API_BASE}/everything`);
  url.searchParams.set("q", query);
  url.searchParams.set("from", from);
  url.searchParams.set("to", to);
  url.searchParams.set("pageSize", String(pageSize));
  url.searchParams.set("sortBy", "relevancy");
  url.searchParams.set("language", "en");
  url.searchParams.set("apiKey", apiKey);

  const response = await fetch(url.toString());
  const data: NewsAPIResponse = await response.json();

  if (data.status === "error") {
    throw new Error(`NewsAPI error: ${data.message}`);
  }

  return data.articles;
}

/**
 * Get all relevant news for city profiling
 * Combines immigration and politics news, deduped
 */
export async function getCityProfilingNews(
  params: CityNewsParams
): Promise<NewsArticle[]> {
  const [immigrationNews, politicsNews] = await Promise.all([
    searchCityImmigrationNews(params),
    searchCityPoliticsNews(params),
  ]);

  // Dedupe by URL
  const seen = new Set<string>();
  const combined: NewsArticle[] = [];

  for (const article of [...immigrationNews, ...politicsNews]) {
    if (!seen.has(article.url)) {
      seen.add(article.url);
      combined.push(article);
    }
  }

  // Sort by date descending
  combined.sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
  );

  return combined;
}

/**
 * Format news articles for agent consumption
 */
export function formatNewsForAgent(articles: NewsArticle[]): string {
  if (articles.length === 0) {
    return "No recent news articles found.";
  }

  return articles
    .map((article, i) => {
      const date = new Date(article.publishedAt).toLocaleDateString();
      return `[${i + 1}] ${article.title}
Source: ${article.source.name} | Date: ${date}
${article.description || "No description"}
URL: ${article.url}
`;
    })
    .join("\n---\n");
}
