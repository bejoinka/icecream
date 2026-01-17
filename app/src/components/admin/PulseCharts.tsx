/**
 * PulseCharts - Chart visualization component for pulse data
 * Displays time-series charts and current values for pulse metrics
 */

import { useEffect, useRef } from "react";
import type { CityPulse, GlobalPulse, NeighborhoodPulse } from "@/types";

// Recharts components (mocked in tests)
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

// =============================================================================
// Types
// =============================================================================

export type PulseType = "city" | "global" | "neighborhood";

export interface HistoryDataPoint {
  turn: number;
  value: number;
  [key: string]: number;
}

export interface PulseChartsProps {
  /** Type of pulse data to display */
  type: PulseType;
  /** Current pulse data */
  data: CityPulse | GlobalPulse | NeighborhoodPulse | null | undefined;
  /** Optional historical data for time series */
  history?: HistoryDataPoint[];
  /** Optional specific metric to display */
  metric?: string;
  /** Enable smooth animations */
  animate?: boolean;
  /** Auto-refresh chart data */
  autoRefresh?: boolean;
  /** Responsive chart sizing */
  responsive?: boolean;
  /** Color scheme variant */
  colorScheme?: "default" | "heatmap" | "monochrome";
  /** Custom color mapping function */
  colorMap?: (value: number) => string;
  /** Enable gradient fills */
  gradient?: boolean;
  /** Show loading state */
  loading?: boolean;
  /** Error message to display */
  error?: string;
  /** Custom empty state fallback */
  fallback?: React.ReactNode;
  /** Custom empty state message */
  emptyMessage?: string;
}

/** History types for pulse data */
export interface GlobalPulseHistory {
  turn: number;
  enforcementClimate: number;
  mediaNarrative: number;
  judicialAlignment: number;
  politicalVolatility: number;
}

export interface CityPulseHistory {
  turn: number;
  federalCooperation: number;
  dataDensity: number;
  politicalCover: number;
  civilSocietyCapacity: number;
  bureaucraticInertia: number;
}

export interface NeighborhoodPulseHistory {
  turn: number;
  trust: number;
  suspicion: number;
  enforcementVisibility: number;
  communityDensity: number;
  economicPrecarity: number;
}

// =============================================================================
// Metric Labels
// =============================================================================

const CITY_METRIC_LABELS: Record<keyof CityPulse, string> = {
  federalCooperation: "Federal Cooperation",
  dataDensity: "Data Density",
  politicalCover: "Political Cover",
  civilSocietyCapacity: "Civil Society Capacity",
  bureaucraticInertia: "Bureaucratic Inertia",
};

const GLOBAL_METRIC_LABELS: Record<keyof GlobalPulse, string> = {
  enforcementClimate: "Enforcement Climate",
  mediaNarrative: "Media Narrative",
  judicialAlignment: "Judicial Alignment",
  politicalVolatility: "Political Volatility",
};

const NEIGHBORHOOD_METRIC_LABELS: Record<keyof NeighborhoodPulse, string> = {
  trust: "Trust",
  suspicion: "Suspicion",
  enforcementVisibility: "Enforcement Visibility",
  communityDensity: "Community Density",
  economicPrecarity: "Economic Precarity",
};

// =============================================================================
// Color Utilities
// =============================================================================

function getValueColor(value: number, min: number, max: number): "low" | "medium" | "high" {
  const range = max - min;
  const normalized = (value - min) / range;
  if (normalized < 0.33) return "low";
  if (normalized < 0.67) return "medium";
  return "high";
}

function getNarrativeColor(value: number): "negative" | "neutral" | "positive" {
  if (value < -20) return "negative";
  if (value > 20) return "positive";
  return "neutral";
}

function getColorClass(colorType: "low" | "medium" | "high" | "negative" | "neutral" | "positive"): string {
  switch (colorType) {
    case "low":
    case "negative":
      return "text-red-500";
    case "medium":
    case "neutral":
      return "text-amber-500";
    case "high":
    case "positive":
      return "text-green-500";
    default:
      return "text-amber-500";
  }
}

// =============================================================================
// Empty State Components
// =============================================================================

function EmptyState({ message }: { message?: string }) {
  return (
    <div className="flex items-center justify-center h-64 text-zinc-500">
      <p>{message || "No pulse data available"}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div data-testid="charts-loading" className="flex items-center justify-center h-64">
      <div className="animate-spin h-8 w-8 border-4 border-zinc-700 border-t-amber-500 rounded-full" />
    </div>
  );
}

function ErrorState({ error }: { error: string }) {
  return (
    <div className="flex items-center justify-center h-64 text-red-500">
      <p>{error}</p>
    </div>
  );
}

// =============================================================================
// Single Chart Component
// =============================================================================

