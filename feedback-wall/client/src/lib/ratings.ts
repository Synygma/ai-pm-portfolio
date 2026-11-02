export interface RatingOption {
  value: number;
  emoji: string;
  label: string;
}

/** Experience scale shown in the form and on notes (1 = worst, 5 = best). */
export const RATING_OPTIONS: readonly RatingOption[] = [
  { value: 1, emoji: '😴', label: 'Bored' },
  { value: 2, emoji: '🙁', label: 'Not good' },
  { value: 3, emoji: '😐', label: 'Okay' },
  { value: 4, emoji: '🙂', label: 'Good' },
  { value: 5, emoji: '😍', label: 'Very nice' },
];

export function getRatingOption(value: number | null): RatingOption | undefined {
  return value === null ? undefined : RATING_OPTIONS.find((option) => option.value === value);
}
