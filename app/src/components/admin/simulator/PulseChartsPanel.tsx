/**
 * PulseChartsPanel - Displays pulse values across all layers with Chart.js
 */

"use client";

import type {
  GlobalPulse,
  CityPulse,
  NeighborhoodPulse,
  FamilyImpact,
} from "@/types";
import { PulseBar } from "@/components/dashboard/PulseBar";
import { useEffect, useRef } from "react";

interface PulseChartsPanelProps {
  globalPulse: GlobalPulse;
  cityPulse: CityPulse;
  neighborhoodPulse: NeighborhoodPulse;
  family: FamilyImpact;
  neighborhoodName: string;
}

export function PulseChartsPanel({
  globalPulse,
  cityPulse,
  neighborhoodPulse,
  family,
  neighborhoodName,
}: PulseChartsPanelProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<any>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    // Dynamic import for Chart.js to avoid SSR issues
    import("chart.js/auto").then((Chart) => {
      const ctx = canvasRef.current?.getContext("2d");
      if (!ctx) return;

      // Destroy existing chart if any
      if (chartRef.current) {
        chartRef.current.destroy();
      }

      chartRef.current = new Chart.default(ctx, {
        type: "radar",
        data: {
          labels: [
            "Enforcement",
            "Trust/Suspicion",
            "Political Pressure",
            "Economic Stability",
            "Community Strength",
          ],
          datasets: [
            {
              label: "Family",
              data: [
                family.visibility,
                family.cohesion,
                family.stress,
                100 - family.stress,
                family.trustNetworkStrength,
              ],
              backgroundColor: "rgba(245, 158, 11, 0.2)",
              borderColor: "rgba(245, 158, 11, 1)",
              borderWidth: 2,
            },
            {
              label: "Neighborhood",
              data: [
                neighborhoodPulse.enforcementVisibility,
                neighborhoodPulse.trust - neighborhoodPulse.suspicion + 50,
                neighborhoodPulse.suspicion,
                100 - neighborhoodPulse.economicPrecarity,
                neighborhoodPulse.communityDensity,
              ],
              backgroundColor: "rgba(59, 130, 246, 0.2)",
              borderColor: "rgba(59, 130, 246, 1)",
              borderWidth: 2,
            },
          ],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            r: {
              beginAtZero: true,
              max: 100,
              ticks: {
                display: false,
              },
              grid: {
                color: "rgba(63, 63, 70, 0.5)",
              },
              angleLines: {
                color: "rgba(63, 63, 70, 0.5)",
              },
              pointLabels: {
                color: "rgba(161, 161, 170, 1)",
                font: {
                  size: 11,
                },
              },
            },
          },
          plugins: {
            legend: {
              labels: {
                color: "rgba(161, 161, 170, 1)",
              },
            },
          },
        },
      });
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [globalPulse, cityPulse, neighborhoodPulse, family]);

  return (
    <div className="space-y-4">
      {/* Radar Chart */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Pulse Overview
        </h2>
        <div className="h-64">
          <canvas ref={canvasRef} />
        </div>
      </div>

      {/* Global Pulse */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Global Pulse
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <PulseBar
            label="Enforcement"
            value={globalPulse.enforcementClimate}
            color="red"
          />
          <PulseBar
            label="Media Narrative"
            value={globalPulse.mediaNarrative + 100}
            color="amber"
          />
          <PulseBar
            label="Judicial"
            value={globalPulse.judicialAlignment + 50}
            color="green"
          />
          <PulseBar
            label="Volatility"
            value={globalPulse.politicalVolatility}
            color="red"
          />
        </div>
      </div>

      {/* City Pulse */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          City Pulse
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <PulseBar
            label="Fed Coop"
            value={cityPulse.federalCooperation}
            color="red"
          />
          <PulseBar
            label="Data Density"
            value={cityPulse.dataDensity}
            color="amber"
          />
          <PulseBar
            label="Political Cover"
            value={cityPulse.politicalCover}
            color="green"
          />
          <PulseBar
            label="Civil Society"
            value={cityPulse.civilSocietyCapacity}
            color="blue"
          />
          <PulseBar
            label="Inertia"
            value={cityPulse.bureaucraticInertia}
            color="amber"
          />
        </div>
      </div>

      {/* Neighborhood Pulse */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Neighborhood: {neighborhoodName}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <PulseBar
            label="Trust"
            value={neighborhoodPulse.trust}
            color="green"
          />
          <PulseBar
            label="Suspicion"
            value={neighborhoodPulse.suspicion}
            color="red"
            inverted
          />
          <PulseBar
            label="Enforcement"
            value={neighborhoodPulse.enforcementVisibility}
            color="red"
          />
          <PulseBar
            label="Community"
            value={neighborhoodPulse.communityDensity}
            color="blue"
          />
          <PulseBar
            label="Precarity"
            value={neighborhoodPulse.economicPrecarity}
            color="amber"
            inverted
          />
        </div>
      </div>

      {/* Family State */}
      <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Family State
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <PulseBar
            label="Visibility"
            value={family.visibility}
            color="red"
            inverted
          />
          <PulseBar
            label="Stress"
            value={family.stress}
            color="red"
            inverted
          />
          <PulseBar
            label="Cohesion"
            value={family.cohesion}
            color="green"
          />
          <PulseBar
            label="Trust Network"
            value={family.trustNetworkStrength}
            color="blue"
          />
        </div>
      </div>
    </div>
  );
}
