// HOME page (/): welcome title and two big cards — Bedtime Story or Fun Poem.
import Link from "next/link";
import PrivacyFooter from "./components/shared/PrivacyFooter";

export default function Home() {
  return (
    <div className="flex-1 text-starlight">
      {/* Twinkling stars in the background */}
      <div className="stars" aria-hidden="true" />

      <main className="relative z-10 mx-auto w-full max-w-md px-4 py-10">
        <header className="mb-8 text-center">
          {/* The moon */}
          <div
            aria-hidden="true"
            className="mx-auto mb-3 h-16 w-16 rounded-full bg-moon shadow-[0_0_40px_10px_rgba(253,230,138,0.35)]"
          />
          <h1 className="text-5xl font-bold text-moon">Meri Kahani</h1>
          <p className="mt-2 text-xl text-starlight/80">
            What shall we make today? ✨
          </p>
        </header>

        <nav className="grid gap-5" aria-label="Choose">
          {/* Story card: calm night colours */}
          <Link
            href="/kahani"
            className="block rounded-3xl border-2 border-moon/40 bg-dusk/80 p-6 text-center shadow-xl transition active:scale-[0.98] hover:border-moon focus:outline-none focus-visible:ring-4 focus-visible:ring-moon/60"
          >
            <span className="block text-6xl" aria-hidden="true">📖</span>
            <span className="mt-2 block text-3xl font-bold text-moon">Bedtime Story</span>
            <span className="mt-1 block text-lg text-starlight/80">
              A calm story for sleep 🌙
            </span>
          </Link>

          {/* Poem card: bright playful colours */}
          <Link
            href="/kavita"
            className="block rounded-3xl bg-gradient-to-br from-yellow-300 via-orange-300 to-green-300 p-6 text-center text-[#3b2a0a] shadow-xl transition active:scale-[0.98] hover:brightness-105 focus:outline-none focus-visible:ring-4 focus-visible:ring-yellow-200"
          >
            <span className="block text-6xl" aria-hidden="true">🎉</span>
            <span className="mt-2 block text-3xl font-bold text-orange-800">Fun Poem</span>
            <span className="mt-1 block text-lg">A rhyming poem to play with 🎶</span>
          </Link>
        </nav>

        <PrivacyFooter />
      </main>
    </div>
  );
}
