"use client";

import { FormEvent, Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, Lock } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "@/components/Toaster";

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginInner />
    </Suspense>
  );
}

function LoginInner() {
  const router = useRouter();
  const search = useSearchParams();
  const next = search.get("next") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    try {
      const sb = getBrowserSupabase();
      const { error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message || "התחברות נכשלה");
        return;
      }
      router.replace(next);
      router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col">
      <div className="flex justify-end p-4">
        <ThemeToggle />
      </div>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="card w-full max-w-md p-6 sm:p-8 animate-fadeIn">
          <h1 className="text-xl font-bold mb-1">ברוכים השבים 👋</h1>
          <p className="text-sm text-muted mb-6">
            התחברו כדי להמשיך לעקוב אחרי ההוצאות שלכם.
          </p>

          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <div>
              <label htmlFor="email" className="label">דוא״ל</label>
              <div className="relative">
                <Mail
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                />
                <input
                  id="email"
                  type="email"
                  required
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pr-9"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">סיסמה</label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                />
                <input
                  id="password"
                  type="password"
                  required
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-9"
                  dir="ltr"
                />
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn-primary mt-2">
              {busy ? <Loader2 className="animate-spin" size={16} /> : null}
              התחבר
            </button>
          </form>

          <p className="text-xs text-muted text-center mt-6">
            עדיין אין לכם חשבון?{" "}
            <Link href="/register" className="text-primary font-medium">הרשמו</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
