"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock } from "lucide-react";
import { getBrowserSupabase } from "@/lib/supabase/client";
import { ThemeToggle } from "@/components/ThemeToggle";
import { toast } from "@/components/Toaster";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (password.length < 8) {
      toast.error("הסיסמה חייבת להכיל לפחות 8 תווים");
      return;
    }
    if (password !== confirm) {
      toast.error("הסיסמאות לא תואמות");
      return;
    }
    setBusy(true);
    try {
      const sb = getBrowserSupabase();
      const { data, error } = await sb.auth.signUp({ email, password });
      if (error) {
        toast.error(error.message || "ההרשמה נכשלה");
        return;
      }
      // If email confirmation is on, the session will be null until confirmed.
      if (data.session) {
        toast.success("נרשמת בהצלחה!");
        router.replace("/");
        router.refresh();
      } else {
        toast.success("נרשמת! בדקו את הדוא״ל לאישור החשבון.");
        router.replace("/login");
      }
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
          <h1 className="text-xl font-bold mb-1">צרו חשבון חדש</h1>
          <p className="text-sm text-muted mb-6">
            עוד 30 שניות ותתחילו לעקוב אחרי ההוצאות שלכם.
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
              <label htmlFor="password" className="label">סיסמה (לפחות 8 תווים)</label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                />
                <input
                  id="password"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-9"
                  dir="ltr"
                />
              </div>
            </div>

            <div>
              <label htmlFor="confirm" className="label">אימות סיסמה</label>
              <div className="relative">
                <Lock
                  size={16}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
                />
                <input
                  id="confirm"
                  type="password"
                  required
                  minLength={8}
                  autoComplete="new-password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="input pr-9"
                  dir="ltr"
                />
              </div>
            </div>

            <button type="submit" disabled={busy} className="btn-primary mt-2">
              {busy ? <Loader2 className="animate-spin" size={16} /> : null}
              צור חשבון
            </button>
          </form>

          <p className="text-xs text-muted text-center mt-6">
            כבר יש לכם חשבון?{" "}
            <Link href="/login" className="text-primary font-medium">התחברו</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
