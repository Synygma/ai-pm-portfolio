# Database

- **Engine:** SQLite, single file.
- **Location:** `server/data/feedback.db` by default (override with `DATABASE_PATH`). The file and its `-wal` / `-shm` siblings are gitignored.
- **Driver / ORM:** `better-sqlite3` + Drizzle ORM. Schema lives in `server/src/db/schema.ts`.
- **Pragmas on startup:** `journal_mode = WAL`, `foreign_keys = ON`, `busy_timeout = 5000`.

## Tables

### `feedback`

| Column       | Type    | Constraints                     | Notes                                                   |
| ------------ | ------- | ------------------------------- | ------------------------------------------------------- |
| `id`         | INTEGER | PRIMARY KEY AUTOINCREMENT       | Also used as the pagination cursor                      |
| `message`    | TEXT    | NOT NULL                        | 1–280 chars (enforced in Zod)                           |
| `author`     | TEXT    | NOT NULL, DEFAULT `'Anonymous'` | Up to 40 chars                                          |
| `color`      | TEXT    | NOT NULL                        | One of the palette values                               |
| `rating`     | INTEGER | NULL                            | Optional 1–5 experience rating (enforced in Zod)        |
| `created_at` | INTEGER | NOT NULL                        | Unix time in milliseconds (Drizzle `timestamp_ms` mode) |

Indexes: the primary key covers newest-first pagination (`ORDER BY id DESC`). No extra indexes needed yet.

The API exposes `created_at` as `createdAt` (ISO string). Conversion happens in the service layer.

## Migrations

- Edit `server/src/db/schema.ts`.
- Run `npm run db:generate` to create a migration in `server/drizzle/`.
- Review the generated SQL, then run `npm run db:migrate` (runs `server/src/db/migrate.ts`, which uses Drizzle's migrator; `npm run dev` runs it automatically). Tests apply the same migrations to a `:memory:` database.
- Migrations are committed to git. Never hand-edit an applied migration; add a new one.
- Never modify the `.db` file directly.

## Backups

The database is a single file. To back it up safely while the app runs, use SQLite's backup API (`better-sqlite3`'s `db.backup()`) or `sqlite3 feedback.db ".backup backup.db"`, rather than copying the file mid-write.
