/**
 * Centralised, validated env access.
 * Anything starting with NEXT_PUBLIC_ is safe in the browser bundle.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.trim() === "") {
    throw new Error(
      `Missing required environment variable: ${name}. Check your .env file.`,
    );
  }
  return value;
}

export const PUBLIC_ENV = {
  SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  // Used only when the app runs inside Capacitor (Android). In the browser
  // we hit relative paths instead.
  API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
};

export function getPublicEnvOrThrow() {
  return {
    SUPABASE_URL: required("NEXT_PUBLIC_SUPABASE_URL", PUBLIC_ENV.SUPABASE_URL),
    SUPABASE_ANON_KEY: required(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      PUBLIC_ENV.SUPABASE_ANON_KEY,
    ),
    API_BASE_URL: PUBLIC_ENV.API_BASE_URL, // optional
  };
}
