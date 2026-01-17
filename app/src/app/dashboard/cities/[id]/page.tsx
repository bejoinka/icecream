/**
 * City Detail Page
 *
 * Individual city profile with pulse visualization and neighborhoods.
 */

interface CityPageProps {
  params: {
    id: string;
  };
}

export default function CityPage({ params }: CityPageProps) {
  const { id } = params;

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="container mx-auto px-8 py-16">
        <h1 className="text-4xl font-bold">City: {id}</h1>
        <p className="mt-4 text-gray-400">
          City profile and neighborhood data will appear here.
        </p>
      </main>
    </div>
  );
}
