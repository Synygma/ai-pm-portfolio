// camelCase (TypeScript) <-> snake_case (Postgres). Only top-level keys are converted, so the
// contents of jsonb columns (digest items, alert data, ...) are stored exactly as given.

export function camelToSnake(key: string): string {
  return key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
}

export function snakeToCamel(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_, c: string) => c.toUpperCase());
}

/** Timestamp columns come back from Postgres as "...+00:00"; normalise them to ISO "...Z". */
function isTimestampColumn(snakeKey: string): boolean {
  return snakeKey.endsWith("_at") || snakeKey === "period_start" || snakeKey === "period_end";
}

export function toSnakeRow(row: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) if (v !== undefined) out[camelToSnake(k)] = v;
  return out;
}

export function toCamelRow<T>(row: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(row)) {
    out[snakeToCamel(k)] = isTimestampColumn(k) && typeof v === "string" ? new Date(v).toISOString() : v;
  }
  return out as T;
}
