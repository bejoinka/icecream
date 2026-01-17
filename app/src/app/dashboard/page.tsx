import type { Metadata } from "next";
import Link from "next/link";
import { getCities, CitySummary } from "@/lib/content";
import { PulseBar } from "@/components/dashboard/PulseBar";

export const metadata: Metadata = {
  title: "Dashboard - City Pulse Overview",
  description: "Monitor pulse levels and enforcement activity across all cities.",
};

function CityCard({ city }: { city: CitySummary }) {
  return (
    <Link
      href={`/dashboard/cities/${city.id}`}
      className="block bg-zinc-900 rounded-lg border border-zinc-700 p-4 hover:border-amber-600 transition-colors"
    >
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-100">{city.name}</h2>
        <span className="text-sm text-zinc-500">{city.state}</span>
      </div>

      <div className="space-y-1.5">
        <PulseBar
          label="Fed Coop"
          value={city.pulse.federalCooperation}
          color="red"
          compact
        />
        <PulseBar
          label="Data"
          value={city.pulse.dataDensity}
          color="amber"
          compact
        />
        <PulseBar
          label="Pol Cover"
          value={city.pulse.politicalCover}
          color="green"
          compact
        />
        <PulseBar
          label="Civil Soc"
          value={city.pulse.civilSocietyCapacity}
          color="blue"
          compact
        />
        <PulseBar
          label="Inertia"
          value={city.pulse.bureaucraticInertia}
          color="amber"
          compact
        />
      </div>
    </Link>
  );
}

export default async function DashboardPage() {
  const cities = await getCities();

  return (
    <main className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <nav className="mb-8">
          <Link
            href="/"
            className="text-amber-500 hover:text-amber-400 transition-colors"
          >
            &larr; Back to Home
          </Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100 mb-2">
            City Dashboard
          </h1>
          <p className="text-zinc-400">
            Monitor pulse levels and enforcement patterns across {cities.length}{" "}
            cities.
          </p>
        </header>

        {/* Legend */}
        <div className="mb-8 p-4 bg-zinc-900 rounded-lg border border-zinc-800">
          <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
            Pulse Metrics
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-xs">
            <div>
              <span className="text-red-500 font-medium">Fed Coop</span>
              <p className="text-zinc-500">Federal cooperation level</p>
            </div>
            <div>
              <span className="text-amber-500 font-medium">Data</span>
              <p className="text-zinc-500">Data system integration</p>
            </div>
            <div>
              <span className="text-green-500 font-medium">Pol Cover</span>
              <p className="text-zinc-500">Political protection</p>
            </div>
            <div>
              <span className="text-blue-500 font-medium">Civil Soc</span>
              <p className="text-zinc-500">Civil society capacity</p>
            </div>
            <div>
              <span className="text-amber-500 font-medium">Inertia</span>
              <p className="text-zinc-500">Bureaucratic slowdown</p>
            </div>
          </div>
        </div>

        {/* Cities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cities.map((city) => (
            <CityCard key={city.id} city={city} />
          ))}
        </div>
      </div>
    </main>
  );
}
