import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { supabaseConfig } from "@/config/env";

// Keeps the Supabase Auth session fresh (Server Components cannot write cookies). In memory
// mode (no Supabase keys) it does nothing. Authorisation itself happens in src/data/access.ts.
export async function proxy(request: NextRequest) {
  const config = supabaseConfig(); // read at run time (see src/config/env.ts)
  if (!config) return NextResponse.next();
  const { url, anonKey } = config;

  let response = NextResponse.next({ request });
  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        for (const { name, value } of toSet) request.cookies.set(name, value);
        response = NextResponse.next({ request });
        for (const { name, value, options } of toSet) response.cookies.set(name, value, options);
      },
    },
  });
  await supabase.auth.getUser();
  return response;
}

export const config = {
  // Skip static files, images, icons and the service worker.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|apple-icon.png|icons/|avatars/|manifest.webmanifest|sw.js).*)"],
};
