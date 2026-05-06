"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getPublicEnvOrThrow } from "../env";

let cached: ReturnType<typeof createBrowserClient> | null = null;

/**
 * Browser-side Supabase singleton.
 * Used by client components for sign-in, sign-out, and reading the session JWT.
 */
export function getBrowserSupabase() {
  if (cached) return cached;
  const env = getPublicEnvOrThrow();
  cached = createBrowserClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
  return cached;
}
