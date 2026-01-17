"use client";

import { useEffect, useState } from "react";
import { PulseBar } from "@/components/dashboard/PulseBar";
import { StatusDisplay } from "@/components/game/StatusDisplay";
import { NarrativePrompt } from "@/components/game/NarrativePrompt";
import { TurnHistoryPanel } from "@/components/admin/simulator/TurnHistoryPanel";
import { PulseChartsPanel } from "@/components/admin/simulator/PulseChartsPanel";
import { DecisionCard } from "@/components/admin/simulator/DecisionCard";
import { SimulatorControls } from "@/components/admin/simulator/SimulatorControls";
import type {
  GameState,
  TurnPhase,
  CityRow,
} from "@/types";

const PHASE_LABELS: Record<TurnPhase, string> = {
  plan: "Planning",
  pulse_update: "Day Unfolds",
  event: "Something Happens",
  decision: "Your Move",
  consequence: "Aftermath",
};

// ============================================================================
// SESSION LIST COMPONENT
// ============================================================================

interface SessionSummary {
  sessionId: string;
  createdAt: string;
  updatedAt: string;
  turn: number;
  phase: TurnPhase;
  city: string;
  neighborhood?: string;
  ending: { type: string; reason?: string; turn: number } | null;
}

function SessionList({
  sessions,
  selectedId,
  onSelect,
  onDelete,
  onCreate,
  isLoading,
}: {
  sessions: SessionSummary[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onCreate: (cityId: string) => void;
  isLoading: boolean;
}) {
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4 h-full flex flex-col">
      <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
        Sessions
      </h2>

      {/* City selector for creating new session */}
      <div className="mb-4">
        <label className="text-xs text-zinc-500 mb-2 block">New Session</label>
        <CitySelector onSelect={onCreate} />
      </div>

      {/* Session list */}
      <div className="flex-1 overflow-y-auto space-y-2">
        {isLoading ? (
          <div className="text-zinc-500 text-sm">Loading sessions...</div>
        ) : sessions.length === 0 ? (
          <div className="text-zinc-500 text-sm italic">
            No active sessions. Create one to start.
          </div>
        ) : (
          sessions.map((session) => (
            <SessionCard
              key={session.sessionId}
              session={session}
              isSelected={selectedId === session.sessionId}
              onSelect={() => onSelect(session.sessionId)}
              onDelete={() => onDelete(session.sessionId)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function SessionCard({
  session,
  isSelected,
  onSelect,
  onDelete,
}: {
  session: SessionSummary;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const phaseColor = session.ending
    ? "text-red-400"
    : session.phase === "decision"
    ? "text-amber-400"
    : "text-zinc-400";

  return (
    <div
      className={`
        p-3 rounded-lg border cursor-pointer transition-all
        ${isSelected ? "border-amber-600 bg-amber-900/20" : "border-zinc-700 bg-zinc-800 hover:border-zinc-600"}
      `}
    >
      <div className="flex justify-between items-start mb-2">
        <button
          onClick={onSelect}
          className="flex-1 text-left"
        >
          <div className="text-sm font-medium text-zinc-200">
            {session.city}
          </div>
          {session.neighborhood && (
            <div className="text-xs text-zinc-500">{session.neighborhood}</div>
          )}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Delete this session?")) {
              onDelete();
            }
          }}
          className="text-zinc-600 hover:text-red-400 ml-2"
          title="Delete session"
        >
          ×
        </button>
      </div>
      <div className="flex justify-between items-center text-xs">
        <span className={phaseColor}>{PHASE_LABELS[session.phase]}</span>
        <span className="text-zinc-500">Day {session.turn}</span>
      </div>
      {session.ending && (
        <div className="mt-2 text-xs text-red-400">
          {session.ending.type === "victory" ? "Victory!" : `Failed: ${session.ending.reason}`}
        </div>
      )}
    </div>
  );
}

// ============================================================================
// CITY SELECTOR
// ============================================================================

function CitySelector({ onSelect }: { onSelect: (cityId: string) => void }) {
  const [cities, setCities] = useState<CityRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/cities")
      .then((res) => res.json())
      .then((data) => {
        setCities(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <select
      className="w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-sm text-zinc-200 focus:outline-none focus:border-amber-600"
      onChange={(e) => {
        if (e.target.value) {
          onSelect(e.target.value);
          e.target.value = "";
        }
      }}
      disabled={loading}
    >
      <option value="">Select city to start...</option>
      {cities.map((city) => (
        <option key={city.id} value={city.id}>
          {city.name}, {city.state}
        </option>
      ))}
    </select>
  );
}

// ============================================================================
// GAME STATE VIEW
// ============================================================================

function GameStateView({
  state,
  onNextPhase,
  onChoice,
}: {
  state: GameState;
  onNextPhase: () => void;
  onChoice: (choiceIds: string[]) => void;
}) {
  const currentNeighborhood = state.city.neighborhoods.find(
    (n) => n.id === state.city.currentNeighborhoodId
  );

  const [selectedChoices, setSelectedChoices] = useState<string[]>([]);

  const handleSelectChoice = (choiceId: string) => {
    setSelectedChoices((prev) =>
      prev.includes(choiceId)
        ? prev.filter((id) => id !== choiceId)
        : [...prev, choiceId]
    );
  };

  const handleSubmitChoices = () => {
    if (selectedChoices.length > 0) {
      onChoice(selectedChoices);
      setSelectedChoices([]);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Left Column - Pulse Charts */}
      <div className="lg:col-span-2 space-y-6">
        {/* Header with turn info */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-zinc-100">
                {state.city.name}, {state.city.state}
              </h1>
              {currentNeighborhood && (
                <p className="text-zinc-400">{currentNeighborhood.name}</p>
              )}
            </div>
            <div className="text-right">
              <div className="text-amber-400 font-semibold">
                {PHASE_LABELS[state.phase]}
              </div>
              <div className="text-zinc-500 text-sm">
                Day {state.turn} of {state.maxTurns}
              </div>
            </div>
          </div>
        </div>

        {/* Game ending display */}
        {state.ending && (
          <div
            className={`
              rounded-lg border p-6 text-center
              ${
                state.ending.type === "victory"
                  ? "bg-green-900/20 border-green-700"
                  : "bg-red-900/20 border-red-700"
              }
            `}
          >
            <h2
              className={`
                text-xl font-bold mb-2
                ${state.ending.type === "victory" ? "text-green-400" : "text-red-400"}
              `}
            >
              {state.ending.type === "victory" ? "Victory!" : "Game Over"}
            </h2>
            <p className="text-zinc-300">
              {state.ending.type === "victory"
                ? `Victory type: ${state.ending.victoryType}`
                : state.ending.reason}
            </p>
            <p className="text-zinc-500 text-sm mt-2">
              Ended on Day {state.ending.turn}
            </p>
          </div>
        )}

        {/* Pulse Charts Panel */}
        {currentNeighborhood && (
          <PulseChartsPanel
            globalPulse={state.globalPulse}
            cityPulse={state.city.pulse}
            neighborhoodPulse={currentNeighborhood.pulse}
            family={state.family}
            neighborhoodName={currentNeighborhood.name}
          />
        )}

        {/* City Pulse */}
        <section className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
          City Pulse
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
          <PulseBar
            label="Federal Coop"
            value={state.city.pulse.federalCooperation}
            color="red"
          />
          <PulseBar
            label="Data Density"
            value={state.city.pulse.dataDensity}
            color="amber"
          />
          <PulseBar
            label="Political Cover"
            value={state.city.pulse.politicalCover}
            color="green"
          />
          <PulseBar
            label="Civil Society"
            value={state.city.pulse.civilSocietyCapacity}
            color="blue"
          />
          <PulseBar
            label="Bureaucratic Inertia"
            value={state.city.pulse.bureaucraticInertia}
            color="amber"
          />
        </div>
      </section>

      {/* Global Pulse */}
      <section className="bg-zinc-900 rounded-lg border border-zinc-800 p-6">
        <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
          Global / National Pulse
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <PulseBar
            label="Enforcement Climate"
            value={state.globalPulse.enforcementClimate}
            color="red"
          />
          <PulseBar
            label="Media Narrative"
            value={(state.globalPulse.mediaNarrative + 100) / 2}
            color="amber"
          />
          <PulseBar
            label="Judicial Alignment"
            value={(state.globalPulse.judicialAlignment + 50) / 1.5}
            color="blue"
          />
          <PulseBar
            label="Political Volatility"
            value={state.globalPulse.politicalVolatility}
            color="red"
          />
        </div>
      </section>

      {/* Active Events */}
      {(state.activeEvents.global.length > 0 ||
        state.activeEvents.city.length > 0 ||
        state.activeEvents.neighborhood.length > 0) && (
        <section className="bg-zinc-900 rounded-lg border border-zinc-700 p-4">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            Active Events
          </h2>
          <div className="space-y-4">
            {state.activeEvents.global.length > 0 && (
              <div>
                <h3 className="text-xs text-red-400 uppercase mb-2">Global</h3>
                {state.activeEvents.global.map((event) => (
                  <div
                    key={event.id}
                    className="bg-red-900/20 border border-red-900/50 rounded p-3 mb-2"
                  >
                    <div className="font-medium text-zinc-200">{event.title}</div>
                    <div className="text-xs text-zinc-400">{event.description}</div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Severity: {event.magnitude} | Ends turn {event.startTurn + event.durationDays}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {state.activeEvents.city.length > 0 && (
              <div>
                <h3 className="text-xs text-amber-400 uppercase mb-2">City</h3>
                {state.activeEvents.city.map((event) => (
                  <div
                    key={event.id}
                    className="bg-amber-900/20 border border-amber-900/50 rounded p-3 mb-2"
                  >
                    <div className="font-medium text-zinc-200">{event.title}</div>
                    <div className="text-xs text-zinc-400">{event.description}</div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Visibility: {event.visibility}% | Ends turn {event.startTurn + event.durationDays}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {state.activeEvents.neighborhood.length > 0 && (
              <div>
                <h3 className="text-xs text-blue-400 uppercase mb-2">Neighborhood</h3>
                {state.activeEvents.neighborhood.map((event) => (
                  <div
                    key={event.id}
                    className="bg-blue-900/20 border border-blue-900/50 rounded p-3 mb-2"
                  >
                    <div className="font-medium text-zinc-200">{event.title}</div>
                    <div className="text-xs text-zinc-400">{event.description}</div>
                    <div className="text-xs text-zinc-500 mt-1">
                      Type: {event.type} | Severity: {event.severity}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}
      </div>

      {/* Right Column - Controls & History */}
      <div className="space-y-6">
        {/* Decision Card */}
        <DecisionCard
          decision={state.currentDecision}
          phase={state.phase}
          onSelectChoice={handleSelectChoice}
          selectedChoices={selectedChoices}
        />

        {/* Controls */}
        {!state.ending && (
          <SimulatorControls
            turn={state.turn}
            phase={state.phase}
            maxTurns={state.maxTurns}
            canAdvance={state.phase !== "decision" || !state.currentDecision}
            onAdvance={onNextPhase}
            onSubmitChoices={handleSubmitChoices}
            onReset={() => window.location.reload()}
            isLoading={false}
            gameEnded={false}
          />
        )}

        {/* Turn History */}
        <TurnHistoryPanel
          choiceHistory={state.choiceHistory}
          currentTurn={state.turn}
          currentDecision={state.currentDecision}
        />

        {/* All Neighborhoods */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 p-4">
          <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider mb-4">
            All Neighborhoods
          </h2>
          <div className="space-y-3">
            {state.city.neighborhoods.map((hood) => (
              <div
                key={hood.id}
                className={`
                  p-3 rounded border
                  ${
                    hood.id === state.city.currentNeighborhoodId
                      ? "border-amber-600 bg-amber-900/20"
                      : "border-zinc-700 bg-zinc-800"
                  }
                `}
              >
                <div className="text-sm font-medium text-zinc-200 mb-2">
                  {hood.name}
                  {hood.id === state.city.currentNeighborhoodId && (
                    <span className="ml-2 text-xs text-amber-400">(Current)</span>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <PulseBar label="Trust" value={hood.pulse.trust} color="green" compact />
                  <PulseBar label="Suspicion" value={hood.pulse.suspicion} color="red" compact />
                  <PulseBar label="Enforcement" value={hood.pulse.enforcementVisibility} color="red" compact />
                  <PulseBar label="Community" value={hood.pulse.communityDensity} color="blue" compact />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function nextPhase(current: TurnPhase): TurnPhase {
  const phases: TurnPhase[] = ["plan", "pulse_update", "event", "decision", "consequence"];
  const idx = phases.indexOf(current);
  if (idx === phases.length - 1) return phases[0];
  return phases[idx + 1];
}

// ============================================================================
// MAIN PAGE
// ============================================================================

export default function AdminSimulatorPage() {
  const [sessions, setSessions] = useState<SessionSummary[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [loading, setLoading] = useState(false);

  // Load sessions on mount
  useEffect(() => {
    loadSessions();
    const interval = setInterval(loadSessions, 5000); // Poll every 5s
    return () => clearInterval(interval);
  }, []);

  // Load selected session state
  useEffect(() => {
    if (selectedSessionId) {
      loadSessionState(selectedSessionId);
    } else {
      setGameState(null);
    }
  }, [selectedSessionId]);

  async function loadSessions() {
    try {
      const res = await fetch("/api/simulator/state");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch (e) {
      console.error("Failed to load sessions", e);
    }
  }

  async function loadSessionState(sessionId: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/simulator/state?sessionId=${sessionId}`);
      if (res.ok) {
        const state = await res.json();
        setGameState(state);
      }
    } catch (e) {
      console.error("Failed to load session state", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateSession(cityId: string) {
    try {
      const res = await fetch("/api/simulator/state", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cityId }),
      });
      if (res.ok) {
        const state = await res.json();
        await loadSessions();
        setSelectedSessionId(state.sessionId);
        setGameState(state);
      }
    } catch (e) {
      console.error("Failed to create session", e);
    }
  }

  async function handleDeleteSession(sessionId: string) {
    try {
      await fetch("/api/simulator/state", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      await loadSessions();
      if (selectedSessionId === sessionId) {
        setSelectedSessionId(null);
        setGameState(null);
      }
    } catch (e) {
      console.error("Failed to delete session", e);
    }
  }

  async function handleNextPhase() {
    if (!selectedSessionId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/simulator/next", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selectedSessionId }),
      });
      if (res.ok) {
        const newState = await res.json();
        setGameState(newState);
        await loadSessions(); // Refresh session list
      }
    } catch (e) {
      console.error("Failed to advance phase", e);
    } finally {
      setLoading(false);
    }
  }

  async function handleChoice(choiceIds: string[]) {
    if (!selectedSessionId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/simulator/choose", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: selectedSessionId, choiceIds }),
      });
      if (res.ok) {
        const newState = await res.json();
        setGameState(newState);
        await loadSessions();
      }
    } catch (e) {
      console.error("Failed to submit choice", e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-black p-8">
      <div className="max-w-7xl mx-auto">
        <nav className="mb-8">
          <a
            href="/"
            className="text-amber-500 hover:text-amber-400 transition-colors"
          >
            &larr; Back to Home
          </a>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">
            Simulator Dashboard
          </h1>
          <p className="text-zinc-400">
            Admin interface for testing and debugging game sessions
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Session list sidebar */}
          <div className="lg:col-span-1 h-[calc(100vh-250px)]">
            <SessionList
              sessions={sessions}
              selectedId={selectedSessionId}
              onSelect={setSelectedSessionId}
              onDelete={handleDeleteSession}
              onCreate={handleCreateSession}
              isLoading={loading}
            />
          </div>

          {/* Game state view */}
          <div className="lg:col-span-3">
            {loading && !gameState ? (
              <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-8 text-center">
                <div className="text-zinc-400">Loading...</div>
              </div>
            ) : !gameState ? (
              <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-8 text-center">
                <div className="text-zinc-400">
                  Select a session or create a new one to begin
                </div>
              </div>
            ) : (
              <GameStateView
                state={gameState}
                onNextPhase={handleNextPhase}
                onChoice={handleChoice}
              />
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
