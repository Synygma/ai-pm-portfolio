import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** `server/` directory — same relative position from `src/` (dev) and `dist/` (prod). */
export const SERVER_ROOT = fileURLToPath(new URL('..', import.meta.url));

/** Built client served in production. */
export const CLIENT_DIST_DIR = resolve(SERVER_ROOT, '../client/dist');

/** Drizzle migrations folder (committed). */
export const MIGRATIONS_DIR = resolve(SERVER_ROOT, 'drizzle');

function readInt(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === '') return fallback;
  const value = Number.parseInt(raw, 10);
  if (Number.isNaN(value) || value < 0) {
    throw new Error(`Environment variable ${name} must be a non-negative integer, got "${raw}".`);
  }
  return value;
}

export const config = {
  port: readInt('PORT', 3001),
  databasePath: resolve(SERVER_ROOT, process.env.DATABASE_PATH ?? './data/feedback.db'),
  isProduction: process.env.NODE_ENV === 'production',
  /** Number of trusted reverse proxies in front of the app (0 = none). */
  trustProxy: readInt('TRUST_PROXY', 0),
} as const;
