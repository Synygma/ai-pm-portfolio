import type { CSSProperties } from 'react';
import type { Feedback } from '@feedback-wall/shared';
import { formatRelativeTime } from '../lib/relativeTime';
import { NOTE_COLOR_CLASSES, noteTilt } from '../lib/noteStyle';
import { getRatingOption } from '../lib/ratings';

interface FeedbackCardProps {
  note: Feedback;
  now: Date;
}

export function FeedbackCard({ note, now }: FeedbackCardProps) {
  const createdAt = new Date(note.createdAt);
  const rating = getRatingOption(note.rating);

  return (
    <li
      className="motion-safe:animate-note-in"
      style={{ '--tilt': `${noteTilt(note.id)}deg` } as CSSProperties}
    >
      <article
        className={`flex min-h-44 flex-col justify-between gap-4 rounded-md p-5 text-slate-900 shadow-xl shadow-black/40 transition-transform duration-200 [transform:rotate(var(--tilt))] hover:[transform:rotate(0deg)_scale(1.03)] motion-reduce:transition-none ${NOTE_COLOR_CLASSES[note.color].card}`}
      >
        <div className="space-y-3">
          {rating && (
            <p
              className="inline-flex items-center gap-1.5 rounded-full bg-white/60 px-2.5 py-0.5 text-xs font-semibold text-slate-800"
              title={`Rated ${rating.value} of 5`}
            >
              <span aria-hidden="true">{rating.emoji}</span>
              {rating.label}
            </p>
          )}
          {/* Plain text only — React escapes it. Never render notes as HTML. */}
          <p className="font-note text-lg leading-snug break-words whitespace-pre-wrap">
            {note.message}
          </p>
        </div>
        <footer className="flex items-baseline justify-between gap-2 text-sm text-slate-700">
          <span className="truncate font-bold">{note.author}</span>
          <time dateTime={note.createdAt} title={createdAt.toLocaleString()} className="shrink-0">
            {formatRelativeTime(createdAt, now)}
          </time>
        </footer>
      </article>
    </li>
  );
}
