/**
 * TurnHistoryPanel - Displays history of turns and choices made
 */

import type { ChoiceRecord, Decision } from "@/types";

interface TurnHistoryPanelProps {
  choiceHistory: ChoiceRecord[];
  currentTurn: number;
  currentDecision: Decision | null;
}

export function TurnHistoryPanel({
  choiceHistory,
  currentTurn,
  currentDecision,
}: TurnHistoryPanelProps) {
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
        Turn History
      </h2>

      {choiceHistory.length === 0 ? (
        <p className="text-zinc-500 text-sm italic">No choices recorded yet.</p>
      ) : (
        <div className="space-y-3 max-h-64 overflow-y-auto">
          {choiceHistory.map((record, idx) => (
            <div
              key={idx}
              className="bg-zinc-800 rounded border border-zinc-700 p-3"
            >
              <div className="flex justify-between items-start mb-2">
                <span className="text-amber-500 font-medium text-sm">
                  Turn {record.turn}
                </span>
                <span className="text-zinc-500 text-xs">{record.decisionId}</span>
              </div>
              <div className="text-zinc-300 text-xs mb-2">
                Choices:{" "}
                {record.choiceIds.map((id) => (
                  <span
                    key={id}
                    className="inline-block bg-zinc-700 px-2 py-0.5 rounded mr-1 mb-1"
                  >
                    {id}
                  </span>
                ))}
              </div>
              {Object.keys(record.effects).length > 0 && (
                <div className="text-zinc-400 text-xs">
                  Effects:{" "}
                  {Object.entries(record.effects).map(([key, value]) => (
                    <span key={key} className="mr-2">
                      {key}: {value > 0 ? "+" : ""}
                      {value}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {currentDecision && (
        <div className="mt-4 pt-4 border-t border-zinc-700">
          <div className="text-amber-500 text-sm font-medium mb-2">
            Current Decision (Turn {currentTurn})
          </div>
          <div className="bg-amber-900/20 rounded border border-amber-900/50 p-3">
            <div className="text-zinc-200 font-medium mb-1">
              {currentDecision.title}
            </div>
            <div className="text-zinc-400 text-sm">
              {currentDecision.narrative}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
