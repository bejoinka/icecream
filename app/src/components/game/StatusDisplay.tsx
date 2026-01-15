"use client";

import { FamilyImpact, NeighborhoodPulse, TurnPhase } from "@/types";

interface StatusDisplayProps {
  turn: number;
  maxTurns: number;
  phase: TurnPhase;
  family: FamilyImpact;
  neighborhood: NeighborhoodPulse;
  neighborhoodName: string;
}

function StatBar({
  label,
  value,
  color = "amber",
  inverted = false,
}: {
  label: string;
  value: number;
  color?: "amber" | "red" | "green" | "blue";
  inverted?: boolean;
}) {
  const displayValue = inverted ? 100 - value : value;
  const colorClasses = {
    amber: "bg-amber-500",
    red: "bg-red-500",
    green: "bg-green-500",
    blue: "bg-blue-500",
  };

  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-zinc-400">{label}</span>
        <span className="text-zinc-500">{Math.round(value)}</span>
      </div>
      <div className="h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500`}
          style={{ width: `${displayValue}%` }}
        />
      </div>
    </div>
  );
}

const PHASE_LABELS: Record<TurnPhase, string> = {
  plan: "Planning",
  pulse_update: "Day Unfolds",
  event: "Something Happens",
  decision: "Your Move",
  consequence: "Aftermath",
};

export function StatusDisplay({
  turn,
  maxTurns,
  phase,
  family,
  neighborhood,
  neighborhoodName,
}: StatusDisplayProps) {
  const progress = (turn / maxTurns) * 100;

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4">
      {/* Turn progress */}
      <div className="mb-4">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-zinc-300">
            Day {turn} of {maxTurns}
          </span>
          <span className="text-xs text-amber-400">{PHASE_LABELS[phase]}</span>
        </div>
        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-600 to-amber-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Family stats */}
      <div className="mb-4">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          Family
        </h3>
        <StatBar
          label="Visibility"
          value={family.visibility}
          color="red"
        />
        <StatBar
          label="Stress"
          value={family.stress}
          color="red"
        />
        <StatBar
          label="Cohesion"
          value={family.cohesion}
          color="green"
        />
        <StatBar
          label="Support Network"
          value={family.trustNetworkStrength}
          color="blue"
        />
      </div>

      {/* Neighborhood stats */}
      <div>
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">
          {neighborhoodName}
        </h3>
        <StatBar
          label="Community Trust"
          value={neighborhood.trust}
          color="green"
        />
        <StatBar
          label="Suspicion"
          value={neighborhood.suspicion}
          color="red"
        />
        <StatBar
          label="Enforcement Presence"
          value={neighborhood.enforcementVisibility}
          color="red"
        />
        <StatBar
          label="Community Bonds"
          value={neighborhood.communityDensity}
          color="blue"
        />
      </div>
    </div>
  );
}
