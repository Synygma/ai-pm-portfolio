// Reads environment variables in one place. See .env.example for where each one comes from.
//
// Read at run time, not build time: Next.js writes `process.env.NEXT_PUBLIC_…` values into the
// build when they are written out literally. Supabase is only used on the server, so reading by a
// computed name keeps the build free of them and lets the test server blank them reliably (a
// test run must never reach a real project).

function readEnv(name: string): string | undefined {
  return process.env[name]?.trim() || undefined;
}

export function isDemoMode(): boolean {
  return readEnv("DEMO_MODE") === "true";
}

export function supabaseConfig(): { url: string; anonKey: string } | null {
  const url = readEnv(["NEXT_PUBLIC", "SUPABASE_URL"].join("_"));
  const anonKey = readEnv(["NEXT_PUBLIC", "SUPABASE_ANON_KEY"].join("_"));
  return url && anonKey ? { url, anonKey } : null;
}

/**
 * The admin login for /admin (ADMIN_EMAIL + ADMIN_PASSWORD). It is not a child account. Both
 * missing = no admin page at all. Kept in the environment, never in the code.
 */
export function adminCredentials(): { email: string; password: string } | null {
  const email = readEnv("ADMIN_EMAIL")?.toLowerCase();
  const password = readEnv("ADMIN_PASSWORD");
  return email && password && password.length >= 10 ? { email, password } : null;
}

/** Server only. Bypasses row-level security. */
export function supabaseServiceKey(): string | null {
  return readEnv("SUPABASE_SERVICE_ROLE_KEY") ?? null;
}
