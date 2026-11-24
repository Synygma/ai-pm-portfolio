// In-memory adapter: used by tests and whenever Supabase keys are missing. In development the
// data is also saved to .data/dev-db.json so it survives restarts (delete it with
// `npm run db:reset`). It has no row-level security, so app code must always scope queries
// by household (the data-access layer in ./access.ts does).

import { randomUUID } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { type FindOptions, matches, type NewRow, type Repos, sortRows, type Table, type Where } from "./repo";
import { type DbSnapshot, TABLE_NAMES, type TableName } from "./types";

export function emptySnapshot(): DbSnapshot {
  const snap = { version: 1, authUsers: [] } as unknown as DbSnapshot;
  for (const name of TABLE_NAMES) (snap as unknown as Record<string, unknown[]>)[name] = [];
  return snap;
}

export class MemoryStore {
  constructor(
    public snapshot: DbSnapshot,
    private readonly onChange?: (snapshot: DbSnapshot) => void,
  ) {}

  rows<K extends TableName>(name: K): DbSnapshot[K] {
    return this.snapshot[name];
  }

  changed(): void {
    this.onChange?.(this.snapshot);
  }

  /** Replace all data (seed / reset). */
  replace(snapshot: DbSnapshot): void {
    this.snapshot = snapshot;
    this.changed();
  }
}

const clone = <T>(v: T): T => structuredClone(v);

class MemoryTable<T extends { id: string }> implements Table<T> {
  constructor(
    private readonly store: MemoryStore,
    private readonly name: TableName,
  ) {}

  private get list(): T[] {
    return this.store.rows(this.name) as unknown as T[];
  }

  async get(id: string) {
    const row = this.list.find((r) => r.id === id);
    return row ? clone(row) : null;
  }

  async find(where: Where<T> = {}, options?: FindOptions<T>) {
    return sortRows(this.list.filter((r) => matches(r, where)), options).map(clone);
  }

  async findOne(where: Where<T>) {
    const row = this.list.find((r) => matches(r, where));
    return row ? clone(row) : null;
  }

  async insert(row: NewRow<T>) {
    const [inserted] = await this.insertMany([row]);
    return inserted;
  }

  async insertMany(rows: NewRow<T>[]) {
    const created = rows.map((r) => ({ ...clone(r), id: r.id ?? randomUUID() }) as T);
    const keys = UNIQUE_KEYS[this.name as TableName] ?? [];
    for (const [i, r] of created.entries()) {
      if (this.list.some((x) => x.id === r.id)) throw new Error(`${this.name}: duplicate id ${r.id}`);
      // The same unique rules as the database, so a write that Postgres refuses fails here too.
      for (const key of keys) {
        const same = (x: T) => key.every((k) => (x as Record<string, unknown>)[k] === (r as Record<string, unknown>)[k]);
        if (this.list.some(same) || created.slice(0, i).some(same)) {
          throw new Error(`${this.name}: duplicate key (${key.join(", ")}) violates unique constraint`);
        }
      }
    }
    this.list.push(...created);
    this.store.changed();
    return created.map(clone);
  }

  async update(id: string, patch: Partial<Omit<T, "id">>) {
    const row = this.list.find((r) => r.id === id);
    if (!row) throw new Error(`${this.name}: no row ${id}`);
    Object.assign(row, clone(patch));
    this.store.changed();
    return clone(row);
  }

  // The memory adapter does each operation without awaiting in between, so check-then-write is
  // atomic here; Postgres does the same with a conditional UPDATE and a unique index.
  async updateIf(id: string, expected: Where<T>, patch: Partial<Omit<T, "id">>) {
    const row = this.list.find((r) => r.id === id);
    if (!row || !matches(row, expected)) return null;
    Object.assign(row, clone(patch));
    this.store.changed();
    return clone(row);
  }

  async insertUnique(row: NewRow<T>, uniqueBy: (keyof T & string)[]) {
    const key = Object.fromEntries(uniqueBy.map((k) => [k, (row as Record<string, unknown>)[k]])) as Where<T>;
    if (this.list.some((r) => matches(r, key))) return null;
    return this.insert(row);
  }

  async remove(id: string) {
    const list = this.list;
    const i = list.findIndex((r) => r.id === id);
    if (i >= 0) {
      list.splice(i, 1);
      this.store.changed();
    }
  }
}

/** Mirrors the unique constraints and indexes in supabase/migrations (checked by a unit test). */
export const UNIQUE_KEYS: Partial<Record<TableName, string[][]>> = {
  households: [["childId"]],
  setupDrafts: [["householdId", "audience"]],
  pushSubscriptions: [["endpoint", "householdId", "audience"]],
  parentInvites: [["tokenHash"]],
  checkins: [["householdId", "metaItemId", "dueAt"]],
  digests: [["householdId", "periodEnd"]],
  reviewPrompts: [["householdId", "audience", "dueAt"]],
};

export function createMemoryRepos(store: MemoryStore): Repos {
  const repos = {} as Record<TableName, Table<{ id: string }>>;
  for (const name of TABLE_NAMES) repos[name] = new MemoryTable(store, name);
  return repos as unknown as Repos;
}

// --- Dev snapshot file -------------------------------------------------------

export const DEV_SNAPSHOT_PATH = path.join(process.cwd(), ".data", "dev-db.json");

export function loadSnapshotFile(file = DEV_SNAPSHOT_PATH): DbSnapshot | null {
  if (!existsSync(/*turbopackIgnore: true*/ file)) return null;
  try {
    const snap = JSON.parse(readFileSync(/*turbopackIgnore: true*/ file, "utf8")) as DbSnapshot;
    if (snap.version !== 1) return null;
    // Tolerate tables added later.
    for (const name of TABLE_NAMES) snap[name] ??= [] as never;
    return snap;
  } catch {
    return null;
  }
}

export function saveSnapshotFile(snapshot: DbSnapshot, file = DEV_SNAPSHOT_PATH): void {
  mkdirSync(/*turbopackIgnore: true*/ path.dirname(file), { recursive: true });
  writeFileSync(/*turbopackIgnore: true*/ file, JSON.stringify(snapshot, null, 1));
}
