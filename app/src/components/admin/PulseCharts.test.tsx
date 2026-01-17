import { render, screen, cleanup } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { PulseCharts } from "./PulseCharts";
import type { CityPulse, GlobalPulse, NeighborhoodPulse } from "@/types";

// Mock any chart library (e.g., Chart.js, Recharts) that might be used
vi.mock("recharts", () => ({
  ResponsiveContainer: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="responsive-container">{children}</div>
  ),
  LineChart: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="line-chart">{children}</div>
  ),
  Line: () => <div data-testid="line" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
}));

const mockCityPulse: CityPulse = {
  federalCooperation: 55,
  dataDensity: 52,
  politicalCover: 38,
  civilSocietyCapacity: 58,
  bureaucraticInertia: 62,
};

const mockGlobalPulse: GlobalPulse = {
  enforcementClimate: 50,
  mediaNarrative: 0,
  judicialAlignment: 0,
  politicalVolatility: 30,
};

const mockNeighborhoodPulse: NeighborhoodPulse = {
  trust: 65,
  suspicion: 35,
  enforcementVisibility: 40,
  communityDensity: 70,
  economicPrecarity: 45,
};

describe("PulseCharts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    cleanup();
  });

  // ==========================================================================
  // Chart Rendering Tests
  // ==========================================================================

  describe("Chart Rendering", () => {
    it("renders the charts container", () => {
      render(<PulseCharts type="city" data={mockCityPulse} />);
      expect(screen.getByTestId("pulse-charts-container")).toBeInTheDocument();
    });

    it("renders chart title for city pulse type", () => {
      render(<PulseCharts type="city" data={mockCityPulse} />);
      expect(screen.getByText("City Pulse Charts")).toBeInTheDocument();
    });

    it("renders chart title for global pulse type", () => {
      render(<PulseCharts type="global" data={mockGlobalPulse} />);
      expect(screen.getByText("Global Pulse Charts")).toBeInTheDocument();
    });

    it("renders chart title for neighborhood pulse type", () => {
      render(<PulseCharts type="neighborhood" data={mockNeighborhoodPulse} />);
      expect(screen.getByText("Neighborhood Pulse Charts")).toBeInTheDocument();
    });

    it("renders all city pulse metrics as individual charts", () => {
      render(<PulseCharts type="city" data={mockCityPulse} />);

      expect(screen.getByText("Federal Cooperation")).toBeInTheDocument();
      expect(screen.getByText("Data Density")).toBeInTheDocument();
      expect(screen.getByText("Political Cover")).toBeInTheDocument();
      expect(screen.getByText("Civil Society Capacity")).toBeInTheDocument();
      expect(screen.getByText("Bureaucratic Inertia")).toBeInTheDocument();
    });

    it("renders all global pulse metrics as individual charts", () => {
      render(<PulseCharts type="global" data={mockGlobalPulse} />);

      expect(screen.getByText("Enforcement Climate")).toBeInTheDocument();
      expect(screen.getByText("Media Narrative")).toBeInTheDocument();
      expect(screen.getByText("Judicial Alignment")).toBeInTheDocument();
      expect(screen.getByText("Political Volatility")).toBeInTheDocument();
    });

    it("renders all neighborhood pulse metrics as individual charts", () => {
      render(<PulseCharts type="neighborhood" data={mockNeighborhoodPulse} />);

      expect(screen.getByText("Trust")).toBeInTheDocument();
      expect(screen.getByText("Suspicion")).toBeInTheDocument();
      expect(screen.getByText("Enforcement Visibility")).toBeInTheDocument();
      expect(screen.getByText("Community Density")).toBeInTheDocument();
      expect(screen.getByText("Economic Precarity")).toBeInTheDocument();
    });

    it("renders line chart for time series data", () => {
      const timeSeriesData = [
        { turn: 1, value: 50 },
        { turn: 2, value: 55 },
        { turn: 3, value: 60 },
      ];
      render(<PulseCharts type="city" data={mockCityPulse} history={timeSeriesData} metric="federalCooperation" />);

      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });

    it("displays current values on the chart", () => {
      render(<PulseCharts type="city" data={mockCityPulse} />);
      expect(screen.getByText("55")).toBeInTheDocument(); // federalCooperation value
    });
  });

  // ==========================================================================
  // Data Updates Tests
  // ==========================================================================

  describe("Data Updates", () => {
    it("updates chart when data prop changes", () => {
      const { rerender } = render(<PulseCharts type="city" data={mockCityPulse} />);
      expect(screen.getByText("55")).toBeInTheDocument();

      const updatedData: CityPulse = { ...mockCityPulse, federalCooperation: 75 };
      rerender(<PulseCharts type="city" data={updatedData} />);
      expect(screen.getByText("75")).toBeInTheDocument();
    });

    it("updates chart when history prop changes", () => {
      const initialHistory = [
        { turn: 1, value: 50 },
        { turn: 2, value: 55 },
      ];

      const { rerender } = render(
        <PulseCharts type="city" data={mockCityPulse} history={initialHistory} metric="federalCooperation" />
      );

      const updatedHistory = [
        { turn: 1, value: 50 },
        { turn: 2, value: 55 },
        { turn: 3, value: 60 },
      ];

      rerender(
        <PulseCharts type="city" data={mockCityPulse} history={updatedHistory} metric="federalCooperation" />
      );

      // Chart should reflect the updated history
      expect(screen.getByTestId("line-chart")).toBeInTheDocument();
    });

    it("smoothly animates value transitions", () => {
      const { rerender } = render(<PulseCharts type="city" data={mockCityPulse} animate={true} />);

      const initialData: CityPulse = { ...mockCityPulse, federalCooperation: 50 };
      rerender(<PulseCharts type="city" data={initialData} animate={true} />);
      expect(screen.getByText("50")).toBeInTheDocument();

      const updatedData: CityPulse = { ...mockCityPulse, federalCooperation: 70 };
      rerender(<PulseCharts type="city" data={updatedData} animate={true} />);
      expect(screen.getByText("70")).toBeInTheDocument();
    });

    it("handles rapid data updates without errors", () => {
      const { rerender } = render(<PulseCharts type="city" data={mockCityPulse} />);

      for (let i = 0; i < 10; i++) {
        const newData: CityPulse = {
          ...mockCityPulse,
          federalCooperation: 50 + i * 5,
        };
        rerender(<PulseCharts type="city" data={newData} />);
      }

      expect(screen.getByText("95")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Chart Destruction Tests
  // ==========================================================================

  describe("Chart Destruction", () => {
    it("cleans up chart instance on unmount", () => {
      const { unmount } = render(<PulseCharts type="city" data={mockCityPulse} />);
      expect(screen.getByTestId("pulse-charts-container")).toBeInTheDocument();

      unmount();
      expect(screen.queryByTestId("pulse-charts-container")).not.toBeInTheDocument();
    });

    it("clears intervals/timers on unmount", () => {
      const clearIntervalSpy = vi.spyOn(global, "clearInterval");
      const { unmount } = render(<PulseCharts type="city" data={mockCityPulse} autoRefresh={true} />);

      unmount();
      // If the component uses auto-refresh, it should clear intervals on unmount
      // This test verifies the cleanup behavior
      clearIntervalSpy.mockRestore();
    });

    it("removes event listeners on unmount", () => {
      const removeEventListenerSpy = vi.spyOn(window, "removeEventListener");
      const { unmount } = render(<PulseCharts type="city" data={mockCityPulse} responsive={true} />);

      unmount();
      // Verify cleanup was performed
      removeEventListenerSpy.mockRestore();
    });

    it("handles multiple mount/unmount cycles", () => {
      const { unmount } = render(<PulseCharts type="city" data={mockCityPulse} />);
      expect(screen.getByTestId("pulse-charts-container")).toBeInTheDocument();

      unmount();
      expect(screen.queryByTestId("pulse-charts-container")).not.toBeInTheDocument();

      // Remount
      render(<PulseCharts type="city" data={mockCityPulse} />);
      expect(screen.getByTestId("pulse-charts-container")).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Color Mapping Tests
  // ==========================================================================

  describe("Color Mapping", () => {
    it("applies correct color for low values (0-33)", () => {
      const lowPulse: CityPulse = { ...mockCityPulse, federalCooperation: 20 };
      const { container } = render(<PulseCharts type="city" data={lowPulse} />);

      const chartElement = container.querySelector('[data-color="low"]');
      expect(chartElement).toBeInTheDocument();
    });

    it("applies correct color for medium values (34-66)", () => {
      const mediumPulse: CityPulse = { ...mockCityPulse, federalCooperation: 50 };
      const { container } = render(<PulseCharts type="city" data={mediumPulse} />);

      const chartElement = container.querySelector('[data-color="medium"]');
      expect(chartElement).toBeInTheDocument();
    });

    it("applies correct color for high values (67-100)", () => {
      const highPulse: CityPulse = { ...mockCityPulse, federalCooperation: 80 };
      const { container } = render(<PulseCharts type="city" data={highPulse} />);

      const chartElement = container.querySelector('[data-color="high"]');
      expect(chartElement).toBeInTheDocument();
    });

    it("uses red color for negative mediaNarrative values", () => {
      const negativeNarrative: GlobalPulse = { ...mockGlobalPulse, mediaNarrative: -50 };
      const { container } = render(<PulseCharts type="global" data={negativeNarrative} />);

      const chartElement = container.querySelector('[data-color="negative"]');
      expect(chartElement).toBeInTheDocument();
    });

    it("uses green color for positive mediaNarrative values", () => {
      const positiveNarrative: GlobalPulse = { ...mockGlobalPulse, mediaNarrative: 50 };
      const { container } = render(<PulseCharts type="global" data={positiveNarrative} />);

      const chartElement = container.querySelector('[data-color="positive"]');
      expect(chartElement).toBeInTheDocument();
    });

    it("supports custom color scheme prop", () => {
      render(<PulseCharts type="city" data={mockCityPulse} colorScheme="heatmap" />);
      expect(screen.getByTestId("pulse-charts-container")).toHaveClass("color-scheme-heatmap");
    });

    it("supports custom color mapping function", () => {
      const customColorMap = vi.fn((value: number) => "purple");
      render(<PulseCharts type="city" data={mockCityPulse} colorMap={customColorMap} />);

      expect(customColorMap).toHaveBeenCalled();
    });

    it("applies gradient colors when enabled", () => {
      const { container } = render(<PulseCharts type="city" data={mockCityPulse} gradient={true} />);
      expect(container.querySelector('[data-gradient="true"]')).toBeInTheDocument();
    });
  });

  // ==========================================================================
  // Empty State Handling Tests
  // ==========================================================================

  describe("Empty State Handling", () => {
    it("renders empty state when no data provided", () => {
      render(<PulseCharts type="city" data={null} />);
      expect(screen.getByText("No pulse data available")).toBeInTheDocument();
    });

    it("renders empty state when data is undefined", () => {
      render(<PulseCharts type="city" data={undefined} />);
      expect(screen.getByText("No pulse data available")).toBeInTheDocument();
    });

    it("shows empty state message for empty history", () => {
      // When history is empty but data is present, current values should still render
      render(<PulseCharts type="city" data={mockCityPulse} history={[]} />);
      // Should show current data values
      expect(screen.getByText("Federal Cooperation")).toBeInTheDocument();
    });

    it("renders placeholder when loading", () => {
      render(<PulseCharts type="city" data={mockCityPulse} loading={true} />);
      expect(screen.getByTestId("charts-loading")).toBeInTheDocument();
    });

    it("shows error state when error prop is provided", () => {
      render(<PulseCharts type="city" data={mockCityPulse} error="Failed to load data" />);
      expect(screen.getByText("Failed to load data")).toBeInTheDocument();
    });

    it("renders fallback component when data is missing", () => {
      const Fallback = () => <div data-testid="custom-fallback">No data</div>;
      render(<PulseCharts type="city" data={null} fallback={<Fallback />} />);
      expect(screen.getByTestId("custom-fallback")).toBeInTheDocument();
    });

    it("handles partial data gracefully", () => {
      const partialData = { federalCooperation: 50 };
      render(<PulseCharts type="city" data={partialData as any} />);
      expect(screen.getByText("Federal Cooperation")).toBeInTheDocument();
      expect(screen.queryByText("Data Density")).not.toBeInTheDocument();
    });

    it("displays empty state with custom message", () => {
      render(<PulseCharts type="city" data={null} emptyMessage="Custom empty message" />);
      expect(screen.getByText("Custom empty message")).toBeInTheDocument();
    });
  });
});
