import type { Feedback } from '@feedback-wall/shared';

/**
 * Merges notes into a list, deduped by `id`, sorted newest first.
 * Incoming notes replace existing ones with the same id.
 */
export function mergeFeedback(
  existing: readonly Feedback[],
  incoming: readonly Feedback[],
): Feedback[] {
  if (incoming.length === 0) return existing as Feedback[];
  const byId = new Map<number, Feedback>();
  for (const note of existing) byId.set(note.id, note);
  for (const note of incoming) byId.set(note.id, note);
  return [...byId.values()].sort((a, b) => b.id - a.id);
}
