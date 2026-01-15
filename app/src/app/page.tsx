import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-black text-white">
      <main className="flex flex-col items-center justify-center gap-12 px-8 py-16">
        {/* Banner */}
        <div className="text-center">
          <h1 className="text-6xl sm:text-8xl font-bold tracking-tight">
            <span className="text-blue-400">ICE</span>{" "}
            <span className="text-white">CREAM</span>
          </h1>
          <p className="mt-4 text-lg text-gray-400">
            A dark satirical survival RPG
          </p>
        </div>

        {/* Play Button */}
        <Link
          href="/play"
          className="px-12 py-4 text-xl font-bold bg-white text-black rounded-full hover:bg-gray-200 transition-colors"
        >
          PLAY NOW
        </Link>
      </main>

      {/* Footer Links */}
      <footer className="absolute bottom-8 flex gap-8 text-sm text-gray-500">
        <Link href="/about" className="hover:text-white transition-colors">
          What is ICE Cream?
        </Link>
        <Link href="/resources" className="hover:text-white transition-colors">
          Legal
        </Link>
        <Link href="/support" className="hover:text-white transition-colors">
          Donate
        </Link>
      </footer>
    </div>
  );
}
