"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { getBrowserSupabase } from "@/lib/supabase/client";

interface AuthState {
  userId: string | null;
  email: string | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthState>({
  userId: null,
  email: null,
  loading: true,
  signOut: async () => {},
});

/**
 * Tracks the current Supabase session in client land. Pages that need an
 * authed user check this; the middleware also redirects unauthed users.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    userId: null,
    email: null,
    loading: true,
    signOut: async () => {
      const sb = getBrowserSupabase();
      await sb.auth.signOut();
      window.location.href = "/login";
    },
  });

  useEffect(() => {
    const sb = getBrowserSupabase();
    let mounted = true;

    sb.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setState((s) => ({
        ...s,
        userId: data.session?.user.id ?? null,
        email: data.session?.user.email ?? null,
        loading: false,
      }));
    });

    const { data: sub } = sb.auth.onAuthStateChange((_event, session) => {
      setState((s) => ({
        ...s,
        userId: session?.user.id ?? null,
        email: session?.user.email ?? null,
        loading: false,
      }));
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return <Ctx.Provider value={state}>{children}</Ctx.Provider>;
}

export function useAuth() {
  return useContext(Ctx);
}
