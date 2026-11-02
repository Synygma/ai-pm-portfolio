import type { FeedbackColor } from '@feedback-wall/shared';

/**
 * Tailwind classes per note color. Light backgrounds + near-black text keep
 * contrast well above WCAG AA on every color. Class names must stay literal
 * so Tailwind can detect them.
 */
export const NOTE_COLOR_CLASSES: Record<FeedbackColor, { card: string; swatch: string }> = {
  yellow: { card: 'bg-yellow-200', swatch: 'bg-yellow-300' },
  pink: { card: 'bg-pink-200', swatch: 'bg-pink-300' },
  blue: { card: 'bg-sky-200', swatch: 'bg-sky-300' },
  green: { card: 'bg-lime-200', swatch: 'bg-lime-300' },
  purple: { card: 'bg-violet-200', swatch: 'bg-violet-300' },
  orange: { card: 'bg-orange-200', swatch: 'bg-orange-300' },
};

const MAX_TILT_DEGREES = 2;

/** Stable pseudo-random tilt derived from the note id, so cards don't jiggle on re-render. */
export function noteTilt(id: number): number {
  const hash = Math.sin(id * 12.9898) * 43758.5453;
  const unit = hash - Math.floor(hash); // 0..1
  return Number(((unit * 2 - 1) * MAX_TILT_DEGREES).toFixed(2));
}
