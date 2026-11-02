import { desc, lt } from 'drizzle-orm';
import {
  FEEDBACK_COLORS,
  type CreateFeedback,
  type Feedback,
  type FeedbackColor,
  type ListFeedbackQuery,
  type ListFeedbackResponse,
} from '@feedback-wall/shared';
import type { Db } from '../db/client.js';
import { feedback, type FeedbackRow } from '../db/schema.js';

function isFeedbackColor(value: string): value is FeedbackColor {
  return (FEEDBACK_COLORS as readonly string[]).includes(value);
}

function randomColor(): FeedbackColor {
  const index = Math.floor(Math.random() * FEEDBACK_COLORS.length);
  return FEEDBACK_COLORS[index] ?? FEEDBACK_COLORS[0];
}

/** Maps a DB row (snake_case columns, Date) to the API shape (camelCase, ISO string). */
export function toFeedback(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    message: row.message,
    author: row.author,
    color: isFeedbackColor(row.color) ? row.color : FEEDBACK_COLORS[0],
    rating: row.rating,
    createdAt: row.createdAt.toISOString(),
  };
}

export function createFeedbackService(db: Db) {
  return {
    /** Newest first. Fetches one extra row to know whether older notes exist. */
    list({ limit, before }: ListFeedbackQuery): ListFeedbackResponse {
      const rows = db
        .select()
        .from(feedback)
        .where(before === undefined ? undefined : lt(feedback.id, before))
        .orderBy(desc(feedback.id))
        .limit(limit + 1)
        .all();

      const hasMore = rows.length > limit;
      const items = rows.slice(0, limit).map(toFeedback);
      const last = items.at(-1);
      return { items, nextCursor: hasMore && last ? last.id : null };
    },

    create(input: CreateFeedback): Feedback {
      const row = db
        .insert(feedback)
        .values({
          message: input.message,
          author: input.author,
          color: input.color ?? randomColor(),
          rating: input.rating ?? null,
          createdAt: new Date(),
        })
        .returning()
        .get();
      return toFeedback(row);
    },
  };
}

export type FeedbackService = ReturnType<typeof createFeedbackService>;
