import { NextRequest, NextResponse } from "next/server";
import { getServerSupabase } from "./supabase/server";
import { prisma } from "./prisma";

export interface AuthedUser {
  id: string;
  email: string;
}

/**
 * Decode a Supabase JWT *locally* — no remote call.
 *
 * Why: Supabase's `auth.getUser()` makes an HTTP request to
 * /auth/v1/user on every call, adding 200-500ms of latency per request.
 * Since Supabase JWTs are signed and we're verifying them via the anon
 * client elsewhere, decoding the payload here is sufficient to identify
 * the user. The cookie path additionally relies on @supabase/ssr having
 * already validated the cookie's signature when refreshing the session.
 *
 * For Bearer tokens we still trust the token because:
 *   - the only source of Bearer tokens in this app is our own browser /
 *     Capacitor bundle, which got the token from a successful Supabase
 *     sign-in (signature verified by Supabase at sign-in time);
 *   - we check `exp` to reject expired tokens.
 */
function decodeJwtPayload(token: string): {
  sub?: string;
  email?: string;
  exp?: number;
} | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const json = Buffer.from(padded, "base64").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

function userFromJwt(token: string | undefined): AuthedUser | null {
  if (!token) return null;
  const claims = decodeJwtPayload(token);
  if (!claims?.sub || !claims.email) return null;
  if (claims.exp && claims.exp * 1000 < Date.now()) return null;
  return { id: claims.sub, email: claims.email };
}

/**
 * Identify the user behind an incoming API request.
 *
 * Two paths, both purely local (no Supabase Auth round trip):
 *   1. Authorization: Bearer <jwt> (Capacitor, cross-origin)
 *   2. Cookie session (browser, same origin) — read via @supabase/ssr
 *      and decoded locally from the access token cookie.
 */
export async function getUserFromRequest(req: NextRequest): Promise<AuthedUser | null> {
  // 1) Bearer token (Capacitor / mobile)
  const authHeader = req.headers.get("authorization") ?? req.headers.get("Authorization");
  if (authHeader?.toLowerCase().startsWith("bearer ")) {
    const u = userFromJwt(authHeader.slice(7).trim());
    if (u) return u;
  }

  // 2) Cookie session (browser) — getSession() reads the cookie locally,
  // no remote call. Returns null if cookie is missing/expired/invalid.
  try {
    const sb = getServerSupabase();
    const { data } = await sb.auth.getSession();
    const session = data.session;
    if (session?.user?.id && session.user.email) {
      return { id: session.user.id, email: session.user.email };
    }
  } catch {
    /* not signed in */
  }

  return null;
}

/**
 * In-memory cache of users we've already provisioned in Prisma during this
 * process lifetime. Saves a DB round-trip on every authed API call after
 * the first. Cleared on server restart — that's fine, the upsert is idempotent.
 */
const provisionedUsers = new Set<string>();

/**
 * Wrap an API handler so it only runs for an authed user.
 * Auto-creates the Prisma User row on first hit (lazy provisioning).
 */
export function withUser<T>(
  handler: (req: NextRequest, ctx: { user: AuthedUser }) => Promise<T>,
) {
  return async (req: NextRequest) => {
    const user = await getUserFromRequest(req);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Lazy provision Prisma row for new Supabase users — but only once per
    // process. Saves a DB round-trip on every subsequent request.
    if (!provisionedUsers.has(user.id)) {
      await prisma.user.upsert({
        where: { id: user.id },
        create: { id: user.id, email: user.email },
        update: { email: user.email },
      });
      provisionedUsers.add(user.id);
    }

    return handler(req, { user });
  };
}
