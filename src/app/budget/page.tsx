"use client";

import { FormEvent, useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BudgetProgress } from "@/components/BudgetProgress";
import { api, ApiError } from "@/lib/api";
import { formatMonth, formatMoney } from "@/lib/format";
import { toast } from "@/components/Toaster";
import type { DashboardDTO, MonthlyBudgetDTO } from "@/types/dto";

export default function BudgetPage() {
  const [dashboard, setDashboard] = useState<DashboardDTO | null>(null);
  const [budget, setBudget] = useState<MonthlyBudgetDTO | null>(null);
  const [amount, setAmount] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [dash, b] = await Promise.all([
          api.get<DashboardDTO>("/api/dashboard"),
          api.get<MonthlyBudgetDTO | null>(`/api/budget?year=${year}&month=${month}`),
        ]);
        if (!alive) return;
        setDashboard(dash);
        setBudget(b);
        if (b) setAmount(String(b.amount));
      } catch (err) {
        if (err instanceof ApiError && err.status !== 401) toast.error(err.message);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [year, month]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const n = Number(amount);
    if (!Number.isFinite(n) || n <= 0) {
      toast.error("הזן סכום חיובי");
      return;
    }
    setBusy(true);
    try {
      const updated = await api.put<MonthlyBudgetDTO>("/api/budget", {
        year,
        month,
        amount: n,
      });
      setBudget(updated);
      toast.success("התקציב עודכן");
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "שגיאה";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  return (
    <AppShell>
      <h1 className="text-xl sm:text-2xl font-bold mb-1">תקציב חודשי</h1>
      <p className="text-sm text-muted mb-4">
        הגדר יעד הוצאה ל־<span className="font-medium">{formatMonth(now)}</span>.
      </p>

      {loading ? (
        <div className="card p-5 h-28 animate-pulse" />
      ) : budget && dashboard ? (
        <BudgetProgress spent={dashboard.month} budget={budget.amount} />
      ) : (
        <div className="card p-4">
          <p className="text-sm text-muted">
            עדיין לא הגדרת תקציב לחודש זה — הוסף אחד למטה.
          </p>
        </div>
      )}

      <form onSubmit={onSubmit} className="card p-4 sm:p-6 mt-4 flex flex-col gap-4">
        <div>
          <label htmlFor="amount" className="label">
            סכום תקציב לחודש (₪)
          </label>
          <input
            id="amount"
            type="number"
            inputMode="decimal"
            min="0"
            step="1"
            required
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="input text-2xl font-bold tabular-nums"
            placeholder="0"
          />
          {dashboard && (
            <p className="text-xs text-muted mt-1.5">
              הוצאת עד עכשיו החודש:{" "}
              <span className="tabular-nums">{formatMoney(dashboard.month)}</span>
            </p>
          )}
        </div>

        <button type="submit" disabled={busy} className="btn-primary">
          {busy ? <Loader2 className="animate-spin" size={16} /> : null}
          שמור תקציב
        </button>
      </form>
    </AppShell>
  );
}
