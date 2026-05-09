"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Check, Plus, Trash2, Pencil, X } from "lucide-react";
import { BarMitzvahCategory } from "@prisma/client";
import { AppShell } from "@/components/AppShell";
import { EmptyState } from "@/components/EmptyState";
import { api, ApiError } from "@/lib/api";
import {
  BM_CATEGORY_ORDER,
  BM_CATEGORY_LABELS_HE,
  BM_CATEGORY_COLORS,
  bmCategoryLabel,
} from "@/lib/barMitzvahCategories";
import { formatMoney, formatDate } from "@/lib/format";
import { toast } from "@/components/Toaster";
import type { BarMitzvahExpenseDTO } from "@/types/dto";
import { cn } from "@/lib/cn";

interface ListRes {
  items: BarMitzvahExpenseDTO[];
  total: number;
  limit: number;
  offset: number;
  summary: {
    totalPaid: number;
    totalRemaining: number;
    totalCommitted: number;
  };
}

function todayLocalISODate(): string {
  const d = new Date();
  d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
  return d.toISOString().slice(0, 10);
}

const EMPTY_FORM = {
  vendor: "",
  category: BarMitzvahCategory.HALL as BarMitzvahCategory,
  customCategory: "",
  amountPaid: "",
  amountRemaining: "",
  date: todayLocalISODate(),
  note: "",
};

type FormState = typeof EMPTY_FORM;

