import { describe, expect, it } from 'vitest';
import { formatRelativeTime } from './relativeTime';
import { noteTilt } from './noteStyle';

const now = new Date('2026-11-02T12:00:00.000Z');
const ago = (seconds: number) => new Date(now.getTime() - seconds * 1000);

describe('formatRelativeTime', () => {
  it('shows "just now" for very recent notes', () => {
    expect(formatRelativeTime(ago(5), now)).toBe('just now');
    expect(formatRelativeTime(ago(44), now)).toBe('just now');
  });

  it('uses minutes, hours and days', () => {
    expect(formatRelativeTime(ago(120), now)).toMatch(/^2 min/);
    expect(formatRelativeTime(ago(3 * 3600), now)).toMatch(/^3 hr/);
    expect(formatRelativeTime(ago(24 * 3600), now)).toBe('yesterday');
    expect(formatRelativeTime(ago(3 * 24 * 3600), now)).toMatch(/^3 days/);
  });
});

describe('noteTilt', () => {
  it('is stable for the same id and within ±2 degrees', () => {
    for (let id = 1; id < 200; id++) {
      const tilt = noteTilt(id);
      expect(tilt).toBe(noteTilt(id));
      expect(Math.abs(tilt)).toBeLessThanOrEqual(2);
    }
  });
});
