import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { PUBLIC_ENV } from "@/lib/env";

const PUBLIC_PATHS = ["/login", "/register", "/auth/callback"];

/**
 * Refresh Supabase auth cookies on every request and redirect unauthenticated
 * users away from protected pages. API routes do their own auth.
 */
export async function middleware(req: NextRequest) {
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
        setAll(toSet) {
          for (const { name, value, options } of toSet) {
            res.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  // Use getSession (no remote round trip — reads & validates the cookie locally)
  // instead of getUser (which calls the Supabase Auth API). For a redirect gate
  // this is fine: API routes still call getUser() on top of the JWT.
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const user = session?.user ?? null;

  const { pathname } = req.nextUrl;
  const isPublic =
    PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`)) ||
    pathname.startsWith("/api/") ||
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
    // Skip Next internals & static files. We still match API to keep cookies fresh.
    "/((?!_next/static|_next/image|favicon.ico|icons|.*\\.(?:png|jpg|jpeg|svg|gif|webp|ico)$).*)",
  ],
};
