import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import CityDetailPage from "./page";
import type { CityWithNeighborhoods } from "@/lib/content";

vi.mock("@/lib/content", () => ({
  getCityWithNeighborhoods: vi.fn(),
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

const mockNotFound = vi.fn();
vi.mock("next/navigation", () => ({
  notFound: () => {
    mockNotFound();
    throw new Error("NEXT_NOT_FOUND");
  },
}));

const mockGetCityWithNeighborhoods = vi.mocked(
  (await import("@/lib/content")).getCityWithNeighborhoods
);

const mockCity: CityWithNeighborhoods = {
  id: "atlanta-ga",
  name: "Atlanta",
  state: "GA",
  overview: "Atlanta is a vibrant city in Georgia.",
  pulse: {
    federalCooperation: 55,
    dataDensity: 52,
    politicalCover: 38,
    civilSocietyCapacity: 58,
    bureaucraticInertia: 62,
  },
  neighborhoods: [
    {
      id: "atlanta-ga-midtown",
      name: "Midtown",
      description: "A bustling urban neighborhood",
      pulse: {
        trust: 60,
        suspicion: 40,
        enforcementVisibility: 50,
        communityDensity: 75,
        economicPrecarity: 45,
      },
    },
    {
      id: "atlanta-ga-buckhead",
      name: "Buckhead",
      description: "An upscale residential area",
      pulse: {
        trust: 70,
        suspicion: 30,
        enforcementVisibility: 35,
        communityDensity: 55,
        economicPrecarity: 25,
      },
    },
  ],
};

describe("CityDetailPage", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("renders city name as heading", async () => {
    mockGetCityWithNeighborhoods.mockResolvedValue(mockCity);
    const page = await CityDetailPage({
      params: Promise.resolve({ id: "atlanta-ga" }),
    });
    render(page);
    expect(screen.getByText("Atlanta")).toBeInTheDocument();
  });

  it("renders city state", async () => {
    mockGetCityWithNeighborhoods.mockResolvedValue(mockCity);
    const page = await CityDetailPage({
      params: Promise.resolve({ id: "atlanta-ga" }),
    });
    render(page);
    expect(screen.getByText("GA")).toBeInTheDocument();
  });

  it("displays city overview text", async () => {
    mockGetCityWithNeighborhoods.mockResolvedValue(mockCity);
    const page = await CityDetailPage({
      params: Promise.resolve({ id: "atlanta-ga" }),
    });
    render(page);
    expect(
      screen.getByText(/Atlanta is a vibrant city in Georgia/)
    ).toBeInTheDocument();
  });

  it("shows city pulse bars", async () => {
    mockGetCityWithNeighborhoods.mockResolvedValue(mockCity);
    const page = await CityDetailPage({
      params: Promise.resolve({ id: "atlanta-ga" }),
    });
    render(page);
    expect(screen.getByText("Federal Cooperation")).toBeInTheDocument();
    expect(screen.getByText("Political Cover")).toBeInTheDocument();
  });

  it("lists all neighborhoods", async () => {
    mockGetCityWithNeighborhoods.mockResolvedValue(mockCity);
    const page = await CityDetailPage({
      params: Promise.resolve({ id: "atlanta-ga" }),
    });
    render(page);
    expect(screen.getByText("Midtown")).toBeInTheDocument();
    expect(screen.getByText("Buckhead")).toBeInTheDocument();
  });

  it("shows neighborhood descriptions", async () => {
    mockGetCityWithNeighborhoods.mockResolvedValue(mockCity);
    const page = await CityDetailPage({
      params: Promise.resolve({ id: "atlanta-ga" }),
    });
    render(page);
    expect(
      screen.getByText("A bustling urban neighborhood")
    ).toBeInTheDocument();
    expect(
      screen.getByText("An upscale residential area")
    ).toBeInTheDocument();
  });

  it("shows neighborhood pulse bars", async () => {
    mockGetCityWithNeighborhoods.mockResolvedValue(mockCity);
    const page = await CityDetailPage({
      params: Promise.resolve({ id: "atlanta-ga" }),
    });
    render(page);
    // Trust should appear twice - once for each neighborhood
    expect(screen.getAllByText("Trust")).toHaveLength(2);
  });

  it("renders back link to dashboard", async () => {
    mockGetCityWithNeighborhoods.mockResolvedValue(mockCity);
    const page = await CityDetailPage({
      params: Promise.resolve({ id: "atlanta-ga" }),
    });
    render(page);
    const backLink = screen.getByText(/Back to Dashboard/);
    expect(backLink.closest("a")).toHaveAttribute("href", "/dashboard");
  });

  it("calls notFound for invalid city ID", async () => {
    mockGetCityWithNeighborhoods.mockResolvedValue(null);
    await expect(
      CityDetailPage({ params: Promise.resolve({ id: "invalid-city" }) })
    ).rejects.toThrow("NEXT_NOT_FOUND");
    expect(mockNotFound).toHaveBeenCalled();
  });

  it("handles city with no neighborhoods", async () => {
    const cityWithNoNeighborhoods = {
      ...mockCity,
      neighborhoods: [],
    };
    mockGetCityWithNeighborhoods.mockResolvedValue(cityWithNoNeighborhoods);
    const page = await CityDetailPage({
      params: Promise.resolve({ id: "atlanta-ga" }),
    });
    render(page);
    expect(screen.getByText("Atlanta")).toBeInTheDocument();
    expect(screen.getByText("Neighborhoods")).toBeInTheDocument();
  });
});
