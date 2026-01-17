"use client";

import { useEffect, useRef } from "react";
import {
  Chart,
  ChartConfiguration,
  ChartType,
  registerables,
} from "chart.js";
import { GlobalPulse, CityPulse, NeighborhoodPulse } from "@/types";

Chart.register(...registerables);

interface PulseDataPoint {
  turn: number;
  timestamp: string;
}

interface GlobalPulseHistory extends PulseDataPoint, GlobalPulse {}
interface CityPulseHistory extends PulseDataPoint, CityPulse {}
interface NeighborhoodPulseHistory extends PulseDataPoint, NeighborhoodPulse {}

interface PulseChartsProps {
  globalHistory?: GlobalPulseHistory[];
  cityHistory?: CityPulseHistory[];
  neighborhoodHistory?: NeighborhoodPulseHistory[];
  height?: number;
}

const CHART_COLORS = {
  enforcementClimate: { bg: "rgba(239, 68, 68, 0.2)", border: "rgb(239, 68, 68)" },
  mediaNarrative: { bg: "rgba(59, 130, 246, 0.2)", border: "rgb(59, 130, 246)" },
  judicialAlignment: { bg: "rgba(168, 85, 247, 0.2)", border: "rgb(168, 85, 247)" },
  politicalVolatility: { bg: "rgba(251, 191, 36, 0.2)", border: "rgb(251, 191, 36)" },
  federalCooperation: { bg: "rgba(34, 197, 94, 0.2)", border: "rgb(34, 197, 94)" },
  dataDensity: { bg: "rgba(6, 182, 212, 0.2)", border: "rgb(6, 182, 212)" },
  politicalCover: { bg: "rgba(249, 115, 22, 0.2)", border: "rgb(249, 115, 22)" },
  civilSocietyCapacity: { bg: "rgba(236, 72, 153, 0.2)", border: "rgb(236, 72, 153)" },
  bureaucraticInertia: { bg: "rgba(156, 163, 175, 0.2)", border: "rgb(156, 163, 175)" },
  trust: { bg: "rgba(34, 197, 94, 0.2)", border: "rgb(34, 197, 94)" },
  suspicion: { bg: "rgba(239, 68, 68, 0.2)", border: "rgb(239, 68, 68)" },
  enforcementVisibility: { bg: "rgba(185, 28, 28, 0.2)", border: "rgb(185, 28, 28)" },
  communityDensity: { bg: "rgba(99, 102, 241, 0.2)", border: "rgb(99, 102, 241)" },
  economicPrecarity: { bg: "rgba(251, 146, 60, 0.2)", border: "rgb(251, 146, 60)" },
};

function createChartConfig(
  ctx: CanvasRenderingContext2D,
  type: ChartType,
  labels: string[],
  datasets: Array<{
    label: string;
    data: number[];
    colorKey: keyof typeof CHART_COLORS;
  }>,
  height: number
): Chart {
  const config: ChartConfiguration = {
    type,
    data: {
      labels,
      datasets: datasets.map((ds) => ({
        label: ds.label,
        data: ds.data,
        backgroundColor: CHART_COLORS[ds.colorKey].bg,
        borderColor: CHART_COLORS[ds.colorKey].border,
        borderWidth: 2,
        fill: true,
        tension: 0.3,
      })),
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: true,
          labels: {
            color: "rgb(228, 228, 231)",
            font: { size: 11 },
          },
        },
        tooltip: {
          mode: "index",
          intersect: false,
        },
      },
      scales: {
        x: {
          ticks: { color: "rgb(161, 161, 170)", font: { size: 10 } },
          grid: { color: "rgba(63, 63, 70, 0.5)" },
        },
        y: {
          ticks: { color: "rgb(161, 161, 170)", font: { size: 10 } },
          grid: { color: "rgba(63, 63, 70, 0.5)" },
        },
      },
    },
  };

  return new Chart(ctx, config);
}

