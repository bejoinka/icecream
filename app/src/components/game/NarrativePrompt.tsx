"use client";

import { useState } from "react";
import { Decision, Choice } from "@/types";

interface NarrativePromptProps {
  decision: Decision;
  onSubmit: (choiceIds: string[]) => void;
  unlockedChoices?: string[];
}

export function NarrativePrompt({
  decision,
  onSubmit,
  unlockedChoices = [],
}: NarrativePromptProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const handleSelect = (choiceId: string) => {
    if (decision.multiSelect) {
      setSelectedIds((prev) =>
        prev.includes(choiceId)
          ? prev.filter((id) => id !== choiceId)
          : [...prev, choiceId]
      );
    } else {
      setSelectedIds([choiceId]);
    }
  };

  const handleSubmit = () => {
    if (selectedIds.length > 0) {
      onSubmit(selectedIds);
    }
  };

  const isChoiceUnlocked = (choice: Choice): boolean => {
    if (!choice.unlockConditions?.requiredChoices) return true;
    return choice.unlockConditions.requiredChoices.every((req) =>
      unlockedChoices.includes(req)
    );
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-zinc-900 rounded-lg border border-zinc-700">
      {/* Title */}
      <h2 className="text-xl font-bold text-amber-400 mb-4">{decision.title}</h2>

      {/* Narrative text */}
      <div className="prose prose-invert mb-6">
        <p className="text-zinc-300 leading-relaxed">{decision.narrative}</p>
      </div>

      {/* Urgency indicator */}
      {decision.urgency && (
        <div className="mb-4 text-red-400 text-sm">
          ⚠ This requires a response within {decision.urgency} turn
          {decision.urgency > 1 ? "s" : ""}.
        </div>
      )}

      {/* Choice options */}
      <div className="space-y-3 mb-6">
        {decision.choices.map((choice) => {
          const unlocked = isChoiceUnlocked(choice);
          const selected = selectedIds.includes(choice.id);

          return (
            <button
              key={choice.id}
              onClick={() => unlocked && handleSelect(choice.id)}
              disabled={!unlocked}
              className={`
                w-full p-4 rounded-lg border text-left transition-all
                ${
                  unlocked
                    ? selected
                      ? "border-amber-500 bg-amber-500/20 text-white"
                      : "border-zinc-600 bg-zinc-800 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-750"
                    : "border-zinc-700 bg-zinc-800/50 text-zinc-500 cursor-not-allowed"
                }
              `}
            >
              <div className="flex items-start gap-3">
                {/* Selection indicator */}
                <div
                  className={`
                    w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5
                    ${
                      selected
                        ? "border-amber-500 bg-amber-500"
                        : unlocked
                        ? "border-zinc-500"
                        : "border-zinc-700"
                    }
                  `}
                >
                  {selected && (
                    <svg
                      className="w-full h-full text-zinc-900"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>

                <div className="flex-1">
                  <div className="font-medium mb-1">{choice.label}</div>
                  <div className="text-sm text-zinc-400">
                    {choice.description}
                  </div>
                  {!unlocked && (
                    <div className="text-xs text-red-400 mt-2">
                      🔒 Requires additional knowledge to unlock
                    </div>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Submit button */}
      <button
        onClick={handleSubmit}
        disabled={selectedIds.length === 0}
        className={`
          w-full py-3 px-6 rounded-lg font-medium transition-all
          ${
            selectedIds.length > 0
              ? "bg-amber-500 text-zinc-900 hover:bg-amber-400"
              : "bg-zinc-700 text-zinc-500 cursor-not-allowed"
          }
        `}
      >
        {decision.multiSelect ? "Confirm Selections" : "Make Your Choice"}
      </button>
    </div>
  );
}