interface SingleChartProps {
  label: string;
  value: number;
  history?: HistoryDataPoint[];
  animate?: boolean;
  colorMap?: (value: number) => string;
  gradient?: boolean;
  min?: number;
  max?: number;
}

function SingleChart({
  label,
  value,
  history,
  animate = false,
  colorMap,
  gradient = false,
  min = 0,
  max = 100,
}: SingleChartProps) {
  const colorValue = min < 0
    ? getNarrativeColor(value)
    : getValueColor(value, min, max);
  const colorClass = colorMap ? colorMap(value) : getColorClass(colorValue);

  const chartData = history?.map((point) => ({
    turn: point.turn,
    value: point.value,
  })) || [{ turn: 0, value }];

  return (
    <div className="mb-6" data-color={colorValue} data-gradient={gradient ? "true" : undefined}>
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-sm text-zinc-400">{label}</h4>
        <span className={`text-lg font-semibold ${colorClass}`}>
          {animate ? (
            <span className="transition-all duration-500">{Math.round(value)}</span>
          ) : (
            Math.round(value)
          )}
        </span>
      </div>

      {history && history.length > 0 && (
        <ResponsiveContainer width="100%" height={120}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#3f3f46" />
            <XAxis
              dataKey="turn"
              stroke="#71717a"
              tick={{ fill: "#71717a", fontSize: 10 }}
            />
            <YAxis
              domain={[min, max]}
              stroke="#71717a"
              tick={{ fill: "#71717a", fontSize: 10 }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: "#27272a", border: "1px solid #3f3f46" }}
              labelStyle={{ color: "#a1a1aa" }}
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke={colorClass.includes("red") ? "#ef4444" : colorClass.includes("green") ? "#22c55e" : "#f59e0b"}
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      )}

      {(!history || history.length === 0) && (
        <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className={`h-full ${colorClass.includes("red") ? "bg-red-500" : colorClass.includes("green") ? "bg-green-500" : "bg-amber-500"} transition-all duration-500`}
            style={{ width: `${Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100))}%` }}
          />
        </div>
      )}
    </div>
  );
}

// =============================================================================
// Main PulseCharts Component
// =============================================================================

export function PulseCharts({
  type,
  data,
  history = [],
  metric,
  animate = false,
  autoRefresh = false,
  responsive = true,
  colorScheme = "default",
  colorMap,
  gradient = false,
  loading = false,
  error,
  fallback,
  emptyMessage,
}: PulseChartsProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  // Handle responsive resize
  useEffect(() => {
    if (responsive) {
      const handleResize = () => {
        // Resize handling delegated to ResponsiveContainer
      };
      window.addEventListener("resize", handleResize);
      return () => window.removeEventListener("resize", handleResize);
    }
  }, [responsive]);

  // Auto-refresh simulation
  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        // Auto-refresh logic would be here
        // For now, this is just a placeholder
      }, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Loading state
  if (loading) {
    return <LoadingState />;
  }

  // Error state
  if (error) {
    return <ErrorState error={error} />;
  }

  // Empty state
  if (!data) {
    return fallback ? <>{fallback}</> : <EmptyState message={emptyMessage} />;
  }

  // Get title and labels based on type
  const title = type === "city"
    ? "City Pulse Charts"
    : type === "global"
    ? "Global Pulse Charts"
    : "Neighborhood Pulse Charts";

  const labels = type === "city"
    ? CITY_METRIC_LABELS
    : type === "global"
    ? GLOBAL_METRIC_LABELS
    : NEIGHBORHOOD_METRIC_LABELS;

  // Filter to specific metric if provided
  const metrics = metric
    ? [metric as keyof typeof data]
    : (Object.keys(labels) as Array<keyof typeof data>);

  // Get value range for a specific metric
  const getValueRange = (metricKey: keyof typeof data) => {
    if (type === "global") {
      if (metricKey === "mediaNarrative") {
        return { min: -100, max: 100 };
      }
      if (metricKey === "judicialAlignment") {
        return { min: -50, max: 50 };
      }
    }
    return { min: 0, max: 100 };
  };

  return (
    <div
      ref={containerRef}
      data-testid="pulse-charts-container"
      className={`pulse-charts ${colorScheme !== "default" ? `color-scheme-${colorScheme}` : ""}`}
    >
      <h3 className="text-xl font-semibold text-zinc-100 mb-4">{title}</h3>

      {metrics.map((key) => {
        const label = labels[key];
        const value = data[key] as number;

        // Skip if value doesn't exist in data (handles partial data)
        if (typeof value !== "number") {
          return null;
        }

        const { min, max } = getValueRange(key);

        return (
          <SingleChart
            key={key}
            label={label}
            value={value}
            history={history}
            animate={animate}
            colorMap={colorMap}
            gradient={gradient}
            min={min}
            max={max}
          />
        );
      })}
    </div>
  );
}
