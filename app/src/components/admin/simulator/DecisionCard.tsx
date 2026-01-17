/**
 * DecisionCard - Displays current decision and choices
 */

"use client";

import type { Decision } from "@/types";

interface DecisionCardProps {
  decision: Decision | null;
  phase: string;
  onSelectChoice: (choiceId: string) => void;
  selectedChoices: string[];
}

export function DecisionCard({
  decision,
  phase,
  onSelectChoice,
  selectedChoices,
}: DecisionCardProps) {
  if (!decision) {
    return (
      <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-6">
        <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
          Current Decision
        </h2>
        <p className="text-zinc-500 italic">
          {phase === "decision"
            ? "No decision pending..."
            : `Waiting for ${phase} phase...`}
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 rounded-lg border border-amber-900/50 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold text-amber-500 uppercase tracking-wider">
          Decision Required
        </h2>
        {decision.urgency && (
          <span className="text-xs bg-red-900/50 text-red-400 px-2 py-1 rounded">
            Urgency: {decision.urgency} turns
          </span>
        )}
      </div>

      <div className="mb-6">
        <h3 className="text-xl font-semibold text-zinc-100 mb-2">
          {decision.title}
        </h3>
        <p className="text-zinc-300 leading-relaxed">{decision.narrative}</p>
      </div>

      <div className="space-y-3">
        <p className="text-xs text-zinc-500 uppercase tracking-wider">
          {decision.multiSelect ? "Select all that apply:" : "Choose one:"}
        </p>
        {decision.choices.map((choice) => {
          const isSelected = selectedChoices.includes(choice.id);
          const isDisabled = choice.unlockConditions && false; // Simplified check

          return (
            <button
              key={choice.id}
              onClick={() => onSelectChoice(choice.id)}
              disabled={isDisabled}
              className={`
                w-full text-left p-4 rounded-lg border transition-all
                ${
                  isSelected
                    ? "bg-amber-900/30 border-amber-600"
                    : "bg-zinc-800 border-zinc-700 hover:border-zinc-500"
                }
                ${isDisabled ? "opacity-50 cursor-not-allowed" : ""}
              `}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium text-zinc-100 mb-1">
                    {choice.label}
                  </div>
                  <div className="text-sm text-zinc-400">
                    {choice.description}
                  </div>
                </div>
                <div className="ml-3">
                  <div
                    className={`
                    w-5 h-5 rounded border flex items-center justify-center
                    ${
                      isSelected
                        ? "bg-amber-600 border-amber-600"
                        : "border-zinc-600"
                    }
                  `}
                  >
                    {isSelected && (
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" />
                      </svg>
                    )}
                  </div>
                </div>
              </div>

              {choice.effects && Object.keys(choice.effects).length > 0 && (
                <div className="mt-2 pt-2 border-t border-zinc-700">
                  <div className="text-xs text-zinc-500">
                    Effects:{" "}
                    {Object.entries(choice.effects).map(([key, value]) => (
                      <span key={key} className="inline-block mr-3">
                        <span className="text-zinc-400">{key}:</span>{" "}
                        <span className={value > 0 ? "text-green-500" : value < 0 ? "text-red-500" : "text-zinc-400"}>
                          {value > 0 ? "+" : ""}
                          {value}
                        </span>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {choice.unlockConditions && (
                <div className="mt-2 text-xs text-zinc-600">
                  Requires: {JSON.stringify(choice.unlockConditions)}
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
