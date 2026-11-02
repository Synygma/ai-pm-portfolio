import { useId, useState, type FormEvent } from 'react';
import {
  AUTHOR_MAX_LENGTH,
  CreateFeedbackSchema,
  FEEDBACK_COLORS,
  MESSAGE_MAX_LENGTH,
  type CreateFeedbackInput,
  type Feedback,
  type FeedbackColor,
} from '@feedback-wall/shared';
import { ApiError, createFeedback } from '../api/feedbackApi';
import { NOTE_COLOR_CLASSES } from '../lib/noteStyle';
import { RatingScale } from './RatingScale';

type Field = 'message' | 'author' | 'color' | 'rating';
type FieldErrors = Partial<Record<Field, string>>;

const FIELDS: readonly Field[] = ['message', 'author', 'color', 'rating'];
const COUNTER_WARNING_THRESHOLD = 20;

const labelClass = 'text-sm font-semibold text-blue-700';
const inputClass =
  'block w-full rounded-xl border-2 border-slate-300 bg-white px-4 py-2.5 text-slate-900 placeholder:text-slate-400 transition focus:border-blue-600 focus:ring-4 focus:ring-blue-600/15 focus:outline-none aria-invalid:border-red-600';

function firstFieldErrors(fieldErrors: Record<string, string[] | undefined>): FieldErrors {
  const result: FieldErrors = {};
  for (const key of FIELDS) {
    const first = fieldErrors[key]?.[0];
    if (first) result[key] = first;
  }
  return result;
}

interface FeedbackFormProps {
  onPosted: (note: Feedback) => void;
}

