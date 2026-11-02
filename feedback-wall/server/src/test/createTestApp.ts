import { createApp } from '../app.js';
import { openDb, runMigrations } from '../db/client.js';
import { createBroadcaster } from '../realtime/broadcaster.js';

/** Builds an app backed by a fresh, migrated in-memory SQLite database. */
export function createTestApp() {
  const handle = openDb(':memory:');
  runMigrations(handle.db);
  const broadcaster = createBroadcaster();
  const app = createApp({ db: handle.db, broadcaster });
  return { app, broadcaster, ...handle };
}
