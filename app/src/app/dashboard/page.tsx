import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Dashboard - City Pulse Overview",
  description: "Monitor pulse levels and enforcement activity across all cities.",
};

export default function DashboardPage() {
  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <nav className="mb-8">
        <Link
          href="/"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          &larr; Back to Home
        </Link>
      </nav>

      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">City Dashboard</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Monitor pulse levels and enforcement patterns across all cities.
        </p>
      </header>

      {/* Placeholder content */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Cities list will be displayed here.
        </p>
      </div>
    </main>
  );
}
