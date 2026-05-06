import { NextRequest, NextResponse } from "next/server";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { PUBLIC_ENV } from "@/lib/env";

const PUBLIC_PATHS = ["/login", "/register", "/auth/callback"];

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

// Origins we explicitly allow for cross-origin API calls. Capacitor on
// Android serves the WebView from https://localhost (and historically
// capacitor://localhost), and we want the production web app to be able
// to call its own API too. Anything not in this list gets no CORS headers
// (browsers will block, server-to-server is unaffected).
const ALLOWED_ORIGINS = new Set<string>([
  "https://localhost",
  "http://localhost",
  "capacitor://localhost",
]);

function corsHeadersFor(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const allow =
    ALLOWED_ORIGINS.has(origin) ||
    // Allow our own deployed frontend(s)
    origin.endsWith(".vercel.app") ||
    // Allow localhost on any port for `npm run dev`
    /^https?:\/\/localhost(:\d+)?$/.test(origin);
  if (!allow) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET,POST,PUT,PATCH,DELETE,OPTIONS",
    "Access-Control-Allow-Headers":
      req.headers.get("access-control-request-headers") ||
      "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}

/**
 * - For /api/*  →  add CORS headers (and answer OPTIONS preflights).
 * - For pages   →  refresh Supabase cookie session and gate auth.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ─── /api/* — CORS only, no cookie/redirect logic ───────────────────────
  if (pathname.startsWith("/api/")) {
    const cors = corsHeadersFor(req);

    // Browser preflight — answer immediately with 204.
    if (req.method === "OPTIONS") {
      return new NextResponse(null, { status: 204, headers: cors });
    }

    const res = NextResponse.next();
    for (const [k, v] of Object.entries(cors)) res.headers.set(k, v);
    return res;
  }

  // ─── Pages — Supabase cookie refresh + auth gate ────────────────────────
  const res = NextResponse.next();

  if (!PUBLIC_ENV.SUPABASE_URL || !PUBLIC_ENV.SUPABASE_ANON_KEY) return res;

  const supabase = createServerClient(
    PUBLIC_ENV.SUPABASE_URL,
    PUBLIC_ENV.SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(toSet: CookieToSet[]) {
          for (const { name, value, options } of toSet) {
            res.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/_next/") ||
    pathname === "/favicon.ico";

  if (!user && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }

  if (user && (pathname === "/login" || pathname === "/register")) {
    const url = req.nextUrl.clone();
    url.pathname = "/";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: [
    // Skip Next internals & static files. Match everything else (pages + /api/*).
    "/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)",
  ],
};
