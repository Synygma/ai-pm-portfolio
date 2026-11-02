import { config } from '../config.js';
import { openDb, runMigrations } from './client.js';

const { db, sqlite } = openDb(config.databasePath);
try {
  runMigrations(db);
  console.log(`Migrations applied to ${config.databasePath}`);
} finally {
  sqlite.close();
}
