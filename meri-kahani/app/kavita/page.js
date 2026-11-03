// POEM page (/kavita): bright, playful colours, fun poem form.
import PoemForm from "../components/kavita/PoemForm";
import HomeButton from "../components/shared/HomeButton";
import PrivacyFooter from "../components/shared/PrivacyFooter";

export const metadata = {
  title: "Fun Poem — Meri Kahani",
  description: "A fun, rhyming poem starring your child, in English, Hindi or Marathi.",
};

export const viewport = {
  themeColor: "#fde047",
};

export default function KavitaPage() {
  return (
    <div className="theme-masti flex-1 text-ink">
      {/* Bright sunny background (covers the night sky of the rest of the site) */}
      <div
        aria-hidden="true"
        className="fixed inset-0 -z-10 bg-gradient-to-b from-yellow-200 via-orange-200 to-green-200"
      />

      <main className="relative mx-auto w-full max-w-md px-4 py-6">
        <HomeButton />

        <header className="mb-6 mt-4 text-center">
          <p className="text-5xl" aria-hidden="true">🎈🌈🎶</p>
          <h1 className="mt-2 text-4xl font-bold text-orange-700">🎉 Fun Poem</h1>
          <p className="mt-1 text-lg text-ink/80">
            A fun, rhyming poem starring your child!
          </p>
        </header>

        <PoemForm />

        <PrivacyFooter />
      </main>
    </div>
  );
}
