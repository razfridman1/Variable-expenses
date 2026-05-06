import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getPublicEnvOrThrow } from "../env";

/**
 * Server-side Supabase client. Reads/writes the auth cookies that come in
 * with the request. Used by server components & API route handlers.
 */
export function getServerSupabase() {
  const env = getPublicEnvOrThrow();
  const cookieStore = cookies();

  return createServerClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(toSet) {
        try {
          for (const { name, value, options } of toSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Set from a server component — Next will refresh the session via middleware.
        }
      },
    },
  });
}
