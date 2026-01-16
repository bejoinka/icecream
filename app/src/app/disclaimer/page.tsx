import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Disclaimer - Important Information",
  description:
    "Important disclaimer about the fictional nature of ICE Cream and the separation between gameplay and real-world advice.",
};

export default function DisclaimerPage() {
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
        <h1 className="text-4xl font-bold mb-4">Disclaimer</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Important information about the nature of this game and its
          relationship to real-world situations.
        </p>
      </header>

      {/* Primary Disclaimer */}
      <section className="mb-12 bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-8">
        <h2 className="text-2xl font-bold text-amber-800 dark:text-amber-200 mb-4">
          This Is Not Legal Advice
        </h2>
        <p className="text-amber-700 dark:text-amber-300 mb-4">
          ICE Cream is a work of fiction. Nothing in this game constitutes legal
          advice. The game does not provide, and should not be interpreted as
          providing, guidance for real-world immigration situations.
        </p>
        <p className="text-amber-700 dark:text-amber-300">
          If you or someone you know is facing immigration-related challenges,
          please consult with a qualified immigration attorney or accredited
          representative. See our{" "}
          <Link
            href="/resources"
            className="underline font-medium hover:text-amber-900 dark:hover:text-amber-100"
          >
            Resources
          </Link>{" "}
          page for directories of legal assistance.
        </p>
      </section>

      {/* Nature of the Game */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          Fictional Work, Not a Guide
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          This game is a satirical, narrative experience. It uses abstracted
          game mechanics to explore systemic themes. The situations, choices,
          and outcomes depicted are designed for educational and artistic
          purposes, not practical application.
        </p>
        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
          <li>
            Game mechanics are simplified representations, not accurate
            simulations of legal processes.
          </li>
          <li>
            Outcomes in the game do not reflect the likelihood of real-world
            outcomes.
          </li>
          <li>
            Strategies that work in the game may have no relevance to real-world
            situations.
          </li>
          <li>
            The game intentionally does not teach real-world evasion tactics or
            procedural instructions.
          </li>
        </ul>
      </section>

      {/* Historical Grounding */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">
          Fictionalized Events, Historical Precedent
        </h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          Events, locations, and scenarios in this game are fictionalized. They
          are, however, grounded in documented historical precedent and
          real-world patterns of enforcement, policy, and community response.
        </p>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          This grounding is intentional. The game aims to illuminate systemic
          dynamics, not to depict specific real events or predict future ones.
          Any resemblance to specific individuals or incidents is coincidental.
        </p>
        <p className="text-gray-700 dark:text-gray-300">
          The game&apos;s near-future setting (circa 2026) extrapolates from
          observable trends but does not represent a prediction or projection of
          actual policy developments.
        </p>
      </section>

      {/* Educational Intent */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">Educational Intent</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          The purpose of this game is educational and artistic:
        </p>
        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
          <li>
            <strong>To illustrate</strong> how systemic pressures operate
            through nested layers of policy, enforcement, and community response
          </li>
          <li>
            <strong>To communicate</strong> that legal rights exist, even if
            asserting them carries costs
          </li>
          <li>
            <strong>To create empathy</strong> through simulated experience of
            structural uncertainty
          </li>
          <li>
            <strong>To critique</strong> bureaucratic systems that transform
            ordinary life into risk
          </li>
        </ul>
        <p className="text-gray-700 dark:text-gray-300 mt-4">
          The game does not aim to instruct players on how to navigate
          real-world enforcement, evade detection, or circumvent legal
          processes.
        </p>
      </section>

      {/* Content Warning */}
      <section className="mb-12 bg-gray-50 dark:bg-gray-900 rounded-lg p-8">
        <h2 className="text-2xl font-semibold mb-4">Content Advisory</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          This game contains themes that some players may find distressing:
        </p>
        <ul className="list-disc list-inside text-gray-700 dark:text-gray-300 space-y-2">
          <li>Immigration enforcement and family separation</li>
          <li>Bureaucratic systems that create uncertainty and hardship</li>
          <li>Economic precarity and community disruption</li>
          <li>References to detention and deportation</li>
        </ul>
        <p className="text-gray-700 dark:text-gray-300 mt-4">
          The game handles these themes with restraint and implication rather
          than graphic depiction. However, players with direct personal
          experience of immigration enforcement may find the content
          emotionally difficult.
        </p>
      </section>

      {/* Real Resources */}
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">For Real Situations</h2>
        <p className="text-gray-700 dark:text-gray-300 mb-4">
          If you are seeking information about real-world immigration rights,
          legal resources, or community support, please visit:
        </p>
        <div className="flex gap-4">
          <Link
            href="/resources"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Legal Resources
          </Link>
        </div>
        <p className="text-gray-700 dark:text-gray-300 mt-4">
          Our Resources page provides links to verified organizations, legal
          directories, and know-your-rights guides. These resources are provided
          for informational purposes only and do not constitute legal advice.
        </p>
      </section>

      <footer className="text-sm text-gray-500 dark:text-gray-400 border-t border-gray-200 dark:border-gray-700 pt-8">
        <p className="mb-4">
          <strong>Summary:</strong> This is a game. It is not legal advice, not
          a how-to guide, and not a prediction of real events. For real
          situations, consult real professionals.
        </p>
        <p>
          By playing this game, you acknowledge that you understand its
          fictional and educational nature.
        </p>
      </footer>
    </main>
  );
}
