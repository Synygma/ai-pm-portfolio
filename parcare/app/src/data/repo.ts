// Repository interfaces. Two adapters implement them: memory (./memory.ts) and Supabase
// (./supabase.ts). App code only ever talks to these interfaces.

import type { TableName, Tables } from "./types";

export type Where<T> = Partial<T>;

export type FindOptions<T> = {
  orderBy?: keyof T & string;
  desc?: boolean;
  limit?: number;
};

/** New row: id is optional (a UUID is generated when missing). */
export type NewRow<T extends { id: string }> = Omit<T, "id"> & { id?: string };

export interface Table<T extends { id: string }> {
  get(id: string): Promise<T | null>;
  /** Rows whose fields equal every value in `where` (null matches null). */
  find(where?: Where<T>, options?: FindOptions<T>): Promise<T[]>;
  findOne(where: Where<T>): Promise<T | null>;
  insert(row: NewRow<T>): Promise<T>;
  insertMany(rows: NewRow<T>[]): Promise<T[]>;
  update(id: string, patch: Partial<Omit<T, "id">>): Promise<T>;
  /**
   * Updates the row only if it still matches `expected` (compare-and-set). Returns the updated
   * row, or null if another run changed it first. Used by the scheduler, which can run twice at
   * the same moment (cron + open apps): only one run wins each step.
   */
  updateIf(id: string, expected: Where<T>, patch: Partial<Omit<T, "id">>): Promise<T | null>;
  /**
   * Inserts unless a row with the same values in `uniqueBy` exists (backed by a unique index in
   * Postgres). Returns the new row, or null if it already existed.
   */
  insertUnique(row: NewRow<T>, uniqueBy: (keyof T & string)[]): Promise<T | null>;
  remove(id: string): Promise<void>;
}

export type Repos = { [K in TableName]: Table<Tables[K]> };

export type DataMode = "memory" | "supabase";

/** Shared helpers for both adapters. */
export function matches<T>(row: T, where: Where<T>): boolean {
  return Object.entries(where).every(([k, v]) => {
    if (v === undefined) return true;
    return (row as Record<string, unknown>)[k] === v;
  });
}

export function sortRows<T>(rows: T[], options: FindOptions<T> = {}): T[] {
  const { orderBy, desc, limit } = options;
  let out = rows;
  if (orderBy) {
    out = [...rows].sort((a, b) => {
      const x = a[orderBy] as unknown as string | number | null;
      const y = b[orderBy] as unknown as string | number | null;
      if (x === y) return 0;
      if (x === null) return 1;
      if (y === null) return -1;
      return (x < y ? -1 : 1) * (desc ? -1 : 1);
    });
  }
  return limit === undefined ? out : out.slice(0, limit);
}
