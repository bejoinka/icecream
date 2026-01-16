import type { Metadata } from "next";
import Link from "next/link";

interface CityPageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { id } = await params;
  return {
    title: `City ${id} - Pulse Details`,
    description: `Detailed pulse information and neighborhood data for city ${id}.`,
  };
}

export default async function CityPage({ params }: CityPageProps) {
  const { id } = await params;

  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <nav className="mb-8">
        <Link
          href="/dashboard"
          className="text-blue-600 dark:text-blue-400 hover:underline"
        >
          &larr; Back to Dashboard
        </Link>
      </nav>

      <header className="mb-12">
        <h1 className="text-4xl font-bold mb-4">City: {id}</h1>
        <p className="text-xl text-gray-600 dark:text-gray-300">
          Pulse details and neighborhood breakdown.
        </p>
      </header>

      {/* Placeholder content */}
      <div className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          City pulse visualization and neighborhood data will be displayed here.
        </p>
      </div>
    </main>
  );
}
