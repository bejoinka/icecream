import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCityIds, getCityWithNeighborhoods } from "@/lib/content";
import { PulseBar } from "@/components/dashboard/PulseBar";
import type { NeighborhoodRow } from "@/types/database";

interface CityPageProps {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  const ids = await getCityIds();
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({
  params,
}: CityPageProps): Promise<Metadata> {
  const { id } = await params;
  const city = await getCityWithNeighborhoods(id);

  if (!city) {
    return { title: "City Not Found" };
  }

  return {
    title: `${city.name}, ${city.state} - City Pulse Details`,
    description: `Pulse metrics and neighborhood data for ${city.name}, ${city.state}.`,
  };
}

function NeighborhoodCard({ neighborhood }: { neighborhood: NeighborhoodRow }) {
  return (
    <div className="bg-zinc-900 rounded-lg border border-zinc-700 p-4">
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-zinc-100">
          {neighborhood.name}
        </h3>
        <p className="text-sm text-zinc-400 mt-1">{neighborhood.description}</p>
      </div>

      <div className="space-y-1.5">
        <PulseBar
          label="Trust"
          value={neighborhood.pulse.trust}
          color="green"
          compact
        />
        <PulseBar
          label="Suspicion"
          value={neighborhood.pulse.suspicion}
          color="red"
          compact
        />
        <PulseBar
          label="Enforcement"
          value={neighborhood.pulse.enforcementVisibility}
          color="red"
          compact
        />
        <PulseBar
          label="Community"
          value={neighborhood.pulse.communityDensity}
          color="blue"
          compact
        />
        <PulseBar
          label="Precarity"
          value={neighborhood.pulse.economicPrecarity}
          color="amber"
          compact
        />
      </div>
    </div>
  );
}

export default async function CityPage({ params }: CityPageProps) {
  const { id } = await params;
  const city = await getCityWithNeighborhoods(id);

  if (!city) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-black p-8">
      <div className="max-w-6xl mx-auto">
        <nav className="mb-8">
          <Link
            href="/dashboard"
            className="text-amber-500 hover:text-amber-400 transition-colors"
          >
            &larr; Back to Dashboard
          </Link>
        </nav>

        <header className="mb-8">
          <h1 className="text-3xl font-bold text-zinc-100">
            {city.name}
            <span className="text-zinc-500 ml-2">{city.state}</span>
          </h1>
        </header>

        {/* City Overview */}
        <section className="mb-8 bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Overview
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed whitespace-pre-line">
            {city.overview}
          </p>
        </section>

        {/* City Pulse */}
        <section className="mb-8 bg-zinc-900 rounded-lg border border-zinc-800 p-6">
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            City Pulse
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <PulseBar
                label="Federal Cooperation"
                value={city.pulse.federalCooperation}
                color="red"
              />
            </div>
            <div>
              <PulseBar
                label="Data Density"
                value={city.pulse.dataDensity}
                color="amber"
              />
            </div>
            <div>
              <PulseBar
                label="Political Cover"
                value={city.pulse.politicalCover}
                color="green"
              />
            </div>
            <div>
              <PulseBar
                label="Civil Society"
                value={city.pulse.civilSocietyCapacity}
                color="blue"
              />
            </div>
            <div>
              <PulseBar
                label="Bureaucratic Inertia"
                value={city.pulse.bureaucraticInertia}
                color="amber"
              />
            </div>
          </div>
        </section>

        {/* Playability Rationale */}
        <section className="mb-8 bg-zinc-900 rounded-lg border border-amber-900/50 p-6">
          <h2 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-4">
            Why Play Here?
          </h2>
          <p className="text-zinc-300 text-sm leading-relaxed">
            {city.playability_rationale}
          </p>
        </section>

        {/* Neighborhoods */}
        <section>
          <h2 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-4">
            Neighborhoods ({city.neighborhoods.length})
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {city.neighborhoods.map((neighborhood) => (
              <NeighborhoodCard
                key={neighborhood.id}
                neighborhood={neighborhood}
              />
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}
