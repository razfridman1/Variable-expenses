/**
 * Smart API client.
 *
 * Base URL resolution:
 *   - On the server (SSR / route handlers calling other handlers) → relative path.
 *   - In the browser (Vercel-served web app) → relative path ("/api/…").
 *   - Inside Capacitor (Android APK) → full production URL from
 *     NEXT_PUBLIC_API_BASE_URL. This is REQUIRED for the APK build.
 *
 * Auth: every request attaches the Supabase JWT (Bearer) so the API can
 * identify the user without relying on cookies — cookies don't survive the
 * cross-origin Capacitor → Vercel jump.
 */
import { isCapacitor, isBrowser } from "./platform";
import { PUBLIC_ENV } from "./env";
import { getBrowserSupabase } from "./supabase/client";

export function resolveApiBaseUrl(): string {
  if (isCapacitor()) {
    if (!PUBLIC_ENV.API_BASE_URL) {
      // Loud error so misconfigured APKs don't silently hit garbage URLs.
      throw new Error(
        "NEXT_PUBLIC_API_BASE_URL must be set when running inside Capacitor.",
      );
    }
    return PUBLIC_ENV.API_BASE_URL.replace(/\/+$/, "");
  }
  // Browser & server: same-origin, use a relative path.
  return "";
}

function buildUrl(path: string): string {
  const base = resolveApiBaseUrl();
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

async function authHeader(): Promise<Record<string, string>> {
  if (!isBrowser()) return {};
  try {
    const supabase = getBrowserSupabase();
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (session?.access_token) {
      return { Authorization: `Bearer ${session.access_token}` };
    }
  } catch {
    /* not signed in */
  }
  return {};
}

export class ApiError extends Error {
  status: number;
  payload: unknown;
  constructor(status: number, message: string, payload?: unknown) {
    super(message);
    this.status = status;
    this.payload = payload;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(await authHeader()),
    ...((init.headers as Record<string, string>) ?? {}),
  };

  const res = await fetch(buildUrl(path), {
    ...init,
    headers,
    // Browser → same origin → cookies. Capacitor → no cookies, JWT does the job.
    credentials: isCapacitor() ? "omit" : "include",
  });

  const ct = res.headers.get("content-type") ?? "";
  const body = ct.includes("application/json") ? await res.json() : await res.text();

  if (!res.ok) {
    const message =
      (body && typeof body === "object" && "error" in body && (body as { error: string }).error) ||
      `Request failed with status ${res.status}`;
    throw new ApiError(res.status, message, body);
  }

  return body as T;
}

export const api = {
  get:  <T>(p: string)            => request<T>(p, { method: "GET" }),
  post: <T>(p: string, body: unknown) => request<T>(p, { method: "POST", body: JSON.stringify(body) }),
  put:  <T>(p: string, body: unknown) => request<T>(p, { method: "PUT",  body: JSON.stringify(body) }),
  patch:<T>(p: string, body: unknown) => request<T>(p, { method: "PATCH",body: JSON.stringify(body) }),
  delete:<T>(p: string)               => request<T>(p, { method: "DELETE" }),
};
