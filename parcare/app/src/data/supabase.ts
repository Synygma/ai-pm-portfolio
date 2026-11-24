// Supabase adapter. With a user-session client, row-level security limits every query to the
// signed-in child's household. With the service-role client (tick, seed) RLS is bypassed, so
// that client is only ever created on the server.

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { camelToSnake, toCamelRow, toSnakeRow } from "./case";
import type { FindOptions, NewRow, Repos, Table, Where } from "./repo";
import { TABLE_NAMES, type TableName } from "./types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyClient = SupabaseClient<any, any, any>;

export class SupabaseError extends Error {
  constructor(table: string, action: string, message: string) {
    super(`Supabase ${table}.${action}: ${message}`);
  }
}

class SupabaseTable<T extends { id: string }> implements Table<T> {
  private readonly sqlName: string;

  constructor(
    private readonly client: AnyClient,
    name: TableName,
  ) {
    this.sqlName = camelToSnake(name);
  }

  private fail(action: string, message: string): never {
    throw new SupabaseError(this.sqlName, action, message);
  }

  async get(id: string) {
    const { data, error } = await this.client.from(this.sqlName).select("*").eq("id", id).maybeSingle();
    if (error) this.fail("get", error.message);
    return data ? toCamelRow<T>(data) : null;
  }

  async find(where: Where<T> = {}, options: FindOptions<T> = {}) {
    let query = this.client.from(this.sqlName).select("*");
    for (const [k, v] of Object.entries(toSnakeRow(where as Record<string, unknown>))) {
      query = v === null ? query.is(k, null) : query.eq(k, v);
    }
    if (options.orderBy) query = query.order(camelToSnake(options.orderBy), { ascending: !options.desc });
    if (options.limit !== undefined) query = query.limit(options.limit);
    const { data, error } = await query;
    if (error) this.fail("find", error.message);
    return (data ?? []).map((r) => toCamelRow<T>(r));
  }

  async findOne(where: Where<T>) {
    const [row] = await this.find(where, { limit: 1 });
    return row ?? null;
  }

  async insert(row: NewRow<T>) {
    const [inserted] = await this.insertMany([row]);
    return inserted;
  }

  async insertMany(rows: NewRow<T>[]) {
    if (rows.length === 0) return [];
    const payload = rows.map((r) => toSnakeRow({ ...r, id: r.id ?? randomUUID() }));
    const { data, error } = await this.client.from(this.sqlName).insert(payload).select("*");
    if (error) this.fail("insert", error.message);
    return (data ?? []).map((r) => toCamelRow<T>(r));
  }

  async update(id: string, patch: Partial<Omit<T, "id">>) {
    const { data, error } = await this.client
      .from(this.sqlName)
      .update(toSnakeRow(patch as Record<string, unknown>))
      .eq("id", id)
      .select("*")
      .single();
    if (error) this.fail("update", error.message);
    return toCamelRow<T>(data);
  }

  /** Conditional UPDATE: only rows still matching `expected` change; none = another run won. */
  async updateIf(id: string, expected: Where<T>, patch: Partial<Omit<T, "id">>) {
    let query = this.client
      .from(this.sqlName)
      .update(toSnakeRow(patch as Record<string, unknown>))
      .eq("id", id);
    for (const [k, v] of Object.entries(expected)) {
      if (v === undefined) continue;
      const col = camelToSnake(k);
      query = v === null ? query.is(col, null) : query.eq(col, v);
    }
    const { data, error } = await query.select("*");
    if (error) this.fail("update", error.message);
    return data && data.length > 0 ? toCamelRow<T>(data[0]) : null;
  }

  /** Relies on a unique index over `uniqueBy` (migration 0005): a duplicate is refused, not an error. */
  async insertUnique(row: NewRow<T>) {
    const payload = toSnakeRow({ ...row, id: row.id ?? randomUUID() });
    const { data, error } = await this.client.from(this.sqlName).insert(payload).select("*");
    if (error) {
      if (error.code === "23505") return null; // unique_violation: another run inserted it first
      this.fail("insert", error.message);
    }
    return data && data.length > 0 ? toCamelRow<T>(data[0]) : null;
  }

  async remove(id: string) {
    const { error } = await this.client.from(this.sqlName).delete().eq("id", id);
    if (error) this.fail("remove", error.message);
  }
}

export function createSupabaseRepos(client: AnyClient): Repos {
  const repos = {} as Record<TableName, Table<{ id: string }>>;
  for (const name of TABLE_NAMES) repos[name] = new SupabaseTable(client, name);
  return repos as unknown as Repos;
}
