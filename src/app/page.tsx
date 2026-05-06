"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { StatCard } from "@/components/StatCard";
import { BudgetProgress } from "@/components/BudgetProgress";
import { ExpenseRow } from "@/components/ExpenseRow";
import { EmptyState } from "@/components/EmptyState";
import { api, ApiError } from "@/lib/api";
import { formatMoney } from "@/lib/format";
import { toast } from "@/components/Toaster";
import type { DashboardDTO } from "@/types/dto";

export default function DashboardPage() {
  const [data, setData] = useState<DashboardDTO | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await api.get<DashboardDTO>("/api/dashboard");
        if (alive) setData(res);
      } catch (err) {
        if (err instanceof ApiError && err.status !== 401) {
          toast.error(err.message);
        }
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <AppShell>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">שלום 👋</h1>
          <p className="text-sm text-muted">סיכום ההוצאות שלך</p>
        </div>
        <Link href="/add" className="btn-primary !px-4">
          <Plus size={16} />
          הוסף הוצאה
        </Link>
      </div>

      {/* Top stats */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard
          label="היום"
          value={loading ? "" : formatMoney(data?.today ?? 0)}
          loading={loading}
        />
        <StatCard
          label="השבוע"
          value={loading ? "" : formatMoney(data?.week ?? 0)}
          loading={loading}
        />
        <StatCard
          label="החודש"
          value={loading ? "" : formatMoney(data?.month ?? 0)}
          loading={loading}
        />
      </div>

      {/* Budget */}
      <div className="mt-4">
        {loading ? (
          <div className="card p-5 h-28 animate-pulse" />
        ) : data?.budget ? (
          <BudgetProgress spent={data.month} budget={data.budget.amount} />
        ) : (
          <EmptyState
            title="עוד לא הגדרת תקציב חודשי"
            description="הגדרת תקציב תעזור לך לעקוב אחרי ההתקדמות לעבר היעד החודשי."
            action={
              <Link href="/budget" className="btn-primary">
                הגדר תקציב
              </Link>
            }
          />
        )}
      </div>

      {/* Recent */}
      <section className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold">אחרונות</h2>
          <Link href="/history" className="text-xs text-primary">
            ראה הכול
          </Link>
        </div>

        <div className="card p-2 sm:p-3">
          {loading ? (
            <ul className="divide-y divide-border">
              {[0, 1, 2, 3, 4].map((i) => (
                <li key={i} className="flex items-center gap-3 py-3 px-1">
                  <div className="h-9 w-9 rounded-full bg-surface-2 animate-pulse" />
                  <div className="flex-1">
                    <div className="h-3 w-32 rounded bg-surface-2 animate-pulse" />
                    <div className="h-2.5 w-20 rounded bg-surface-2 animate-pulse mt-2" />
                  </div>
                  <div className="h-3 w-14 rounded bg-surface-2 animate-pulse" />
                </li>
              ))}
            </ul>
          ) : data && data.recent.length > 0 ? (
            <ul className="divide-y divide-border px-1">
              {data.recent.map((e) => (
                <ExpenseRow key={e.id} expense={e} />
              ))}
            </ul>
          ) : (
            <EmptyState
              title="עוד אין הוצאות"
              description="הוסף את ההוצאה הראשונה שלך כדי שתופיע כאן."
              action={
                <Link href="/add" className="btn-primary">
                  הוסף עכשיו
                </Link>
              }
            />
          )}
        </div>
      </section>
    </AppShell>
  );
}
