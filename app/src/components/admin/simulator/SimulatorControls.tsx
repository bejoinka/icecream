/**
 * SimulatorControls - Control panel for the simulator
 */

"use client";

import { useState } from "react";

interface SimulatorControlsProps {
  turn: number;
  phase: string;
  maxTurns: number;
  canAdvance: boolean;
  onAdvance: () => void;
  onSubmitChoices: (choiceIds: string[]) => void;
  onReset: () => void;
  isLoading?: boolean;
  gameEnded?: boolean;
}

export function SimulatorControls({
  turn,
  phase,
  maxTurns,
  canAdvance,
  onAdvance,
  onSubmitChoices,
  onReset,
  isLoading = false,
  gameEnded = false,
}: SimulatorControlsProps) {
  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);

  const handleToggleChoice = (choiceId: string) => {
    setSelectedChoices((prev) =>
      prev.includes(choiceId)
        ? prev.filter((id) => id !== choiceId)
        : [...prev, choiceId]
    );
  };

  const handleSubmitChoices = () => {
    if (selectedChoices.length > 0) {
      onSubmitChoices(selectedChoices);
      setSelectedChoices([]);
    }
  };

  const phaseColors: Record<string, string> = {
    plan: "bg-blue-600",
    pulse_update: "bg-purple-600",
    event: "bg-yellow-600",
    decision: "bg-orange-600",
    consequence: "bg-green-600",
  };

  const phaseLabels: Record<string, string> = {
    plan: "Plan",
    pulse_update: "Pulse Update",
    event: "Event",
    decision: "Decision",
    consequence: "Consequence",
  };

  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
        Simulator Controls
      </h2>

      {/* Turn Counter */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-zinc-300">
          <span className="text-2xl font-bold text-amber-500">{turn}</span>
          <span className="text-zinc-500"> / {maxTurns}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-zinc-500 uppercase">Phase:</span>
          <span
            className={`
            px-2 py-1 rounded text-xs font-medium text-white
            ${phaseColors[phase] || "bg-zinc-600"}
          `}
          >
            {phaseLabels[phase] || phase}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="h-2 bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-amber-600 transition-all duration-300"
            style={{ width: `${(turn / maxTurns) * 100}%` }}
          />
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        {phase === "decision" ? (
          <button
            onClick={handleSubmitChoices}
            disabled={selectedChoices.length === 0 || isLoading}
            className="flex-1 bg-amber-600 hover:bg-amber-700 disabled:bg-zinc-700 disabled:text-zinc-500 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            {isLoading ? "Submitting..." : `Submit Choice${selectedChoices.length !== 1 ? "s" : ""}`}
            {selectedChoices.length > 0 && ` (${selectedChoices.length})`}
          </button>
        ) : (
          <button
            onClick={onAdvance}
            disabled={!canAdvance || isLoading || gameEnded}
            className="flex-1 bg-zinc-700 hover:bg-zinc-600 disabled:bg-zinc-800 disabled:text-zinc-500 text-white font-medium py-2 px-4 rounded transition-colors"
          >
            {isLoading ? "Advancing..." : "Advance Phase"}
          </button>
        )}

        <button
          onClick={onReset}
          disabled={isLoading}
          className="bg-red-900/50 hover:bg-red-900/70 text-red-300 font-medium py-2 px-4 rounded transition-colors border border-red-900/50"
        >
          Reset
        </button>
      </div>

      {gameEnded && (
        <div className="mt-4 p-3 bg-amber-900/20 border border-amber-900/50 rounded">
          <p className="text-amber-400 text-sm text-center">
            Game has ended. Reset to start again.
          </p>
        </div>
      )}

      {/* Selected Choices Display */}
      {selectedChoices.length > 0 && (
        <div className="mt-4 p-3 bg-zinc-800 rounded border border-zinc-700">
          <p className="text-xs text-zinc-500 uppercase tracking-wider mb-2">
            Selected Choices
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedChoices.map((id) => (
              <span
                key={id}
                className="text-xs bg-amber-900/50 text-amber-400 px-2 py-1 rounded flex items-center gap-1"
              >
                {id}
                <button
                  onClick={() => handleToggleChoice(id)}
                  className="hover:text-amber-300"
                >
                  ×
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