export function FeedbackForm({ onPosted }: FeedbackFormProps) {
  const id = useId();
  const [message, setMessage] = useState('');
  const [author, setAuthor] = useState('');
  const [color, setColor] = useState<FeedbackColor | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const remaining = MESSAGE_MAX_LENGTH - message.length;
  const counterClass =
    remaining < 0
      ? 'text-red-700 font-semibold'
      : remaining <= COUNTER_WARNING_THRESHOLD
        ? 'text-amber-700'
        : 'text-slate-500';

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setSuccessMessage(null);

    const input: CreateFeedbackInput = {
      message,
      author,
      ...(color ? { color } : {}),
      ...(rating !== null ? { rating } : {}),
    };

    // Client-side validation is for UX only; the server validates again.
    const result = CreateFeedbackSchema.safeParse(input);
    if (!result.success) {
      const errors: Record<string, string[]> = {};
      for (const issue of result.error.issues) {
        const key = String(issue.path[0] ?? 'message');
        (errors[key] ??= []).push(issue.message);
      }
      setFieldErrors(firstFieldErrors(errors));
      return;
    }
    setFieldErrors({});

    setIsSubmitting(true);
    try {
      const note = await createFeedback(input);
      onPosted(note);
      setMessage('');
      setAuthor('');
      setColor(null);
      setRating(null);
      setSuccessMessage('Thanks! Your note is on the wall.');
    } catch (error) {
      if (error instanceof ApiError && error.code === 'RATE_LIMITED') {
        setFormError("You're posting too fast, try again in a minute.");
      } else if (error instanceof ApiError && error.code === 'VALIDATION_ERROR') {
        setFieldErrors(firstFieldErrors(error.fieldErrors));
        setFormError(Object.keys(error.fieldErrors).length === 0 ? error.message : null);
      } else if (error instanceof ApiError && error.code === 'NETWORK_ERROR') {
        setFormError(error.message);
      } else {
        setFormError("Couldn't post your note. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  const messageId = `${id}-message`;
  const authorId = `${id}-author`;
  const headingId = `${id}-heading`;

  return (
    <form
      onSubmit={handleSubmit}
      noValidate
      aria-labelledby={headingId}
      className="overflow-hidden rounded-2xl bg-slate-100 text-slate-900 shadow-2xl shadow-black/40 ring-1 ring-white/20"
    >
      <div className="flex items-center gap-3 bg-indigo-600 px-6 py-4 text-white">
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="size-5"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
        <h2 id={headingId} className="text-lg font-bold">
          Leave feedback
        </h2>
      </div>

      <div className="space-y-5 p-6">
        <div className="space-y-1.5">
          <label htmlFor={authorId} className={labelClass}>
            Name <span className="font-normal text-slate-500">(optional)</span>
          </label>
          <input
            id={authorId}
            type="text"
            value={author}
            onChange={(e) => setAuthor(e.target.value)}
            maxLength={AUTHOR_MAX_LENGTH}
            placeholder="Anonymous"
            autoComplete="nickname"
            aria-invalid={fieldErrors.author ? true : undefined}
            aria-describedby={fieldErrors.author ? `${authorId}-error` : undefined}
            className={inputClass}
          />
          {fieldErrors.author && (
            <p id={`${authorId}-error`} className="text-sm text-red-700">
              {fieldErrors.author}
            </p>
          )}
        </div>

        <RatingScale name={`${id}-rating`} value={rating} onChange={setRating} />
        {fieldErrors.rating && <p className="-mt-3 text-sm text-red-700">{fieldErrors.rating}</p>}

        <div className="space-y-1.5">
          <div className="flex items-baseline justify-between">
            <label htmlFor={messageId} className={labelClass}>
              Your comments
            </label>
            <span
              id={`${messageId}-counter`}
              className={`text-xs tabular-nums ${counterClass}`}
              aria-live="polite"
            >
              {remaining} characters left
            </span>
          </div>
          <textarea
            id={messageId}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
            placeholder="Add your comments…"
            aria-invalid={fieldErrors.message ? true : undefined}
            aria-describedby={`${messageId}-counter${fieldErrors.message ? ` ${messageId}-error` : ''}`}
            className={`${inputClass} resize-y`}
          />
          {fieldErrors.message && (
            <p id={`${messageId}-error`} className="text-sm text-red-700">
              {fieldErrors.message}
            </p>
          )}
        </div>

        <fieldset className="space-y-2">
          <legend className={labelClass}>
            Note color <span className="font-normal text-slate-500">(optional)</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            <ColorOption
              name={`${id}-color`}
              label="Random"
              checked={color === null}
              onSelect={() => setColor(null)}
              swatchClass="bg-[conic-gradient(var(--color-yellow-300),var(--color-pink-300),var(--color-sky-300),var(--color-lime-300),var(--color-violet-300),var(--color-orange-300),var(--color-yellow-300))]"
            />
            {FEEDBACK_COLORS.map((c) => (
              <ColorOption
                key={c}
                name={`${id}-color`}
                label={c}
                checked={color === c}
                onSelect={() => setColor(c)}
                swatchClass={NOTE_COLOR_CLASSES[c].swatch}
              />
            ))}
          </div>
          {fieldErrors.color && <p className="text-sm text-red-700">{fieldErrors.color}</p>}
        </fieldset>

        {formError && (
          <p className="rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-800" role="alert">
            {formError}
          </p>
        )}
        <p
          role="status"
          className={
            successMessage
              ? 'rounded-xl bg-teal-50 px-4 py-2.5 text-sm font-medium text-teal-800'
              : 'sr-only'
          }
        >
          {successMessage}
        </p>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-teal-600 px-4 py-3.5 text-sm font-bold tracking-[0.2em] text-white uppercase shadow-lg shadow-teal-900/25 transition hover:bg-teal-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Submitting…' : 'Submit'}
        </button>
      </div>
    </form>
  );
}

interface ColorOptionProps {
  name: string;
  label: string;
  checked: boolean;
  onSelect: () => void;
  swatchClass: string;
}

function ColorOption({ name, label, checked, onSelect, swatchClass }: ColorOptionProps) {
  return (
    <label className="cursor-pointer" title={label}>
      <input
        type="radio"
        name={name}
        value={label}
        checked={checked}
        onChange={onSelect}
        className="peer sr-only"
      />
      <span className="sr-only capitalize">{label}</span>
      <span
        aria-hidden="true"
        className={`block size-7 rounded-full ring-1 ring-slate-900/20 transition peer-checked:ring-2 peer-checked:ring-blue-700 peer-checked:ring-offset-2 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-blue-600 ${swatchClass}`}
      />
    </label>
  );
}
