// Deletes the local dev database snapshot so the next `npm run dev` starts from fresh seed data.
//   npm run db:reset      (stop the dev server first)
import { rmSync } from "node:fs";
import path from "node:path";

const file = path.join(process.cwd(), ".data", "dev-db.json");
rmSync(file, { force: true });
console.log(`Removed ${file}. Start the app again to reload the sample data.`);
