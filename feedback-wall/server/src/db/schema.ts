import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const feedback = sqliteTable('feedback', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  message: text('message').notNull(),
  author: text('author').notNull().default('Anonymous'),
  color: text('color').notNull(),
  /** Optional 1–5 experience rating; NULL when not given. */
  rating: integer('rating'),
  createdAt: integer('created_at', { mode: 'timestamp_ms' }).notNull(),
});

export type FeedbackRow = typeof feedback.$inferSelect;
export type NewFeedbackRow = typeof feedback.$inferInsert;
