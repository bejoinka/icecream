import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import DashboardPage from "./page";
import type { CityRow } from "@/types/database";

vi.mock("@/lib/content", () => ({
  getCities: vi.fn(),
}));

vi.mock("next/link", () => ({
  default: ({
    children,
    href,
  }: {
    children: React.ReactNode;
    href: string;
  }) => <a href={href}>{children}</a>,
}));

const mockGetCities = vi.mocked(
  (await import("@/lib/content")).getCities
);

const mockCities: CityRow[] = [
  {
    id: "atlanta-ga",
    name: "Atlanta",
    state: "GA",
    overview: "A city in Georgia",
    pulse: {
      federalCooperation: 55,
      dataDensity: 52,
      politicalCover: 38,
      civilSocietyCapacity: 58,
      bureaucraticInertia: 62,
    },
  },
  {
    id: "boston-ma",
    name: "Boston",
    state: "MA",
    overview: "A city in Massachusetts",
    pulse: {
      federalCooperation: 30,
      dataDensity: 70,
      politicalCover: 65,
      civilSocietyCapacity: 80,
      bureaucraticInertia: 45,
    },
  },
];

describe("DashboardPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders page heading", async () => {
    mockGetCities.mockResolvedValue(mockCities);
    const page = await DashboardPage();
    render(page);
    expect(screen.getByText("City Dashboard")).toBeInTheDocument();
  });

  it("displays city count in subtitle", async () => {
    mockGetCities.mockResolvedValue(mockCities);
    const page = await DashboardPage();
    render(page);
    expect(screen.getByText(/2 cities/)).toBeInTheDocument();
  });

  it("displays city cards when data loads", async () => {
    mockGetCities.mockResolvedValue(mockCities);
    const page = await DashboardPage();
    render(page);
    expect(screen.getByText("Atlanta")).toBeInTheDocument();
    expect(screen.getByText("Boston")).toBeInTheDocument();
  });

  it("shows city state on each card", async () => {
    mockGetCities.mockResolvedValue(mockCities);
    const page = await DashboardPage();
    render(page);
    expect(screen.getByText("GA")).toBeInTheDocument();
    expect(screen.getByText("MA")).toBeInTheDocument();
  });

  it("city cards link to correct detail pages", async () => {
    mockGetCities.mockResolvedValue(mockCities);
    const page = await DashboardPage();
    render(page);
    const atlantaLink = screen.getByRole("link", { name: /Atlanta/i });
    expect(atlantaLink).toHaveAttribute(
      "href",
      "/dashboard/cities/atlanta-ga"
    );
  });

  it("renders pulse bars for each city", async () => {
    mockGetCities.mockResolvedValue(mockCities);
    const page = await DashboardPage();
    render(page);
    // "Fed Coop" appears once in the legend, twice in city cards = 3 total
    expect(screen.getAllByText("Fed Coop")).toHaveLength(3);
    expect(screen.getAllByText("Data")).toHaveLength(3);
    expect(screen.getAllByText("Pol Cover")).toHaveLength(3);
  });

  it("handles empty cities list", async () => {
    mockGetCities.mockResolvedValue([]);
    const page = await DashboardPage();
    render(page);
    expect(screen.getByText("City Dashboard")).toBeInTheDocument();
    expect(screen.getByText(/0 cities/)).toBeInTheDocument();
  });
});
