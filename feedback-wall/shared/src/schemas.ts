import { z } from 'zod';
import {
  AUTHOR_MAX_LENGTH,
  DEFAULT_AUTHOR,
  ERROR_CODES,
  FEEDBACK_COLORS,
  MESSAGE_MAX_LENGTH,
  MESSAGE_MIN_LENGTH,
  PAGE_SIZE_DEFAULT,
  PAGE_SIZE_MAX,
  RATING_MAX,
  RATING_MIN,
} from './constants.js';

export const FeedbackColorSchema = z.enum(FEEDBACK_COLORS, {
  error: 'Please pick one of the available colors.',
});

export const RatingSchema = z
  .number({ error: 'Rating must be a number.' })
  .int({ error: 'Rating must be a whole number.' })
  .min(RATING_MIN, { error: `Rating must be between ${RATING_MIN} and ${RATING_MAX}.` })
  .max(RATING_MAX, { error: `Rating must be between ${RATING_MIN} and ${RATING_MAX}.` });

/** Request body for POST /api/feedback. */
export const CreateFeedbackSchema = z.object({
  message: z
    .string({ error: 'Message is required.' })
    .trim()
    .min(MESSAGE_MIN_LENGTH, { error: 'Message cannot be empty.' })
    .max(MESSAGE_MAX_LENGTH, {
      error: `Message must be ${MESSAGE_MAX_LENGTH} characters or fewer.`,
    }),
  author: z
    .string({ error: 'Name must be text.' })
    .trim()
    .max(AUTHOR_MAX_LENGTH, { error: `Name must be ${AUTHOR_MAX_LENGTH} characters or fewer.` })
    .optional()
    .transform((value) => (value ? value : DEFAULT_AUTHOR)),
  color: FeedbackColorSchema.optional(),
  rating: RatingSchema.optional(),
});

/** Query string for GET /api/feedback. */
export const ListFeedbackQuerySchema = z.object({
  limit: z.coerce
    .number({ error: 'limit must be a number.' })
    .int({ error: 'limit must be an integer.' })
    .min(1, { error: 'limit must be at least 1.' })
    .max(PAGE_SIZE_MAX, { error: `limit must be at most ${PAGE_SIZE_MAX}.` })
    .default(PAGE_SIZE_DEFAULT),
  before: z.coerce
    .number({ error: 'before must be a number.' })
    .int({ error: 'before must be an integer.' })
    .positive({ error: 'before must be positive.' })
    .optional(),
});

export const FeedbackSchema = z.object({
  id: z.number().int().positive(),
  message: z.string(),
  author: z.string(),
  color: FeedbackColorSchema,
  rating: RatingSchema.nullable(),
  createdAt: z.iso.datetime(),
});

export const ListFeedbackResponseSchema = z.object({
  items: z.array(FeedbackSchema),
  nextCursor: z.number().int().positive().nullable(),
});

export const ErrorCodeSchema = z.enum([
  ERROR_CODES.VALIDATION_ERROR,
  ERROR_CODES.NOT_FOUND,
  ERROR_CODES.RATE_LIMITED,
  ERROR_CODES.INTERNAL_ERROR,
]);

export const ErrorResponseSchema = z.object({
  error: z.object({
    code: ErrorCodeSchema,
    message: z.string(),
    details: z
      .object({
        fieldErrors: z.record(z.string(), z.array(z.string())).optional(),
      })
      .optional(),
  }),
});

export type FeedbackColor = z.infer<typeof FeedbackColorSchema>;
/** What the client sends (before server-side defaults are applied). */
export type CreateFeedbackInput = z.input<typeof CreateFeedbackSchema>;
/** What the server works with after validation. */
export type CreateFeedback = z.output<typeof CreateFeedbackSchema>;
export type ListFeedbackQuery = z.output<typeof ListFeedbackQuerySchema>;
export type Feedback = z.infer<typeof FeedbackSchema>;
export type ListFeedbackResponse = z.infer<typeof ListFeedbackResponseSchema>;
export type ErrorCode = z.infer<typeof ErrorCodeSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