export default function BarMitzvahPage() {
  const [data, setData] = useState<ListRes | null>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<ListRes>("/api/bar-mitzvah?limit=500");
      setData(res);
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "שגיאה בטעינה";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const items = data?.items ?? [];
  const summary = data?.summary ?? {
    totalPaid: 0,
    totalRemaining: 0,
    totalCommitted: 0,
  };

  // Group by category for the breakdown card
  const byCategory = useMemo(() => {
    const map = new Map<
      string,
      {
        category: BarMitzvahCategory;
        customLabel: string;
        paid: number;
        remaining: number;
        count: number;
      }
    >();
    for (const it of items) {
      const key =
        it.category === BarMitzvahCategory.OTHER
          ? `OTHER:${it.customCategory ?? ""}`
          : it.category;
      const cur = map.get(key);
      if (cur) {
        cur.paid += it.amountPaid;
        cur.remaining += it.amountRemaining;
        cur.count += 1;
      } else {
        map.set(key, {
          category: it.category,
          customLabel: bmCategoryLabel(it.category, it.customCategory),
          paid: it.amountPaid,
          remaining: it.amountRemaining,
          count: 1,
        });
      }
    }
    return Array.from(map.values()).sort(
      (a, b) => b.paid + b.remaining - (a.paid + a.remaining),
    );
  }, [items]);

  function openAdd() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setShowForm(true);
  }

  function openEdit(it: BarMitzvahExpenseDTO) {
    setEditingId(it.id);
    setForm({
      vendor: it.vendor,
      category: it.category,
      customCategory: it.customCategory ?? "",
      amountPaid: String(it.amountPaid),
      amountRemaining: String(it.amountRemaining),
      date: it.paymentDate.slice(0, 10),
      note: it.note ?? "",
    });
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const paid = Number(form.amountPaid || 0);
    const remaining = Number(form.amountRemaining || 0);

    if (!form.vendor.trim()) {
      toast.error("יש להזין שם ספק");
      return;
    }
    if (paid < 0 || remaining < 0 || (paid === 0 && remaining === 0)) {
      toast.error("הזן סכום חיובי בשולם או שנותר");
      return;
    }
    if (
      form.category === BarMitzvahCategory.OTHER &&
      form.customCategory.trim() === ""
    ) {
      toast.error('יש להזין שם קטגוריה במצב "אחר"');
      return;
    }

    setBusy(true);
    try {
      const payload = {
        vendor: form.vendor.trim(),
        category: form.category,
        customCategory:
          form.category === BarMitzvahCategory.OTHER
            ? form.customCategory.trim()
            : null,
        amountPaid: paid,
        amountRemaining: remaining,
        paymentDate: new Date(`${form.date}T12:00:00`).toISOString(),
        note: form.note.trim() || null,
      };

      if (editingId) {
        await api.patch(`/api/bar-mitzvah/${editingId}`, payload);
        toast.success("עודכן בהצלחה");
      } else {
        await api.post("/api/bar-mitzvah", payload);
        toast.success("נוסף בהצלחה");
      }
      closeForm();
      void load();
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : "שגיאה לא צפויה";
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function onDelete(id: string) {
    if (!confirm("למחוק את ההוצאה?")) return;
    try {
      await api.delete(`/api/bar-mitzvah/${id}`);
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
          <h1 className="text-xl sm:text-2xl font-bold">בר מצווה</h1>
          <p className="text-sm text-muted">
            ניהול כל ההוצאות לבר המצווה — ספקים, סכומים ויתרות.
          </p>
        </div>
        <button type="button" onClick={openAdd} className="btn-primary !px-4">
          <Plus size={16} />
          הוסף
        </button>
      </div>

      {/* ── Summary cards ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <div className="stat-card">
          <p className="text-xs text-muted">שולם</p>
          <p className="text-lg sm:text-xl font-bold tabular-nums text-success">
            {formatMoney(summary.totalPaid)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted">נותר</p>
          <p className="text-lg sm:text-xl font-bold tabular-nums text-warning">
            {formatMoney(summary.totalRemaining)}
          </p>
        </div>
        <div className="stat-card">
          <p className="text-xs text-muted">סה״כ</p>
          <p className="text-lg sm:text-xl font-bold tabular-nums">
            {formatMoney(summary.totalCommitted)}
          </p>
        </div>
      </div>

      {/* ── Add / edit form ──────────────────────────────────────────── */}
      {showForm && (
        <form
          onSubmit={onSubmit}
          className="card p-4 sm:p-6 mt-4 flex flex-col gap-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">
              {editingId ? "עריכת הוצאה" : "הוצאה חדשה"}
            </h2>
            <button
              type="button"
              onClick={closeForm}
              className="btn-ghost h-9 w-9 !p-0 rounded-full"
              aria-label="סגור"
            >
              <X size={18} />
            </button>
          </div>

          {/* Vendor */}
          <div>
            <label htmlFor="vendor" className="label">
              שם / תיאור הספק
            </label>
            <input
              id="vendor"
              type="text"
              required
              maxLength={120}
              value={form.vendor}
              onChange={(e) => setForm({ ...form, vendor: e.target.value })}
              className="input"
              placeholder="לדוגמה: אולם פלאזה, צלם משה כהן"
            />
          </div>

          {/* Category grid */}
          <div>
            <p className="label">קטגוריה</p>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {BM_CATEGORY_ORDER.map((c) => {
                const active = c === form.category;
                return (
                  <button
                    type="button"
                    key={c}
                    onClick={() => setForm({ ...form, category: c })}
                    className={cn(
                      "rounded-xl border p-3 text-sm flex flex-col items-center gap-1.5 transition-colors",
                      active
                        ? "border-primary bg-primary/10 text-text"
                        : "border-border bg-surface-2 hover:bg-border text-muted",
                    )}
                  >
                    <span
                      className="h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold text-white"
                      style={{ backgroundColor: BM_CATEGORY_COLORS[c] }}
                    >
                      {active && <Check size={12} />}
                    </span>
                    <span className="leading-tight text-center">
                      {BM_CATEGORY_LABELS_HE[c]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {form.category === BarMitzvahCategory.OTHER && (
            <div className="animate-fadeIn">
              <label htmlFor="custom" className="label">
                שם הקטגוריה
              </label>
              <input
                id="custom"
                type="text"
                required
                maxLength={80}
                value={form.customCategory}
                onChange={(e) =>
                  setForm({ ...form, customCategory: e.target.value })
                }
                className="input"
                placeholder="לדוגמה: כיפות, מתנה לרב"
              />
            </div>
          )}

          {/* Amounts */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="paid" className="label">
                שולם (₪)
              </label>
              <input
                id="paid"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amountPaid}
                onChange={(e) =>
                  setForm({ ...form, amountPaid: e.target.value })
                }
                className="input text-lg font-semibold tabular-nums"
              />
            </div>
            <div>
              <label htmlFor="remaining" className="label">
                נותר לשלם (₪)
              </label>
              <input
                id="remaining"
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={form.amountRemaining}
                onChange={(e) =>
                  setForm({ ...form, amountRemaining: e.target.value })
                }
                className="input text-lg font-semibold tabular-nums"
              />
            </div>
          </div>

          {/* Date */}
          <div>
            <label htmlFor="date" className="label">
              תאריך תשלום
            </label>
            <input
              id="date"
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              className="input"
              dir="ltr"
            />
          </div>

          {/* Note */}
          <div>
            <label htmlFor="note" className="label">
              הערה (לא חובה)
            </label>
            <input
              id="note"
              type="text"
              maxLength={500}
              value={form.note}
              onChange={(e) => setForm({ ...form, note: e.target.value })}
              className="input"
              placeholder="לדוגמה: מקדמה ראשונה"
            />
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="btn-primary flex-1">
              {busy ? <Loader2 className="animate-spin" size={16} /> : null}
              {editingId ? "שמור שינויים" : "שמור הוצאה"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              disabled={busy}
              className="btn-ghost"
            >
              ביטול
            </button>
          </div>
        </form>
      )}

      {/* ── Per-category breakdown ───────────────────────────────────── */}
      {!loading && byCategory.length > 0 && (
        <div className="card mt-4 p-4">
          <h2 className="text-base font-semibold mb-3">פילוח לפי קטגוריה</h2>
          <ul className="divide-y divide-border">
            {byCategory.map((c) => {
              const total = c.paid + c.remaining;
              const pct =
                summary.totalCommitted > 0
                  ? Math.round((total / summary.totalCommitted) * 100)
                  : 0;
              return (
                <li
                  key={`${c.category}-${c.customLabel}`}
                  className="py-2.5 flex items-center gap-3"
                >
                  <span
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ backgroundColor: BM_CATEGORY_COLORS[c.category] }}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {c.customLabel}
                    </p>
                    <p className="text-xs text-muted">
                      {c.count} הוצאות · {pct}% מהסך הכולל
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatMoney(total)}
                    </p>
                    <p className="text-xs text-muted tabular-nums">
                      שולם {formatMoney(c.paid)} · נותר {formatMoney(c.remaining)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* ── List of all expenses ─────────────────────────────────────── */}
      <div className="card mt-4 p-2 sm:p-3">
        {loading ? (
          <ul className="divide-y divide-border">
            {[0, 1, 2, 3, 4].map((i) => (
              <li key={i} className="flex items-center gap-3 py-3 px-2">
                <div className="h-9 w-9 rounded-full bg-surface-2 animate-pulse" />
                <div className="flex-1">
                  <div className="h-3 w-32 rounded bg-surface-2 animate-pulse" />
                  <div className="h-2.5 w-20 rounded bg-surface-2 animate-pulse mt-2" />
                </div>
                <div className="h-3 w-14 rounded bg-surface-2 animate-pulse" />
              </li>
            ))}
          </ul>
        ) : items.length === 0 ? (
          <EmptyState
            title="עדיין אין הוצאות"
            description='הוסף את ההוצאה הראשונה לחתונה הקטנה הזאת — לחץ על "הוסף" למעלה.'
          />
        ) : (
          <ul className="divide-y divide-border">
            {items.map((it) => {
              const total = it.amountPaid + it.amountRemaining;
              const fullyPaid = it.amountRemaining === 0 && it.amountPaid > 0;
              return (
                <li
                  key={it.id}
                  className="flex items-center gap-3 py-3 px-2"
                >
                  <span
                    className="h-9 w-9 rounded-full flex items-center justify-center text-[10px] font-bold text-white shrink-0"
                    style={{
                      backgroundColor: BM_CATEGORY_COLORS[it.category],
                    }}
                    title={bmCategoryLabel(it.category, it.customCategory)}
                  >
                    {bmCategoryLabel(it.category, it.customCategory).slice(0, 2)}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{it.vendor}</p>
                    <p className="text-xs text-muted">
                      {bmCategoryLabel(it.category, it.customCategory)} ·{" "}
                      {formatDate(it.paymentDate)}
                      {it.note ? ` · ${it.note}` : ""}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-semibold tabular-nums">
                      {formatMoney(total)}
                    </p>
                    <p className="text-xs tabular-nums">
                      {fullyPaid ? (
                        <span className="text-success">שולם במלואו</span>
                      ) : (
                        <>
                          <span className="text-success">
                            {formatMoney(it.amountPaid)}
                          </span>
                          {" / "}
                          <span className="text-warning">
                            {formatMoney(it.amountRemaining)} נותר
                          </span>
                        </>
                      )}
                    </p>
                  </div>
                  <div className="flex flex-col gap-1">
                    <button
                      type="button"
                      onClick={() => openEdit(it)}
                      className="btn-ghost h-8 w-8 !p-0 rounded-full"
                      aria-label="ערוך"
                      title="ערוך"
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDelete(it.id)}
                      className="btn-danger h-8 w-8 !p-0 rounded-full"
                      aria-label="מחק"
                      title="מחק"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </AppShell>
  );
}