export function PulseCharts({
  globalHistory = [],
  cityHistory = [],
  neighborhoodHistory = [],
  height = 200,
}: PulseChartsProps) {
  const globalChartRef = useRef<Chart | null>(null);
  const cityChartRef = useRef<Chart | null>(null);
  const neighborhoodChartRef = useRef<Chart | null>(null);

  const globalCanvasRef = useRef<HTMLCanvasElement>(null);
  const cityCanvasRef = useRef<HTMLCanvasElement>(null);
  const neighborhoodCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!globalCanvasRef.current) return;

    if (globalChartRef.current) {
      globalChartRef.current.destroy();
    }

    if (globalHistory.length > 0) {
      const ctx = globalCanvasRef.current.getContext("2d");
      if (!ctx) return;

      const labels = globalHistory.map((p) => `Day ${p.turn}`);
      const datasets = [
        {
          label: "Enforcement Climate",
          data: globalHistory.map((p) => p.enforcementClimate),
          colorKey: "enforcementClimate" as const,
        },
        {
          label: "Media Narrative",
          data: globalHistory.map((p) => p.mediaNarrative),
          colorKey: "mediaNarrative" as const,
        },
        {
          label: "Judicial Alignment",
          data: globalHistory.map((p) => p.judicialAlignment),
          colorKey: "judicialAlignment" as const,
        },
        {
          label: "Political Volatility",
          data: globalHistory.map((p) => p.politicalVolatility),
          colorKey: "politicalVolatility" as const,
        },
      ];

      globalChartRef.current = createChartConfig(
        ctx,
        "line",
        labels,
        datasets,
        height
      );
    }

    return () => {
      if (globalChartRef.current) {
        globalChartRef.current.destroy();
      }
    };
  }, [globalHistory, height]);

  useEffect(() => {
    if (!cityCanvasRef.current) return;

    if (cityChartRef.current) {
      cityChartRef.current.destroy();
    }

    if (cityHistory.length > 0) {
      const ctx = cityCanvasRef.current.getContext("2d");
      if (!ctx) return;

      const labels = cityHistory.map((p) => `Day ${p.turn}`);
      const datasets = [
        {
          label: "Federal Cooperation",
          data: cityHistory.map((p) => p.federalCooperation),
          colorKey: "federalCooperation" as const,
        },
        {
          label: "Data Density",
          data: cityHistory.map((p) => p.dataDensity),
          colorKey: "dataDensity" as const,
        },
        {
          label: "Political Cover",
          data: cityHistory.map((p) => p.politicalCover),
          colorKey: "politicalCover" as const,
        },
        {
          label: "Civil Society Capacity",
          data: cityHistory.map((p) => p.civilSocietyCapacity),
          colorKey: "civilSocietyCapacity" as const,
        },
        {
          label: "Bureaucratic Inertia",
          data: cityHistory.map((p) => p.bureaucraticInertia),
          colorKey: "bureaucraticInertia" as const,
        },
      ];

      cityChartRef.current = createChartConfig(
        ctx,
        "line",
        labels,
        datasets,
        height
      );
    }

    return () => {
      if (cityChartRef.current) {
        cityChartRef.current.destroy();
      }
    };
  }, [cityHistory, height]);

  useEffect(() => {
    if (!neighborhoodCanvasRef.current) return;

    if (neighborhoodChartRef.current) {
      neighborhoodChartRef.current.destroy();
    }

    if (neighborhoodHistory.length > 0) {
      const ctx = neighborhoodCanvasRef.current.getContext("2d");
      if (!ctx) return;

      const labels = neighborhoodHistory.map((p) => `Day ${p.turn}`);
      const datasets = [
        {
          label: "Trust",
          data: neighborhoodHistory.map((p) => p.trust),
          colorKey: "trust" as const,
        },
        {
          label: "Suspicion",
          data: neighborhoodHistory.map((p) => p.suspicion),
          colorKey: "suspicion" as const,
        },
        {
          label: "Enforcement Visibility",
          data: neighborhoodHistory.map((p) => p.enforcementVisibility),
          colorKey: "enforcementVisibility" as const,
        },
        {
          label: "Community Density",
          data: neighborhoodHistory.map((p) => p.communityDensity),
          colorKey: "communityDensity" as const,
        },
        {
          label: "Economic Precarity",
          data: neighborhoodHistory.map((p) => p.economicPrecarity),
          colorKey: "economicPrecarity" as const,
        },
      ];

      neighborhoodChartRef.current = createChartConfig(
        ctx,
        "line",
        labels,
        datasets,
        height
      );
    }

    return () => {
      if (neighborhoodChartRef.current) {
        neighborhoodChartRef.current.destroy();
      }
    };
  }, [neighborhoodHistory, height]);

  return (
    <div className="space-y-6">
      {globalHistory.length > 0 && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">
            Global Pulse History
          </h3>
          <div style={{ height: `${height}px` }}>
            <canvas ref={globalCanvasRef} />
          </div>
        </div>
      )}

      {cityHistory.length > 0 && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">
            City Pulse History
          </h3>
          <div style={{ height: `${height}px` }}>
            <canvas ref={cityCanvasRef} />
          </div>
        </div>
      )}

      {neighborhoodHistory.length > 0 && (
        <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4">
          <h3 className="text-sm font-semibold text-zinc-300 mb-4">
            Neighborhood Pulse History
          </h3>
          <div style={{ height: `${height}px` }}>
            <canvas ref={neighborhoodCanvasRef} />
          </div>
        </div>
      )}

      {globalHistory.length === 0 &&
        cityHistory.length === 0 &&
        neighborhoodHistory.length === 0 && (
          <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-8 text-center">
            <p className="text-zinc-500">No pulse history data available</p>
          </div>
        )}
    </div>
  );
}

export type {
  PulseChartsProps,
  GlobalPulseHistory,
  CityPulseHistory,
  NeighborhoodPulseHistory,
};
