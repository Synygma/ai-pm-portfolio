// STORY page (/kahani): calm night sky, bedtime story form.
import StoryForm from "../components/kahani/StoryForm";
import HomeButton from "../components/shared/HomeButton";
import PrivacyFooter from "../components/shared/PrivacyFooter";

export const metadata = {
  title: "Bedtime Story — Meri Kahani",
  description: "A bedtime story where your child is the hero, in English, Hindi or Marathi.",
};

export default function KahaniPage() {
  return (
    <div className="theme-night flex-1 text-starlight">
      {/* Twinkling stars in the background */}
      <div className="stars" aria-hidden="true" />

      <main className="relative z-10 mx-auto w-full max-w-md px-4 py-6">
        <HomeButton />

        <header className="mb-6 mt-4 text-center">
          {/* The moon */}
          <div
            aria-hidden="true"
            className="mx-auto mb-3 h-16 w-16 rounded-full bg-moon shadow-[0_0_40px_10px_rgba(253,230,138,0.35)]"
          />
          <h1 className="text-4xl font-bold text-moon">📖 Bedtime Story</h1>
          <p className="mt-1 text-lg text-starlight/80">
            A bedtime story where your child is the hero ✨
          </p>
        </header>

        <StoryForm />

        <PrivacyFooter />
      </main>
    </div>
  );
}
