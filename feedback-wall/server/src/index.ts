import { createApp } from './app.js';
import { CLIENT_DIST_DIR, config } from './config.js';
import { openDb } from './db/client.js';
import { createBroadcaster } from './realtime/broadcaster.js';

const { db, sqlite } = openDb(config.databasePath);
const broadcaster = createBroadcaster();

const app = createApp({
  db,
  broadcaster,
  trustProxy: config.trustProxy,
  clientDistDir: config.isProduction ? CLIENT_DIST_DIR : undefined,
});

const server = app.listen(config.port, () => {
  console.log(`Feedback Wall server listening on http://localhost:${config.port}`);
});

function shutdown(signal: string): void {
  console.log(`${signal} received, shutting down...`);
  broadcaster.closeAll();
  server.close(() => {
    sqlite.close();
    process.exit(0);
  });
  // Force exit if connections don't close in time.
  setTimeout(() => process.exit(1), 5000).unref();
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));
