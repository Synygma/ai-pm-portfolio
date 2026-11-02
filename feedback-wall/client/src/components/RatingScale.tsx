import { RATING_MAX, RATING_MIN } from '@feedback-wall/shared';
import { RATING_OPTIONS } from '../lib/ratings';

interface RatingScaleProps {
  name: string;
  value: number | null;
  onChange: (value: number | null) => void;
}

/** Emoji experience scale (radio group) with a decorative progress track underneath. */
export function RatingScale({ name, value, onChange }: RatingScaleProps) {
  const progress = value === null ? 0 : ((value - RATING_MIN) / (RATING_MAX - RATING_MIN)) * 100;

  return (
    <fieldset className="space-y-3">
      <div className="flex items-baseline justify-between">
        <legend className="text-sm font-semibold text-blue-700">
          Rate your experience <span className="font-normal text-slate-500">(optional)</span>
        </legend>
        {value !== null && (
          <button
            type="button"
            onClick={() => onChange(null)}
            className="rounded text-xs font-medium text-slate-500 underline-offset-2 hover:text-slate-800 hover:underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
          >
            Clear
          </button>
        )}
      </div>

      <div className="grid grid-cols-5 gap-1">
        {RATING_OPTIONS.map((option) => {
          const checked = option.value === value;
          return (
            <label
              key={option.value}
              className="group flex cursor-pointer flex-col items-center gap-1"
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="peer sr-only"
              />
              <span
                aria-hidden="true"
                className={`flex size-11 items-center justify-center rounded-full text-2xl transition duration-200 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-blue-600 motion-reduce:transition-none ${
                  checked
                    ? 'scale-115 bg-amber-100 shadow-md ring-2 ring-amber-400'
                    : 'bg-white opacity-60 grayscale group-hover:opacity-100 group-hover:grayscale-0'
                }`}
              >
                {option.emoji}
              </span>
              <span
                className={`text-center text-[11px] leading-tight ${
                  checked ? 'font-bold text-slate-900' : 'text-slate-500'
                }`}
              >
                {option.label}
              </span>
            </label>
          );
        })}
      </div>

      <div aria-hidden="true" className="relative mx-5 h-1.5 rounded-full bg-slate-300">
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-teal-500 transition-[width] duration-300 motion-reduce:transition-none"
          style={{ width: `${progress}%` }}
        />
        {value !== null && (
          <div
            className="absolute top-1/2 size-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-teal-600 shadow transition-[left] duration-300 motion-reduce:transition-none"
            style={{ left: `${progress}%` }}
          />
        )}
      </div>
    </fieldset>
  );
}
