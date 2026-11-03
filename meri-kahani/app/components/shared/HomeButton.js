import Link from "next/link";

// Small "← Home" button shown at the top of the Kahani and Kavita pages.
export default function HomeButton() {
  return (
    <Link
      href="/"
      className="inline-flex items-center gap-1 rounded-full border border-line bg-field/60 px-4 py-2 text-lg font-semibold text-ink transition active:scale-[0.97] focus:outline-none focus-visible:ring-4 focus-visible:ring-accent/50"
    >
      ← Home
    </Link>
  );
}
