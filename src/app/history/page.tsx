"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ExpenseRow } from "@/components/ExpenseRow";
import { EmptyState } from "@/components/EmptyState";
import { ExpenseEditDialog } from "@/components/ExpenseEditDialog";
import { api, ApiError } from "@/lib/api";
import { dayRange, weekRange, monthRange, yearRange } from "@/lib/dates";
import { formatMoney, formatDate, formatMonth } from "@/lib/format";
import { toast } from "@/components/Toaster";
import type { ExpenseDTO } from "@/types/dto";
import { cn } from "@/lib/cn";

type RangeKind = "day" | "week" | "month" | "year";

interface ListRes {
  items: ExpenseDTO[];
  total: number;
  limit: number;
  offset: number;
}

function rangeFor(kind: RangeKind, anchor: Date) {
  switch (kind) {
    case "day":   return dayRange(anchor);
    case "week":  return weekRange(anchor);
    case "month": return monthRange(anchor);
    case "year":  return yearRange(anchor);
  }
}

function shiftAnchor(kind: RangeKind, anchor: Date, dir: -1 | 1): Date {
  const d = new Date(anchor);
  switch (kind) {
    case "day":   d.setDate(d.getDate() + dir); break;
    case "week":  d.setDate(d.getDate() + 7 * dir); break;
    case "month": d.setMonth(d.getMonth() + dir); break;
    case "year":  d.setFullYear(d.getFullYear() + dir); break;
  }
  return d;
}

function rangeLabel(kind: RangeKind, anchor: Date): string {
  const r = rangeFor(kind, anchor);
  switch (kind) {
    case "day":   return formatDate(anchor);
    case "week":  return `${formatDate(r.from)} – ${formatDate(r.to)}`;
    case "month": return formatMonth(anchor);
    case "year":  return String(anchor.getFullYear());
  }
}

const TABS: Array<{ key: RangeKind; label: string }> = [
  { key: "day",   label: "יום" },
  { key: "week",  label: "שבוע" },
  { key: "month", label: "חודש" },
  { key: "year",  label: "שנה" },
];

export default function HistoryPage() {
  const [kind, setKind] = useState<RangeKind>("month");
  const [anchor, setAnchor] = useState<Date>(new Date());
  const [data, setData] = useState<ListRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<ExpenseDTO | null>(null);

  const range = useMemo(() => rangeFor(kind, anchor), [kind, anchor]);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        from: range.from.toISOString(),
        to: range.to.toISOString(),
        limit: "500",
      });
      const res = await api.get<ListRes>(`/api/expenses?${params.toString()}`);
      setData(res);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "שגיאה בטעינה";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, [range.from, range.to]);

  useEffect(() => {
    void load();
  }, [load]);

  // Year filter is capped to the last 12 months — block "next" past today
  // and "back" past 12 months ago.
  const now = new Date();
  const oldestAllowed = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const canGoBack =
    kind === "year"
      ? anchor.getFullYear() > oldestAllowed.getFullYear() - 1
      : range.from > oldestAllowed;
  const canGoForward = range.to < now;

  const total = useMemo(
    () => (data?.items.reduce((s, e) => s + e.amount, 0) ?? 0),
    [data],
  );

  async function handleDelete(id: string) {
    if (!confirm("למחוק את ההוצאה?")) return;
    try {
      await api.delete(`/api/expenses/${id}`);
      toast.success("נמחק");
      void load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "שגיאה";
      toast.error(msg);
    }
  }

  return (
    <AppShell>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">היסטוריה</h1>
          <p className="text-sm text-muted">דפדף בין ימים, שבועות, חודשים ושנים.</p>
        </div>
        <Link href="/add" className="btn-primary !px-4">
          <Plus size={16} />
          הוסף
        </Link>
      </div>

      {/* Tabs */}
      <div className="card p-1.5 flex gap-1 overflow-x-auto no-scrollbar">
        {TABS.map((t) => {
          const active = t.key === kind;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => {
                setKind(t.key);
                setAnchor(new Date());
              }}
              className={cn(
                "flex-1 min-w-[80px] rounded-lg px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-primary text-primary-fg"
                  : "text-muted hover:text-text hover:bg-surface-2",
              )}
            >
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Range picker */}
      <div className="card p-3 mt-3 flex items-center justify-between">
        {/* In RTL "previous" sits on the right and is the right-pointing chevron */}
        <button
          type="button"
          onClick={() => setAnchor((a) => shiftAnchor(kind, a, -1))}
          disabled={!canGoBack}
          className="btn-ghost h-9 w-9 !p-0 rounded-full"
          aria-label="קודם"
        >
          <ChevronRight size={18} />
        </button>
        <p className="text-sm font-medium tabular-nums">{rangeLabel(kind, anchor)}</p>
        <button
          type="button"
          onClick={() => setAnchor((a) => shiftAnchor(kind, a, 1))}
          disabled={!canGoForward}
          className="btn-ghost h-9 w-9 !p-0 rounded-full"
          aria-label="הבא"
        >
          <ChevronLeft size={18} />
        </button>
      </div>

      {/* Total */}
      <div className="card p-4 mt-3 flex items-baseline justify-between">
        <p className="text-sm text-muted">סה״כ בטווח</p>
        <p className="text-xl font-bold tabular-nums">{formatMoney(total)}</p>
      </div>

      {/* List */}
      <div className="card mt-3 p-2 sm:p-3">
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
        ) : data && data.items.length > 0 ? (
          <ul className="divide-y divide-border px-1">
            {data.items.map((e) => (
              <ExpenseRow
                key={e.id}
                expense={e}
                onEdit={setEditing}
                onDelete={handleDelete}
              />
            ))}
          </ul>
        ) : (
          <EmptyState
            title="אין הוצאות בטווח הזה"
            description="נסה לבחור טווח זמן אחר או להוסיף הוצאות חדשות."
          />
        )}
      </div>

      <ExpenseEditDialog
        expense={editing}
        onClose={() => setEditing(null)}
        onSaved={() => void load()}
      />
    </AppShell>
  );
}
