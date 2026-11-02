import { describe, expect, it } from 'vitest';
import type { Feedback } from '@feedback-wall/shared';
import { mergeFeedback } from './mergeFeedback';

function note(id: number, message = `note ${id}`): Feedback {
  return {
    id,
    message,
    author: 'Anonymous',
    color: 'yellow',
    rating: null,
    createdAt: new Date(id).toISOString(),
  };
}

describe('mergeFeedback', () => {
  it('prepends new notes and keeps newest first', () => {
    expect(mergeFeedback([note(2), note(1)], [note(3)]).map((n) => n.id)).toEqual([3, 2, 1]);
  });

  it('dedupes by id (e.g. POST response + SSE event for the same note)', () => {
    const merged = mergeFeedback([note(3), note(2)], [note(3), note(3)]);
    expect(merged.map((n) => n.id)).toEqual([3, 2]);
  });

  it('appends older pages in order', () => {
    expect(mergeFeedback([note(5), note(4)], [note(3), note(2)]).map((n) => n.id)).toEqual([
      5, 4, 3, 2,
    ]);
  });

  it('fills gaps after a reconnect refetch', () => {
    const merged = mergeFeedback([note(5), note(2)], [note(6), note(5), note(4), note(3)]);
    expect(merged.map((n) => n.id)).toEqual([6, 5, 4, 3, 2]);
  });

  it('returns the same array when there is nothing to merge', () => {
    const existing = [note(1)];
    expect(mergeFeedback(existing, [])).toBe(existing);
  });
});
