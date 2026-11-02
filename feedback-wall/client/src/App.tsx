import { FeedbackForm } from './components/FeedbackForm';
import { FeedbackWall } from './components/FeedbackWall';
import { LiveIndicator } from './components/LiveIndicator';
import { useFeedbackWall } from './hooks/useFeedbackWall';

export function App() {
  const wall = useFeedbackWall();

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <header className="flex items-center justify-between gap-4 py-6">
        <div className="flex items-center gap-3">
          <span
            aria-hidden="true"
            className="flex size-10 -rotate-6 items-center justify-center rounded-lg bg-amber-300 text-lg font-black text-slate-900 shadow-lg shadow-amber-500/20"
          >
            F
          </span>
          <div className="leading-tight">
            <p className="text-lg font-bold text-white">Feedback Wall</p>
            <p className="text-xs text-slate-300">A live sticky-note board</p>
          </div>
        </div>
        <LiveIndicator status={wall.status} />
      </header>

      <section
        aria-labelledby="hero-heading"
        className="grid items-center gap-12 py-10 lg:grid-cols-[1fr_26rem] lg:gap-16 lg:py-16"
      >
        <div className="max-w-xl">
          <p className="mb-4 text-sm font-semibold tracking-[0.25em] text-amber-300 uppercase">
            Your voice, live
          </p>
          <h1
            id="hero-heading"
            className="text-5xl leading-[1.05] font-extrabold tracking-tight text-white sm:text-6xl lg:text-7xl"
          >
            Share your
            <br />
            feedback
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-slate-300">
            Feedback helps us improve our products, services and experiences. Leave a short note,
            rate how it went, and watch everyone&apos;s notes appear on the wall in real time.
          </p>
          <ul className="mt-8 flex flex-wrap gap-3 text-sm text-slate-200">
            {['No sign-up needed', 'Appears instantly', 'Up to 280 characters'].map((item) => (
              <li
                key={item}
                className="rounded-full bg-white/10 px-4 py-1.5 ring-1 ring-white/15 backdrop-blur"
              >
                {item}
              </li>
            ))}
          </ul>
        </div>

        <div className="relative">
          {/* Decorative stacked card behind the form, like a pile of forms. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 hidden translate-x-6 -translate-y-4 rotate-6 rounded-2xl bg-slate-200/70 shadow-2xl sm:block"
          />
          <div className="relative">
            <FeedbackForm onPosted={wall.addNote} />
          </div>
        </div>
      </section>

      <main className="pt-6 pb-20">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-2 border-b border-white/10 pb-4">
          <h2 id="wall-heading" className="text-2xl font-bold text-white sm:text-3xl">
            The wall
          </h2>
          <p className="text-sm text-slate-300">Newest notes first</p>
        </div>
        <FeedbackWall
          notes={wall.notes}
          isLoading={wall.isLoading}
          loadError={wall.loadError}
          onRetry={wall.retryLoad}
          hasOlder={wall.hasOlder}
          isLoadingOlder={wall.isLoadingOlder}
          olderError={wall.olderError}
          onLoadOlder={wall.loadOlder}
        />
      </main>
    </div>
  );
}
