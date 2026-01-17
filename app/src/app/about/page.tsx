import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "About - What is ICE Cream?",
  description:
    "A darkly satirical survival RPG exploring how modern bureaucratic power transforms ordinary life into risk.",
};

export default function AboutPage() {
  return (
    <main className="min-h-screen p-8 max-w-4xl mx-auto">
      <nav className="mb-8">
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          &larr; Back to Home
        </Link>
      </nav>

      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">What is ICE Cream?</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          A darkly satirical survival RPG about keeping a family together while
          invisible forces quietly turn everyday life into risk.
        </p>
      </header>

      {/* The Game */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">The Game</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          You manage a family navigating modern U.S. cities under escalating
          enforcement pressure. Each turn, you allocate effort, respond to
          events, and make choices that ripple through nested systems of power.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          The world operates through pressure. National policy sets the weather.
          Cities interpret and translate. Neighborhoods express consequences.
          Your family absorbs the impact.
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          Survival, sanctuary, and transformation are all possible outcomes. The
          game is designed to be won. But every choice has costs, and the
          margins are thin.
        </p>
      </section>

      {/* Design Philosophy */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Design Philosophy</h2>

        <div className="space-y-6">
          <div>
            <h3 className="font-semibold mb-2">Satire punches up.</h3>
            <p className="text-gray-700 dark:text-gray-300">
              The game critiques systems, bureaucracy, and power—never the
              people trapped inside them. When something absurd happens, the
              absurdity belongs to the institution, not the individual.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">
              Educational, not instructional.
            </h3>
            <p className="text-gray-700 dark:text-gray-300">
              The game teaches that rights exist, what tradeoffs look like, and
              how systems create consequences. It does not teach real-world
              tactics. This is a mirror, not a manual.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Failure feels structural.</h3>
            <p className="text-gray-700 dark:text-gray-300">
              When things go wrong, the game frames it politically—as the system
              working as designed—not as personal incompetence. You are not bad
              at the game. The game is about systems that grind people down.
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Opacity by design.</h3>
            <p className="text-gray-700 dark:text-gray-300">
              Players experience consequences before causes. The world does not
              explain itself. This reflects how bureaucratic power actually
              operates: opaquely, arbitrarily, and without regard for individual
              understanding.
            </p>
          </div>
        </div>
      </section>

      {/* Inspirations */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Inspirations</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          This game stands in a tradition of work that uses systems to generate
          empathy:
        </p>
        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
          <li>
            <strong>Papers, Please</strong> — the bureaucrat&apos;s dilemma,
            complicity through participation
          </li>
          <li>
            <strong>This War of Mine</strong> — civilian survival under
            structural pressure
          </li>
          <li>
            <strong>Disco Elysium</strong> — systems as character, failure as
            revelation
          </li>
          <li>
            <strong>Oregon Trail</strong> — resource management as narrative
            engine
          </li>
        </ul>
      </section>

      {/* What This Is Not */}
      <section className="mb-12 bg-gray-50 dark:bg-gray-900 rounded-lg p-8">
        <h2 className="text-2xl font-semibold mb-4">What This Is Not</h2>
        <ul className="space-y-3 text-gray-700 dark:text-gray-300">
          <li>
            <strong>Not a tactical stealth game.</strong> You are not evading
            detection. You are navigating systems.
          </li>
          <li>
            <strong>Not a real-world how-to guide.</strong> This game does not
            provide actionable advice for immigration situations. See our{" "}
            <Link
              href="/resources"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Resources
            </Link>{" "}
            page for actual legal information.
          </li>
          <li>
            <strong>Not a power fantasy.</strong> You are inside the system, not
            above it.
          </li>
          <li>
            <strong>Not morally neutral.</strong> The game has a perspective
            about systems of harm. It does not pretend otherwise.
          </li>
        </ul>
      </section>

      {/* Why This Game */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Why This Game</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Games are systems that generate experience. When designed carefully,
          they can create understanding that lectures and statistics cannot.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          This game asks a question: what does it feel like when ordinary
          life—going to work, sending kids to school, visiting the
          doctor—becomes risk? And what happens to people who must live inside
          that question every day?
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          The answer is not comfortable. That is the point.
        </p>
      </section>

      <footer className="text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-8">
        <p>
          For legal resources and real-world information, please visit our{" "}
          <Link
            href="/resources"
            className="text-blue-600 dark:text-blue-400 hover:underline"
          >
            Resources
          </Link>{" "}
          page. This game is not a substitute for professional legal advice.
        </p>
      </footer>
    </main>
  );
}
