import type { Feedback } from '@feedback-wall/shared';
import { useNow } from '../hooks/useNow';
import { FeedbackCard } from './FeedbackCard';

const RELATIVE_TIME_REFRESH_MS = 60_000;

interface FeedbackWallProps {
  notes: Feedback[];
  isLoading: boolean;
  loadError: string | null;
  onRetry: () => void;
  hasOlder: boolean;
  isLoadingOlder: boolean;
  olderError: string | null;
  onLoadOlder: () => void;
}

const buttonClass =
  'rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-slate-900 shadow-lg shadow-black/30 transition hover:bg-slate-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white disabled:cursor-not-allowed disabled:opacity-60';

export function FeedbackWall({
  notes,
  isLoading,
  loadError,
  onRetry,
  hasOlder,
  isLoadingOlder,
  olderError,
  onLoadOlder,
}: FeedbackWallProps) {
  const now = useNow(RELATIVE_TIME_REFRESH_MS);

  if (isLoading && notes.length === 0) {
    return <p className="py-16 text-center text-slate-300">Loading the wall…</p>;
  }

  if (loadError && notes.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16 text-center" role="alert">
        <p className="text-slate-200">{loadError}</p>
        <button type="button" onClick={onRetry} className={buttonClass}>
          Try again
        </button>
      </div>
    );
  }

  if (notes.length === 0) {
    return (
      <p className="py-16 text-center text-slate-300">
        The wall is empty. Be the first to leave a note!
      </p>
    );
  }

  return (
    <section aria-labelledby="wall-heading">
      <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
        {notes.map((note) => (
          <FeedbackCard key={note.id} note={note} now={now} />
        ))}
      </ul>

      {(hasOlder || olderError) && (
        <div className="mt-10 flex flex-col items-center gap-3">
          {olderError && (
            <p className="text-sm text-red-300" role="alert">
              {olderError}
            </p>
          )}
          {hasOlder && (
            <button
              type="button"
              onClick={onLoadOlder}
              disabled={isLoadingOlder}
              className={buttonClass}
            >
              {isLoadingOlder ? 'Loading…' : 'Load older notes'}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
